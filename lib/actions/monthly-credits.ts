import { SupabaseClient } from "@supabase/supabase-js"

export const AUTO_CREDIT_REASON_PREFIX = "Attribution mensuelle automatique"

export interface EligibleCompany {
  companyId: string
  creditAmount: number
}

/**
 * Collect all companies eligible for monthly credit allocation:
 * - Spacebring clients with spacebring_monthly_credits > 0
 * - Hopper clients with active contracts linked to plans with credits_per_month > 0
 * Credits are summed if a company qualifies via both paths or has multiple contracts.
 */
export async function collectEligibleCompanies(
  supabase: SupabaseClient
): Promise<EligibleCompany[]> {
  const companyMap = new Map<string, number>()

  // Spacebring clients
  const { data: spacebringCompanies, error: spacebringError } = await supabase
    .from("companies")
    .select("id, spacebring_monthly_credits")
    .eq("from_spacebring", true)
    .gt("spacebring_monthly_credits", 0)

  if (spacebringError) {
    throw new Error(`Failed to fetch Spacebring companies: ${spacebringError.message}`)
  }

  for (const c of spacebringCompanies || []) {
    companyMap.set(c.id, (companyMap.get(c.id) || 0) + c.spacebring_monthly_credits)
  }

  // Hopper clients with active contracts
  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select("company_id, plans (credits_per_month)")
    .eq("status", "active")

  if (contractsError) {
    throw new Error(`Failed to fetch contracts: ${contractsError.message}`)
  }

  for (const c of contracts || []) {
    const plan = c.plans as unknown as { credits_per_month: number | null } | null
    if (plan?.credits_per_month && plan.credits_per_month > 0) {
      companyMap.set(
        c.company_id,
        (companyMap.get(c.company_id) || 0) + plan.credits_per_month
      )
    }
  }

  return Array.from(companyMap.entries()).map(([companyId, creditAmount]) => ({
    companyId,
    creditAmount,
  }))
}

/**
 * Expire previous auto-allocated monthly credits for a company.
 * Only expires credits matching our auto-allocation reason prefix.
 * Manual credits (different reason) are never touched.
 */
export async function expirePreviousAutoCredits(
  supabase: SupabaseClient,
  companyId: string,
  currentPeriodReason: string
) {
  const { data: oldCredits, error } = await supabase
    .from("credits")
    .select("id, remaining_balance")
    .eq("company_id", companyId)
    .gt("remaining_balance", 0)
    .like("reason", `${AUTO_CREDIT_REASON_PREFIX}%`)
    .neq("reason", currentPeriodReason)

  if (error) {
    throw new Error(`Failed to fetch old credits: ${error.message}`)
  }

  if (!oldCredits || oldCredits.length === 0) return

  const { data: currentBalance } = await supabase.rpc("get_company_valid_credits", {
    p_company_id: companyId,
  })
  let runningBalance = (currentBalance as number) ?? 0

  for (const credit of oldCredits) {
    const expiredAmount = credit.remaining_balance

    const { error: updateError } = await supabase
      .from("credits")
      .update({ remaining_balance: 0 })
      .eq("id", credit.id)

    if (updateError) {
      throw new Error(`Failed to expire credit ${credit.id}: ${updateError.message}`)
    }

    const { error: txError } = await supabase.from("credit_transactions").insert({
      credit_id: credit.id,
      company_id: companyId,
      transaction_type: "expiration",
      amount: -expiredAmount,
      balance_before: runningBalance,
      balance_after: runningBalance - expiredAmount,
      reason: "Expiration automatique — crédits mensuels",
    })

    if (txError) {
      throw new Error(`Failed to create expiration transaction: ${txError.message}`)
    }

    runningBalance -= expiredAmount
  }
}

/**
 * Allocate new monthly credits for a company.
 * Creates a credit record with expiration date and an allocation transaction.
 */
export async function allocateMonthlyCredits(
  supabase: SupabaseClient,
  companyId: string,
  amount: number,
  reason: string,
  expiration: string
) {
  const { data: currentBalance } = await supabase.rpc("get_company_valid_credits", {
    p_company_id: companyId,
  })
  const balanceBefore = (currentBalance as number) ?? 0

  const { data: creditRecord, error: insertError } = await supabase
    .from("credits")
    .insert({
      company_id: companyId,
      allocated_credits: amount,
      remaining_balance: amount,
      expiration,
      reason,
    })
    .select("id")
    .single()

  if (insertError) {
    throw new Error(`Failed to insert credit: ${insertError.message}`)
  }

  const { error: txError } = await supabase.from("credit_transactions").insert({
    credit_id: creditRecord.id,
    company_id: companyId,
    transaction_type: "allocation",
    amount,
    balance_before: balanceBefore,
    balance_after: balanceBefore + amount,
    reason,
  })

  if (txError) {
    throw new Error(`Failed to create allocation transaction: ${txError.message}`)
  }
}

/**
 * Process a single company: check idempotency, expire old credits, allocate new ones.
 * Returns true if credits were allocated, false if skipped (already allocated this month).
 */
export async function processCompany(
  supabase: SupabaseClient,
  company: EligibleCompany,
  reason: string,
  expiration: string
): Promise<boolean> {
  // Idempotency: skip if already allocated for this period
  const { data: existing } = await supabase
    .from("credits")
    .select("id")
    .eq("company_id", company.companyId)
    .eq("reason", reason)
    .limit(1)
    .maybeSingle()

  if (existing) return false

  // Expire previous auto-allocated credits
  await expirePreviousAutoCredits(supabase, company.companyId, reason)

  // Allocate new credits
  await allocateMonthlyCredits(
    supabase,
    company.companyId,
    company.creditAmount,
    reason,
    expiration
  )

  return true
}
