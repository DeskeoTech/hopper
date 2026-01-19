"use server"

import { createClient } from "@/lib/supabase/server"

export async function checkEmailExists(email: string): Promise<{ exists: boolean }> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .single()

  return { exists: !!data }
}
