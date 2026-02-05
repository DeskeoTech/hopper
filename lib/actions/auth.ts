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
