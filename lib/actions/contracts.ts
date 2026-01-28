"use server"

import { createClient, getUser } from "@/lib/supabase/server"

export interface ContractHistoryItem {
  id: string
  status: "active" | "suspended" | "terminated"
  start_date: string | null
  commitment_end_date: string | null
  renewal_end_date: string | null
  number_of_seats: number | null
  plan_name: string
  price_per_seat_month: number | null
}

export async function getCompanyContractHistory(companyId: string): Promise<{
  data: ContractHistoryItem[] | null
  error: string | null
}> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { data: null, error: "Non authentifié" }
  }

  const supabase = await createClient()

  // Verify user belongs to this company
  const { data: userProfile } = await supabase
    .from("users")
    .select("company_id")
    .eq("email", authUser.email)
    .single()

  if (userProfile?.company_id !== companyId) {
    return { data: null, error: "Accès non autorisé" }
  }

  // Fetch all contracts for the company with plan details
  const { data: contracts, error } = await supabase
    .from("contracts")
    .select(`
      id,
      status,
      start_date,
      commitment_end_date,
      renewal_end_date,
      Number_of_seats,
      plans (name, price_per_seat_month)
    `)
    .eq("company_id", companyId)
    .order("start_date", { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  const history: ContractHistoryItem[] = (contracts || []).map((c) => {
    const plan = c.plans as unknown as { name: string; price_per_seat_month: number | null } | null
    return {
      id: c.id,
      status: c.status as "active" | "suspended" | "terminated",
      start_date: c.start_date,
      commitment_end_date: c.commitment_end_date,
      renewal_end_date: c.renewal_end_date,
      number_of_seats: c.Number_of_seats ? Number(c.Number_of_seats) : null,
      plan_name: plan?.name || "Inconnu",
      price_per_seat_month: plan?.price_per_seat_month ?? null,
    }
  })

  return { data: history, error: null }
}
