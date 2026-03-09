"use server"

import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export interface ContractSeatsInfo {
  contractId: string
  planName: string
  totalSeats: number
  assignedSeats: number
  availableSeats: number
}

/** Verify the current user is a company admin. Returns admin supabase client + current user on success. */
async function verifyAdmin(): Promise<
  | { authorized: true; supabase: ReturnType<typeof createAdminClient>; currentUser: { id: string; role: string; company_id: string } }
  | { authorized: false; error: string }
> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { authorized: false, error: "Non authentifié" }
  }

  const supabase = createAdminClient()
  const { data: currentUser } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.role !== "admin") {
    return { authorized: false, error: "Accès non autorisé" }
  }

  return { authorized: true, supabase, currentUser }
}

export async function getContractSeatsInfo(contractId: string): Promise<{
  data: ContractSeatsInfo | null
  error: string | null
}> {
  const auth = await verifyAdmin()
  if (!auth.authorized) {
    return { data: null, error: auth.error }
  }

  const { supabase, currentUser } = auth

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select(`
      id,
      company_id,
      Number_of_seats,
      plans (name)
    `)
    .eq("id", contractId)
    .single()

  if (contractError) {
    return { data: null, error: contractError.message }
  }

  if (contract.company_id !== currentUser.company_id) {
    return { data: null, error: "Accès non autorisé" }
  }

  const { count: assignedSeats, error: usersError } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .eq("contract_id", contractId)
    .eq("status", "active")

  if (usersError) {
    return { data: null, error: usersError.message }
  }

  const totalSeats = contract.Number_of_seats ? Number(contract.Number_of_seats) : 0
  const assigned = assignedSeats || 0
  const plan = contract.plans as { name: string } | null

  return {
    data: {
      contractId: contract.id,
      planName: plan?.name || "Contrat",
      totalSeats,
      assignedSeats: assigned,
      availableSeats: Math.max(0, totalSeats - assigned),
    },
    error: null,
  }
}

export async function getCompanyContractsWithSeats(companyId: string): Promise<{
  data: ContractSeatsInfo[] | null
  error: string | null
}> {
  const auth = await verifyAdmin()
  if (!auth.authorized) {
    return { data: null, error: auth.error }
  }

  const { supabase, currentUser } = auth

  if (currentUser.company_id !== companyId) {
    return { data: null, error: "Accès non autorisé" }
  }

  const { data: contracts, error: contractsError } = await supabase
    .from("contracts")
    .select(`
      id,
      Number_of_seats,
      status,
      plans (name)
    `)
    .eq("company_id", companyId)
    .eq("status", "active")
    .order("start_date", { ascending: false })

  if (contractsError) {
    return { data: null, error: contractsError.message }
  }

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("contract_id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .not("contract_id", "is", null)

  if (usersError) {
    return { data: null, error: usersError.message }
  }

  const assignmentCounts: Record<string, number> = {}
  for (const user of users || []) {
    if (user.contract_id) {
      assignmentCounts[user.contract_id] = (assignmentCounts[user.contract_id] || 0) + 1
    }
  }

  const contractsWithSeats: ContractSeatsInfo[] = (contracts || []).map((contract) => {
    const totalSeats = contract.Number_of_seats ? Number(contract.Number_of_seats) : 0
    const assignedSeats = assignmentCounts[contract.id] || 0
    const plan = contract.plans as { name: string } | null

    return {
      contractId: contract.id,
      planName: plan?.name || "Contrat",
      totalSeats,
      assignedSeats,
      availableSeats: Math.max(0, totalSeats - assignedSeats),
    }
  })

  return { data: contractsWithSeats, error: null }
}

export async function assignUserToContract(
  userId: string,
  contractId: string | null
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyAdmin()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const { supabase, currentUser } = auth

  // Verify the target user belongs to the same company
  const { data: targetUser, error: targetUserError } = await supabase
    .from("users")
    .select("id, company_id, contract_id, status")
    .eq("id", userId)
    .single()

  if (targetUserError || !targetUser) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  if (targetUser.company_id !== currentUser.company_id) {
    return { success: false, error: "Accès non autorisé" }
  }

  // If assigning to a contract (not removing assignment)
  if (contractId) {
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, company_id, Number_of_seats, status")
      .eq("id", contractId)
      .single()

    if (contractError || !contract) {
      return { success: false, error: "Contrat non trouvé" }
    }

    if (contract.company_id !== currentUser.company_id) {
      return { success: false, error: "Accès non autorisé" }
    }

    if (contract.status !== "active") {
      return { success: false, error: "Ce contrat n'est pas actif" }
    }

    // Check available seats (only if not reassigning same contract)
    if (targetUser.contract_id !== contractId) {
      const { count: assignedUsers, error: countError } = await supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("contract_id", contractId)
        .eq("status", "active")

      if (countError) {
        return { success: false, error: countError.message }
      }

      const maxSeats = contract.Number_of_seats ? Number(contract.Number_of_seats) : 0
      const currentlyAssigned = assignedUsers || 0

      if (currentlyAssigned >= maxSeats) {
        return { success: false, error: "Ce contrat n'a plus de postes disponibles" }
      }
    }
  }

  // Update the user's contract assignment
  const { error: updateError } = await supabase
    .from("users")
    .update({
      contract_id: contractId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
  revalidatePath("/entreprise")
  revalidatePath(`/admin/clients/${currentUser.company_id}`)

  return { success: true, error: null }
}

export async function unassignUserFromContract(
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  return assignUserToContract(userId, null)
}

export async function toggleOffPlatformLink(
  userId: string,
  linked: boolean
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyAdmin()
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const { supabase, currentUser } = auth

  // Verify the target user belongs to the same company
  const { data: targetUser, error: targetUserError } = await supabase
    .from("users")
    .select("id, company_id, off_platform_linked, status")
    .eq("id", userId)
    .single()

  if (targetUserError || !targetUser) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  if (targetUser.company_id !== currentUser.company_id) {
    return { success: false, error: "Accès non autorisé" }
  }

  // If linking, check spacebring seats availability
  if (linked) {
    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("id, from_spacebring, spacebring_seats")
      .eq("id", currentUser.company_id)
      .single()

    if (companyError || !company) {
      return { success: false, error: "Entreprise non trouvée" }
    }

    if (!company.from_spacebring || !company.spacebring_seats) {
      return { success: false, error: "Aucun abonnement hors plateforme configuré" }
    }

    // Count currently linked users
    const { count: linkedUsers, error: countError } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("company_id", currentUser.company_id)
      .eq("off_platform_linked", true)
      .eq("status", "active")

    if (countError) {
      return { success: false, error: countError.message }
    }

    if ((linkedUsers || 0) >= company.spacebring_seats) {
      return { success: false, error: "L'abonnement hors plateforme n'a plus de postes disponibles" }
    }
  }

  const { error: updateError } = await supabase
    .from("users")
    .update({
      off_platform_linked: linked,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
  revalidatePath("/entreprise")
  revalidatePath(`/admin/clients/${currentUser.company_id}`)

  return { success: true, error: null }
}
