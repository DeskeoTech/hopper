"use server"

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

export interface AdminPassUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  status: string | null
}

export async function getAdminPassUsers(contractId: string): Promise<{
  data: AdminPassUser[] | null
  error: string | null
}> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) {
    return { data: null, error: auth.error }
  }

  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, status")
    .eq("contract_id", contractId)
    .order("last_name")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: users || [], error: null }
}

export async function getAdminCafeUsers(contractId: string): Promise<{
  data: AdminPassUser[] | null
  error: string | null
}> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) {
    return { data: null, error: auth.error }
  }

  const supabase = await createClient()

  const { data: users, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, status")
    .eq("cafe_contract_id", contractId)
    .order("last_name")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: users || [], error: null }
}

export async function getAdminCompanyUsersNotInCafe(
  contractId: string,
  companyId: string
): Promise<{ data: AdminPassUser[] | null; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) {
    return { data: null, error: auth.error }
  }

  const adminClient = createAdminClient()

  const { data: users, error } = await adminClient
    .from("users")
    .select("id, first_name, last_name, email, status")
    .eq("company_id", companyId)
    .eq("status", "active")
    .or(`cafe_contract_id.is.null,cafe_contract_id.neq.${contractId}`)
    .order("last_name")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: users || [], error: null }
}

export async function adminAssignUserToCafeContract(
  userId: string,
  cafeContractId: string | null
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const adminClient = createAdminClient()

  if (cafeContractId) {
    const { data: contract } = await adminClient
      .from("contracts")
      .select("id, Number_of_seats, status")
      .eq("id", cafeContractId)
      .single()

    if (!contract) {
      return { success: false, error: "Contrat café non trouvé" }
    }

    if (contract.status !== "active") {
      return { success: false, error: "Ce forfait café n'est pas actif" }
    }

    const { count: assignedUsers } = await adminClient
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("cafe_contract_id", cafeContractId)
      .eq("status", "active")

    const maxSeats = contract.Number_of_seats ? Number(contract.Number_of_seats) : 0
    if ((assignedUsers || 0) >= maxSeats) {
      return { success: false, error: "Ce forfait café n'a plus de places disponibles" }
    }
  }

  const { error: updateError } = await adminClient
    .from("users")
    .update({
      cafe_contract_id: cafeContractId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, error: null }
}
