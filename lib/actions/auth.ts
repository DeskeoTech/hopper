"use server"

import { createAdminClient } from "@/lib/supabase/admin"

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
