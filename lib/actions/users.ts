"use server"

import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ensureSupabaseAuthUser } from "@/lib/actions/auth"
import type { UserRole, UserStatus, User } from "@/lib/types/database"

/** Verify the current user is a company admin. Returns supabase admin client + current user on success. */
async function verifyCompanyAdmin(companyId: string): Promise<
  | { authorized: true; supabase: ReturnType<typeof createAdminClient>; currentUser: { id: string; role: string; company_id: string } }
  | { authorized: false; error: string }
> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { authorized: false, error: "Non authentifié" }
  }

  const supabase = createAdminClient()
  const { data: currentUser } = await supabase
    .from("users")
    .select("id, role, company_id")
    .eq("email", authUser.email)
    .single()

  if (!currentUser || currentUser.company_id !== companyId || currentUser.role !== "admin") {
    return { authorized: false, error: "Accès non autorisé" }
  }

  return { authorized: true, supabase, currentUser }
}

export async function getCompanyUsers(companyId: string): Promise<{ data: User[] | null; error: string | null }> {
  const auth = await verifyCompanyAdmin(companyId)
  if (!auth.authorized) {
    return { data: null, error: auth.error }
  }

  const supabase = auth.supabase

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, phone, role, status, company_id, badge_number, badge_returned, is_hopper_admin, created_at, updated_at")
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
  const auth = await verifyCompanyAdmin(companyId)
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const { supabase, currentUser } = auth

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
  revalidatePath("/mon-compte")
  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true, error: null }
}

export async function deactivateUserByAdmin(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyCompanyAdmin(companyId)
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const { supabase, currentUser } = auth

  // Prevent admin from deactivating themselves
  if (currentUser.id === userId) {
    return { success: false, error: "Vous ne pouvez pas vous désactiver vous-même" }
  }

  const { error } = await supabase
    .from("users")
    .update({
      status: "inactive",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId)
    .eq("company_id", companyId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
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
    badge_number?: string | null
    badge_returned?: boolean
  }
) {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { error: "Non authentifié" }
  }

  // Use admin client to bypass RLS recursive policy on users table
  const supabase = createAdminClient()

  const { error } = await supabase.from("users").insert({
    company_id: companyId,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || "user",
    status: "active",
    badge_number: data.badge_number || null,
    badge_returned: data.badge_returned ?? false,
  })

  if (error) {
    return { error: error.message }
  }

  // Pré-créer le compte Auth pour que signInWithOtp envoie le magic link
  // (après l'INSERT pour que la vérification interne passe)
  if (data.email) {
    const authResult = await ensureSupabaseAuthUser(data.email)
    if (!authResult.success) {
      await supabase.from("users").delete().eq("email", data.email)
      return { error: authResult.error }
    }
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
    badge_number?: string | null
    badge_returned?: boolean
  }
) {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { error: "Non authentifié" }
  }

  // Use admin client to bypass RLS recursive policy on users table
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("users")
    .update({
      first_name: data.first_name || null,
      last_name: data.last_name || null,
      email: data.email || null,
      phone: data.phone || null,
      role: data.role,
      badge_number: data.badge_number || null,
      badge_returned: data.badge_returned ?? false,
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
  const authUser = await getUser()
  if (!authUser?.email) {
    return { error: "Non authentifié" }
  }

  // Use admin client to bypass RLS recursive policy on users table
  const supabase = createAdminClient()

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

export async function getCompanySeatsInfo(companyId: string): Promise<{
  data: { activeUsers: number; maxSeats: number } | null
  error: string | null
}> {
  const auth = await verifyCompanyAdmin(companyId)
  if (!auth.authorized) {
    return { data: null, error: auth.error }
  }

  const supabase = auth.supabase

  // Count active users in the company
  const { count: activeUsers, error: usersError } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("company_id", companyId)
    .eq("status", "active")

  if (usersError) {
    return { data: null, error: usersError.message }
  }

  // Get the active contract's Number_of_seats
  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .select("Number_of_seats")
    .eq("company_id", companyId)
    .eq("status", "active")
    .single()

  if (contractError && contractError.code !== "PGRST116") {
    return { data: null, error: contractError.message }
  }

  let maxSeats = contract?.Number_of_seats ? Number(contract.Number_of_seats) : 0

  // If no platform contract seats, check for off-platform (spacebring) seats
  if (maxSeats === 0) {
    const { data: company } = await supabase
      .from("companies")
      .select("from_spacebring, spacebring_seats")
      .eq("id", companyId)
      .single()

    if (company?.from_spacebring && company.spacebring_seats) {
      maxSeats = company.spacebring_seats
    }
  }

  return {
    data: {
      activeUsers: activeUsers || 0,
      maxSeats,
    },
    error: null,
  }
}

export async function toggleHopperAdmin(
  userId: string,
  companyId: string,
  newValue: boolean
): Promise<{ success: boolean; error: string | null }> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  if (authUser.email !== "tech@deskeo.fr") {
    return { success: false, error: "Accès non autorisé" }
  }

  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = {
    is_hopper_admin: newValue,
    updated_at: new Date().toISOString(),
  }

  // Quand on active le flag admin, assigner le premier site ouvert par défaut
  if (newValue) {
    const { data: defaultSite } = await supabase
      .from("sites")
      .select("id")
      .eq("status", "open")
      .order("name")
      .limit(1)
      .single()
    if (defaultSite) {
      updateData.site_id = defaultSite.id
    }
  }

  const { error } = await supabase
    .from("users")
    .update(updateData)
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true, error: null }
}

