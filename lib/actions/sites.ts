"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SiteStatus, Equipment, TransportationStop, SiteClosure } from "@/lib/types/database"

export async function updateSiteHeader(
  siteId: string,
  data: {
    name: string
    status: SiteStatus
    address: string
    is_coworking: boolean
    is_meeting_room: boolean
  }
) {
  if (data.status === "open" && !data.is_coworking && !data.is_meeting_room) {
    return { error: "Un site ouvert doit avoir au moins une catégorie (Hopper Coworking ou Salle de réunion)" }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      name: data.name,
      status: data.status,
      address: data.address,
      is_coworking: data.is_coworking,
      is_meeting_room: data.is_meeting_room,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/sites")
  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function updateSiteInstructions(
  siteId: string,
  data: { instructions: string | null; access: string | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      instructions: data.instructions || null,
      access: data.access || null,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/sites")
  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function updateSiteInstructionsAndTransportation(
  siteId: string,
  data: {
    instructions: string | null
    instructions_en: string | null
    access_en: string | null
    transportation_lines: TransportationStop[] | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      instructions: data.instructions || null,
      instructions_en: data.instructions_en || null,
      access_en: data.access_en || null,
      transportation_lines: data.transportation_lines && data.transportation_lines.length > 0
        ? data.transportation_lines
        : null,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function updateSiteHours(
  siteId: string,
  data: { opening_hours: string | null; opening_days: string[] | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      opening_hours: data.opening_hours || null,
      opening_days: data.opening_days && data.opening_days.length > 0 ? data.opening_days : null,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function updateSiteWifi(
  siteId: string,
  data: { wifi_ssid: string | null; wifi_password: string | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      wifi_ssid: data.wifi_ssid || null,
      wifi_password: data.wifi_password || null,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function updateSiteEquipments(
  siteId: string,
  data: { equipments: Equipment[] | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      equipments: data.equipments && data.equipments.length > 0 ? data.equipments : null,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function updateSiteTransportation(
  siteId: string,
  data: { transportation_lines: TransportationStop[] | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      transportation_lines: data.transportation_lines && data.transportation_lines.length > 0
        ? data.transportation_lines
        : null,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function getDeskeoUsers() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, email, phone")
    .ilike("email", "%@deskeo.fr")
    .order("first_name")

  if (error) {
    return { error: error.message, data: [] }
  }

  return { data: data || [] }
}

export async function updateSiteContact(
  siteId: string,
  data: {
    contact_first_name: string | null
    contact_last_name: string | null
    contact_email: string | null
    contact_phone: string | null
  }
) {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { error: "Non authentifié" }
  }

  // Verify user is a hopper admin
  const supabase = await createClient()
  const { data: userData } = await supabase
    .from("users")
    .select("is_hopper_admin")
    .eq("email", authUser.email)
    .limit(1)
    .maybeSingle()

  if (!userData?.is_hopper_admin) {
    return { error: "Accès non autorisé" }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from("sites")
    .update({
      contact_first_name: data.contact_first_name || null,
      contact_last_name: data.contact_last_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/sites")
  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function createSitePhotoUploadUrl(siteId: string, fileName: string) {
  const supabase = createAdminClient()

  const fileExt = fileName.split(".").pop()
  const storagePath = `${siteId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from("site-photos")
    .createSignedUploadUrl(storagePath)

  if (error) {
    return { error: error.message }
  }

  return { signedUrl: data.signedUrl, token: data.token, path: storagePath }
}

export async function confirmSitePhoto(
  siteId: string,
  storagePath: string,
  filename: string,
  mimeType: string | null,
  sizeBytes: number | null
) {
  const supabase = createAdminClient()

  const { error: dbError } = await supabase.from("site_photos").insert({
    site_id: siteId,
    storage_path: storagePath,
    filename,
    mime_type: mimeType,
    size_bytes: sizeBytes,
  })

  if (dbError) {
    await supabase.storage.from("site-photos").remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function deleteSitePhoto(siteId: string, photoId: string, storagePath: string) {
  const supabase = createAdminClient()

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from("site-photos")
    .remove([storagePath])

  if (storageError) {
    return { error: storageError.message }
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from("site_photos")
    .delete()
    .eq("id", photoId)

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export interface CreateSiteData {
  // Step 1: Basic info
  name: string
  address: string
  status: SiteStatus
  is_coworking: boolean
  is_meeting_room: boolean
  access: string | null
  instructions: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  is_nomad: boolean
  // Step 2: Hours & Equipment
  opening_days: string[] | null
  opening_hours: string | null
  equipments: Equipment[] | null
  transportation_lines: TransportationStop[] | null
  // Step 3: Contact
  contact_first_name: string | null
  contact_last_name: string | null
  contact_email: string | null
  contact_phone: string | null
}

export async function createSite(data: CreateSiteData) {
  const supabase = await createClient()

  const { data: site, error } = await supabase
    .from("sites")
    .insert({
      name: data.name,
      address: data.address,
      status: data.status || "open",
      is_coworking: data.is_coworking,
      is_meeting_room: data.is_meeting_room,
      access: data.access || null,
      instructions: data.instructions || null,
      wifi_ssid: data.wifi_ssid || null,
      wifi_password: data.wifi_password || null,
      is_nomad: data.is_nomad,
      opening_days: data.opening_days && data.opening_days.length > 0 ? data.opening_days : null,
      opening_hours: data.opening_hours || null,
      equipments: data.equipments && data.equipments.length > 0 ? data.equipments : null,
      transportation_lines: data.transportation_lines && data.transportation_lines.length > 0 ? data.transportation_lines : null,
      contact_first_name: data.contact_first_name || null,
      contact_last_name: data.contact_last_name || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/sites")
  return { success: true, siteId: site.id }
}

// --- Site Closures ---

export async function getSiteClosures(
  siteId: string
): Promise<{ closures: SiteClosure[]; error?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_closures")
    .select("*")
    .eq("site_id", siteId)
    .order("date", { ascending: true })

  if (error) return { closures: [], error: error.message }
  return { closures: (data as SiteClosure[]) || [] }
}

export async function addSiteClosure(
  siteId: string,
  date: string,
  reason?: string
): Promise<{ success?: boolean; error?: string; closure?: SiteClosure }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("site_closures")
    .upsert(
      { site_id: siteId, date, reason: reason || null },
      { onConflict: "site_id,date" }
    )
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true, closure: data as SiteClosure }
}

export async function removeSiteClosure(
  siteId: string,
  closureId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from("site_closures")
    .delete()
    .eq("id", closureId)
    .eq("site_id", siteId)

  if (error) return { error: error.message }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function getSiteClosureDates(
  siteId: string
): Promise<Set<string>> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("site_closures")
    .select("date")
    .eq("site_id", siteId)

  const dates = new Set<string>()
  data?.forEach((row: { date: string }) => dates.add(row.date))
  return dates
}
