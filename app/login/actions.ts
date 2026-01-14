"use server"

import { redirect } from "next/navigation"
import { getSupabaseServerClient } from "@/lib/supabase/server"

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get("email") as string

  if (!email) {
    return { error: "L'adresse email est requise" }
  }

  const supabase = await getSupabaseServerClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/confirm`,
    },
  })

  if (error) {
    return { error: "Une erreur est survenue. Veuillez réessayer." }
  }

  return { success: true }
}

export async function signOut() {
  const supabase = await getSupabaseServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}