export async function deleteUser(
  userId: string,
  companyId: string
): Promise<{ success: boolean; error: string | null }> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  // Use admin client to bypass RLS recursive policy on users table
  const supabase = createAdminClient()

  // Allow tech admin or any Hopper admin
  const { data: currentUser } = await supabase
    .from("users")
    .select("id, is_hopper_admin")
    .eq("email", authUser.email)
    .single()

  if (!currentUser?.is_hopper_admin && authUser.email !== "tech@deskeo.fr") {
    return { success: false, error: "Accès non autorisé" }
  }

  // Prevent deleting yourself
  if (currentUser?.id === userId) {
    return { success: false, error: "Vous ne pouvez pas supprimer votre propre compte" }
  }

  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/clients")
  return { success: true, error: null }
}

export async function createUserByAdmin(
  companyId: string,
  data: {
    first_name: string | null
    last_name: string | null
    email: string | null
    phone: string | null
    role: UserRole | null
    badge_number?: string | null
    badge_returned?: boolean
  }
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyCompanyAdmin(companyId)
  if (!auth.authorized) {
    return { success: false, error: auth.error }
  }

  const supabase = auth.supabase

  // Check if email already exists
  if (data.email) {
    const { data: existingUser } = await supabase
      .from("users")
      .select("id, company_id")
      .eq("email", data.email)
      .single()

    if (existingUser) {
      if (existingUser.company_id) {
        return { success: false, error: "Cet email est déjà lié à une entreprise" }
      }
      return { success: false, error: "Cet email existe déjà dans le système" }
    }
  }

  // Check seats quota
  const seatsInfo = await getCompanySeatsInfo(companyId)
  if (seatsInfo.error) {
    return { success: false, error: seatsInfo.error }
  }

  if (seatsInfo.data && seatsInfo.data.activeUsers >= seatsInfo.data.maxSeats) {
    return { success: false, error: "Quota de sièges atteint" }
  }

  // Create the user
  const { error } = await supabase.from("users").insert({
    company_id: companyId,
    first_name: data.first_name || null,
    last_name: data.last_name || null,
    email: data.email || null,
    phone: data.phone || null,
    role: data.role || "user",
    status: "active",
    badge_number: data.badge_number || null,
    badge_returned: data.badge_returned ?? false,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  // Pré-créer le compte Auth pour que signInWithOtp envoie le magic link
  // (après l'INSERT pour que la vérification interne passe)
  if (data.email) {
    const authResult = await ensureSupabaseAuthUser(data.email)
    if (!authResult.success) {
      await supabase.from("users").delete().eq("email", data.email)
      return { success: false, error: authResult.error }
    }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
  revalidatePath("/entreprise")
  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true, error: null }
}
