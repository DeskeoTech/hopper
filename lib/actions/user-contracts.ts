"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"

export interface ContractSeatsInfo {
  contractId: string
  planName: string
  totalSeats: number
  assignedSeats: number
  availableSeats: number
}

export async function getContractSeatsInfo(contractId: string): Promise<{
  data: ContractSeatsInfo | null
  error: string | null
}> {
  const supabase = await createClient()

  // Verify the current user has permission
  const authUser = await getUser()
  if (!authUser?.email) {
    return { data: null, error: "Non authentifié" }
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.role !== "admin") {
    return { data: null, error: "Accès non autorisé" }
  }

  // Get the contract with plan info
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

  // Verify the contract belongs to the admin's company
  if (contract.company_id !== currentUser.company_id) {
    return { data: null, error: "Accès non autorisé" }
  }

  // Count users assigned to this contract
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
  const supabase = await createClient()

  // Verify the current user has permission
  const authUser = await getUser()
  if (!authUser?.email) {
    return { data: null, error: "Non authentifié" }
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.company_id !== companyId || currentUser.role !== "admin") {
    return { data: null, error: "Accès non autorisé" }
  }

  // Get all contracts for the company
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

  // Get all users with their contract assignments
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("contract_id")
    .eq("company_id", companyId)
    .eq("status", "active")
    .not("contract_id", "is", null)

  if (usersError) {
    return { data: null, error: usersError.message }
  }

  // Count assignments per contract
  const assignmentCounts: Record<string, number> = {}
  for (const user of users || []) {
    if (user.contract_id) {
      assignmentCounts[user.contract_id] = (assignmentCounts[user.contract_id] || 0) + 1
    }
  }

  // Map contracts with seat info
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
  const supabase = await createClient()

  // Verify the current user has permission
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.role !== "admin") {
    return { success: false, error: "Accès non autorisé" }
  }

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
    // Verify the contract belongs to the same company
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
