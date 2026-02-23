"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"

export async function updateAdminProfile(
  data: { first_name: string; last_name: string }
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, is_hopper_admin")
    .eq("email", authUser.email)
    .eq("is_hopper_admin", true)
    .single()

  if (!currentUser) {
    return { success: false, error: "Accès non autorisé" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      first_name: data.first_name.trim() || null,
      last_name: data.last_name.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", currentUser.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/compte")
  revalidatePath("/admin")
  return { success: true, error: null }
}
