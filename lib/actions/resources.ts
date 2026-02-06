"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
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

export async function uploadResourcePhoto(resourceId: string, siteId: string, formData: FormData) {
  const supabase = await createClient()
  const file = formData.get("file") as File

  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  const fileExt = file.name.split(".").pop()
  const fileName = `${resourceId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("resource-photos")
    .upload(fileName, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  const { data: existingPhotos } = await supabase
    .from("resource_photos")
    .select("display_order")
    .eq("resource_id", resourceId)
    .order("display_order", { ascending: false })
    .limit(1)

  const nextOrder = existingPhotos && existingPhotos.length > 0
    ? (existingPhotos[0].display_order || 0) + 1
    : 0

  const { error: dbError } = await supabase.from("resource_photos").insert({
    resource_id: resourceId,
    storage_path: fileName,
    filename: file.name,
    display_order: nextOrder,
  })

  if (dbError) {
    await supabase.storage.from("resource-photos").remove([fileName])
    return { error: dbError.message }
  }

  revalidatePath(`/admin/sites/${siteId}`)
  return { success: true }
}

export async function deleteResourcePhoto(resourceId: string, siteId: string, photoId: string, storagePath: string) {
  const supabase = await createClient()

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
