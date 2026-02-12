"use server"

import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function acceptCgu() {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { error: "Non autorisé" }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("users")
    .update({
      cgu_accepted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("email", authUser.email)

  if (error) {
    console.error("Error accepting CGU:", error)
    return { error: "Erreur lors de l'acceptation des CGU" }
  }

  revalidatePath("/")
  return { success: true }
}
