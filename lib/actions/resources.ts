"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { ResourceType, FloorLevel, ResourceEquipment } from "@/lib/types/database"

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
