"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

async function verifyHopperAdmin(): Promise<{ authorized: boolean; error: string | null }> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { authorized: false, error: "Non authentifié" }
  }

  const supabase = await createClient()
  const { data: user } = await supabase
    .from("users")
    .select("is_hopper_admin")
    .eq("email", authUser.email)
    .single()

  if (!user?.is_hopper_admin) {
    return { authorized: false, error: "Accès non autorisé" }
  }

  return { authorized: true, error: null }
}

export async function addCredits(
  companyId: string,
  amount: number,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  if (amount <= 0) {
    return { success: false, error: "Le montant doit être positif" }
  }

  const supabase = createAdminClient()
  const adjustmentReason = reason || "Ajout manuel de crédits"

  // Get current balance
  const { data: currentBalance } = await supabase
    .rpc("get_company_valid_credits", { p_company_id: companyId })

  const balanceBefore = currentBalance ?? 0

  // Create credit record
  const { data: creditRecord, error: insertError } = await supabase
    .from("credits")
    .insert({
      company_id: companyId,
      allocated_credits: amount,
      remaining_balance: amount,
      expiration: null,
      reason: adjustmentReason,
    })
    .select("id")
    .single()

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  // Create transaction record
  const { error: txError } = await supabase.from("credit_transactions").insert({
    credit_id: creditRecord.id,
    company_id: companyId,
    transaction_type: "allocation",
    amount: amount,
    balance_before: balanceBefore,
    balance_after: balanceBefore + amount,
    reason: adjustmentReason,
  })

  if (txError) {
    return { success: false, error: txError.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true, error: null }
}

export async function removeCredits(
  companyId: string,
  amount: number,
  reason?: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  if (amount <= 0) {
    return { success: false, error: "Le montant doit être positif" }
  }

  const supabase = createAdminClient()
  const adjustmentReason = reason || "Retrait manuel de crédits"

  // Get current balance
  const { data: currentBalance } = await supabase
    .rpc("get_company_valid_credits", { p_company_id: companyId })

  const balanceBefore = currentBalance ?? 0

  if (amount > balanceBefore) {
    return { success: false, error: "Crédits insuffisants pour ce retrait" }
  }

  // Find credit records with remaining balance
  const { data: creditRecords, error: fetchError } = await supabase
    .from("credits")
    .select("id, remaining_balance")
    .eq("company_id", companyId)
    .gt("remaining_balance", 0)
    .or("expiration.is.null,expiration.gt.now()")
    .order("created_at", { ascending: false })

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  if (!creditRecords || creditRecords.length === 0) {
    return { success: false, error: "Aucun crédit disponible à retirer" }
  }

  // Deduct credits from records
  let remainingToDeduct = amount
  let lastCreditId: string | null = null

  for (const record of creditRecords) {
    if (remainingToDeduct <= 0) break

    const deductFromThis = Math.min(remainingToDeduct, record.remaining_balance)
    const newBalance = record.remaining_balance - deductFromThis

    const { error: updateError } = await supabase
      .from("credits")
      .update({ remaining_balance: newBalance })
      .eq("id", record.id)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    remainingToDeduct -= deductFromThis
    lastCreditId = record.id
  }

  // Create transaction record
  if (lastCreditId) {
    const { error: txError } = await supabase.from("credit_transactions").insert({
      credit_id: lastCreditId,
      company_id: companyId,
      transaction_type: "adjustment",
      amount: -amount,
      balance_before: balanceBefore,
      balance_after: balanceBefore - amount,
      reason: adjustmentReason,
    })

    if (txError) {
      return { success: false, error: txError.message }
    }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true, error: null }
}
