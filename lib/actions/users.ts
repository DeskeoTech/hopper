"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import type { UserRole, UserStatus, User } from "@/lib/types/database"

export async function getCompanyUsers(companyId: string): Promise<{ data: User[] | null; error: string | null }> {
  const supabase = await createClient()

  // Verify the current user has permission to view company users
  const authUser = await getUser()
  if (!authUser?.email) {
    return { data: null, error: "Non authentifié" }
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.company_id !== companyId || currentUser.role !== "admin") {
    return { data: null, error: "Accès non autorisé" }
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", companyId)
    .order("last_name", { ascending: true })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}

export async function updateUserRoleByAdmin(
  userId: string,
  companyId: string,
  newRole: "admin" | "user"
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  // Verify the current user has permission
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.company_id !== companyId || currentUser.role !== "admin") {
    return { success: false, error: "Accès non autorisé" }
  }

  // Prevent admin from changing their own role
  if (currentUser.id === userId) {
    return { success: false, error: "Vous ne pouvez pas modifier votre propre rôle" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      role: newRole,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("company_id", companyId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/compte")
  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true, error: null }
}

export async function deactivateUserByAdmin(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error: string | null }> {
  const supabase = await createClient()

  // Verify the current user has permission
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  const { data: currentUser } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.company_id !== companyId || currentUser.role !== "admin") {
    return { success: false, error: "Accès non autorisé" }
  }

  // Prevent admin from deactivating themselves
  if (currentUser.id === userId) {
    return { success: false, error: "Vous ne pouvez pas vous désactiver vous-même" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      status: "disabled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("company_id", companyId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/compte")
  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true, error: null }
}

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
