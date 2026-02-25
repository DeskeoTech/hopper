"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  // Use admin client to bypass RLS - this allows checking email existence
  // before user authentication (on login page)
  //
  // SECURITY NOTE: This function exposes account enumeration risk.
  // Mitigations should be implemented at the UI level (generic messages)
  // or via rate limiting on the API gateway.
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .limit(1)
    .maybeSingle()

  return { exists: data !== null }
}

export async function ensureSupabaseAuthUser(
  email: string
): Promise<{ success: boolean; error: string | null }> {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Email invalide" }
  }

  const adminClient = createAdminClient()

  // Guard: only create Auth accounts for emails that exist in the users table
  const { data: existingUser } = await adminClient
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .limit(1)
    .maybeSingle()

  if (!existingUser) {
    return { success: false, error: "Utilisateur non trouvé" }
  }

  const { error } = await adminClient.auth.admin.createUser({
    email: email.toLowerCase(),
    email_confirm: true,
  })

  if (error) {
    // Si l'utilisateur Auth existe déjà, c'est OK (idempotent)
    if (error.message.includes("already been registered")) {
      return { success: true, error: null }
    }
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}

export async function getPostLoginRedirectUrl(): Promise<{
  url: string
  error: string | null
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) {
    return { url: "/login", error: "Session invalide" }
  }

  const { data: existingUser } = await supabase
    .from("users")
    .select("id, role, company_id, contract_id, is_hopper_admin")
    .eq("email", user.email)
    .single()

  if (!existingUser) {
    await supabase.auth.signOut()
    return { url: "/login?error=no_account", error: "no_account" }
  }

  // Auto-assign first user of a company to the first contract
  if (existingUser.company_id && !existingUser.contract_id) {
    const { count: userCount } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("company_id", existingUser.company_id)

    if (userCount === 1) {
      const { data: firstContract } = await supabase
        .from("contracts")
        .select("id")
        .eq("company_id", existingUser.company_id)
        .order("start_date", { ascending: true })
        .limit(1)
        .single()

      if (firstContract) {
        await supabase
          .from("users")
          .update({ contract_id: firstContract.id })
          .eq("id", existingUser.id)
      }
    }
  }

  if (existingUser.is_hopper_admin) {
    return { url: "/admin", error: null }
  }

  if (existingUser.role === "user") {
    return { url: "/compte", error: null }
  }

  return { url: "/compte", error: null }
}
