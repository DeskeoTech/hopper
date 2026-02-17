"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { SiteStatus, Equipment, TransportationStop } from "@/lib/types/database"

export async function updateSiteHeader(
  siteId: string,
  data: { name: string; status: SiteStatus; address: string }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("sites")
    .update({
      name: data.name,
      status: data.status,
      address: data.address,
    })
    .eq("id", siteId)

  if (error) {
    return { error: error.message }
  }

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

export async function uploadSitePhoto(siteId: string, formData: FormData) {
  const supabase = await createClient()
  const file = formData.get("file") as File

  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${siteId}/${Date.now()}.${fileExt}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("site-photos")
    .upload(fileName, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Get current max order
  const { data: existingPhotos } = await supabase
    .from("site_photos")
    .select("display_order")
    .eq("site_id", siteId)
    .order("display_order", { ascending: false })
    .limit(1)

  const nextOrder = existingPhotos && existingPhotos.length > 0
    ? (existingPhotos[0].display_order || 0) + 1
    : 0

  // Create database record
  const { error: dbError } = await supabase.from("site_photos").insert({
    site_id: siteId,
    storage_path: fileName,
    filename: file.name,
    display_order: nextOrder,
  })

  if (dbError) {
    // Cleanup uploaded file if db insert fails
    await supabase.storage.from("site-photos").remove([fileName])
    return { error: dbError.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function deleteSitePhoto(siteId: string, photoId: string, storagePath: string) {
  const supabase = await createClient()

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
