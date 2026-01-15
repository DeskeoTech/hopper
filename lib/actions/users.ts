"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { UserRole, UserStatus } from "@/lib/types/database"

export async function createUser(
  companyId: string,
  data: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    role: UserRole | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase.from("users").insert({
    company_id: companyId,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || "user",
    status: "active",
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}

export async function updateUser(
  userId: string,
  companyId: string,
  data: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    role: UserRole | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("users")
    .update({
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}

export async function toggleUserStatus(userId: string, companyId: string, newStatus: UserStatus) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("users")
    .update({
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}
