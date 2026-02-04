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

export interface ContractUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  photo_storage_path: string | null
}

export async function getContractUsers(contractId: string): Promise<{
  data: ContractUser[] | null
  error: string | null
}> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { data: null, error: "Non authentifié" }
  }

  const supabase = await createClient()

  // Get current user's company and role
  const { data: currentUser } = await supabase
    .from("users")
    .select("company_id, role, contract_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser) {
    return { data: null, error: "Utilisateur non trouvé" }
  }

  // Verify the contract belongs to the user's company
  const { data: contract } = await supabase
    .from("contracts")
    .select("company_id")
    .eq("id", contractId)
    .single()

  if (!contract || contract.company_id !== currentUser.company_id) {
    return { data: null, error: "Accès non autorisé" }
  }

  // Regular users can only see their own contract's users
  const isAdmin = currentUser.role === "admin"
  if (!isAdmin && currentUser.contract_id !== contractId) {
    return { data: null, error: "Accès non autorisé" }
  }

  // Fetch users assigned to this contract
  const { data: users, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, photo_storage_path")
    .eq("contract_id", contractId)
    .eq("status", "active")
    .order("last_name")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: users || [], error: null }
}

export async function getCompanyUsersNotInContract(
  contractId: string,
  companyId: string
): Promise<{
  data: ContractUser[] | null
  error: string | null
}> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { data: null, error: "Non authentifié" }
  }

  const supabase = await createClient()

  // Get current user's company and role
  const { data: currentUser } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("email", authUser.email)
    .single()

  if (!currentUser) {
    return { data: null, error: "Utilisateur non trouvé" }
  }

  // Only admins can access this
  const isAdmin = currentUser.role === "admin"
  if (!isAdmin || currentUser.company_id !== companyId) {
    return { data: null, error: "Accès non autorisé" }
  }

  // Fetch users from the company who are NOT assigned to this contract
  const { data: users, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, photo_storage_path")
    .eq("company_id", companyId)
    .eq("status", "active")
    .or(`contract_id.is.null,contract_id.neq.${contractId}`)
    .order("last_name")

  if (error) {
    return { data: null, error: error.message }
  }

  return { data: users || [], error: null }
}

export async function assignUserToContract(
  userId: string,
  contractId: string
): Promise<{ success: boolean; error: string | null }> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  const supabase = await createClient()

  // Get current user's company and role
  const { data: currentUser } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("email", authUser.email)
    .single()

  if (!currentUser) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  // Only admins can assign users
  const isAdmin = currentUser.role === "admin"
  if (!isAdmin) {
    return { success: false, error: "Accès non autorisé" }
  }

  // Verify the contract belongs to the user's company
  const { data: contract } = await supabase
    .from("contracts")
    .select("company_id")
    .eq("id", contractId)
    .single()

  if (!contract || contract.company_id !== currentUser.company_id) {
    return { success: false, error: "Contrat non trouvé" }
  }

  // Verify the target user belongs to the same company
  const { data: targetUser } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single()

  if (!targetUser || targetUser.company_id !== currentUser.company_id) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  // Assign the user to the contract
  const { error } = await supabase
    .from("users")
    .update({
      contract_id: contractId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function removeUserFromContract(
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  const supabase = await createClient()

  // Get current user's company and role
  const { data: currentUser } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("email", authUser.email)
    .single()

  if (!currentUser) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  // Only admins can remove users
  const isAdmin = currentUser.role === "admin"
  if (!isAdmin) {
    return { success: false, error: "Accès non autorisé" }
  }

  // Verify the target user belongs to the same company
  const { data: targetUser } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single()

  if (!targetUser || targetUser.company_id !== currentUser.company_id) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  // Remove the user from contract
  const { error } = await supabase
    .from("users")
    .update({
      contract_id: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function createUserForContract(
  companyId: string,
  contractId: string,
  data: {
    first_name: string
    last_name: string
    email: string
  }
): Promise<{ success: boolean; error: string | null }> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  const supabase = await createClient()

  // Get current user's company and role
  const { data: currentUser } = await supabase
    .from("users")
    .select("company_id, role")
    .eq("email", authUser.email)
    .single()

  if (!currentUser) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  // Only admins can create users
  const isAdmin = currentUser.role === "admin"
  if (!isAdmin || currentUser.company_id !== companyId) {
    return { success: false, error: "Accès non autorisé" }
  }

  // Verify the contract belongs to the company
  const { data: contract } = await supabase
    .from("contracts")
    .select("company_id")
    .eq("id", contractId)
    .single()

  if (!contract || contract.company_id !== companyId) {
    return { success: false, error: "Contrat non trouvé" }
  }

  // Check if email already exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("email", data.email)
    .single()

  if (existingUser) {
    return { success: false, error: "Un utilisateur avec cet email existe déjà" }
  }

  // Create the user with contract_id
  const { error } = await supabase.from("users").insert({
    company_id: companyId,
    contract_id: contractId,
    first_name: data.first_name,
    last_name: data.last_name,
    email: data.email,
    role: "user",
    status: "active",
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
