"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ResourceType, FloorLevel, ResourceEquipment, ResourcePhoto } from "@/lib/types/database"

interface ResourceData {
  name: string
  type: ResourceType
  capacity: number | null
  floor: FloorLevel | null
  hourly_credit_rate: number | null
  equipments: ResourceEquipment[] | null
  status: "available" | "unavailable"
}

export async function createResource(siteId: string, data: ResourceData) {
  const supabase = await createClient()

  const { error } = await supabase.from("resources").insert({
    site_id: siteId,
    name: data.name,
    type: data.type,
    capacity: data.capacity,
    floor: data.floor,
    hourly_credit_rate: data.hourly_credit_rate,
    equipments: data.equipments && data.equipments.length > 0 ? data.equipments : null,
    status: data.status,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function updateResource(resourceId: string, siteId: string, data: ResourceData) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("resources")
    .update({
      name: data.name,
      type: data.type,
      capacity: data.capacity,
      floor: data.floor,
      hourly_credit_rate: data.hourly_credit_rate,
      equipments: data.equipments && data.equipments.length > 0 ? data.equipments : null,
      status: data.status,
    })
    .eq("id", resourceId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function createResourcePhotoUploadUrl(resourceId: string, fileName: string) {
  const supabase = createAdminClient()

  const fileExt = fileName.split(".").pop()
  const storagePath = `${resourceId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from("resource-photos")
    .createSignedUploadUrl(storagePath)

  if (error) {
    return { error: error.message }
  }

  return { signedUrl: data.signedUrl, token: data.token, path: storagePath }
}

export async function confirmResourcePhoto(
  resourceId: string,
  siteId: string,
  storagePath: string,
  filename: string,
  mimeType: string | null,
  sizeBytes: number | null
) {
  const supabase = createAdminClient()

  const { error: dbError } = await supabase.from("resource_photos").insert({
    resource_id: resourceId,
    storage_path: storagePath,
    filename,
    mime_type: mimeType,
    size_bytes: sizeBytes,
  })

  if (dbError) {
    await supabase.storage.from("resource-photos").remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function deleteResourcePhoto(resourceId: string, siteId: string, photoId: string, storagePath: string) {
  const supabase = createAdminClient()

  const { error: storageError } = await supabase.storage
    .from("resource-photos")
    .remove([storagePath])

  if (storageError) {
    return { error: storageError.message }
  }

  const { error: dbError } = await supabase
    .from("resource_photos")
    .delete()
    .eq("id", photoId)

  if (dbError) {
    return { error: dbError.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}
