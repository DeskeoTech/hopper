"use server"

import { createClient, getUser } from "@/lib/supabase/server"

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
