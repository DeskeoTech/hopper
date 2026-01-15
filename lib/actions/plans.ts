"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { PlanRecurrence, PlanServiceType } from "@/lib/types/database"

export async function createPlan(data: {
  name: string
  price_per_seat_month: number | null
  credits_per_month: number | null
  credits_per_person_month: number | null
  recurrence: PlanRecurrence | null
  service_type: PlanServiceType | null
  notes: string | null
}) {
  const supabase = await createClient()

  const { error } = await supabase.from("plans").insert({
    name: data.name,
    price_per_seat_month: data.price_per_seat_month,
    credits_per_month: data.credits_per_month,
    credits_per_person_month: data.credits_per_person_month,
    recurrence: data.recurrence,
    service_type: data.service_type,
    notes: data.notes || null,
    archived: false,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}

export async function updatePlan(
  planId: string,
  data: {
    name: string
    price_per_seat_month: number | null
    credits_per_month: number | null
    credits_per_person_month: number | null
    recurrence: PlanRecurrence | null
    service_type: PlanServiceType | null
    notes: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("plans")
    .update({
      name: data.name,
      price_per_seat_month: data.price_per_seat_month,
      credits_per_month: data.credits_per_month,
      credits_per_person_month: data.credits_per_person_month,
      recurrence: data.recurrence,
      service_type: data.service_type,
      notes: data.notes || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}

export async function togglePlanArchived(planId: string, archived: boolean) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("plans")
    .update({
      archived,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}

export async function updatePlanSites(planId: string, siteIds: string[]) {
  const supabase = await createClient()

  // Delete existing associations
  const { error: deleteError } = await supabase
    .from("plan_sites")
    .delete()
    .eq("plan_id", planId)

  if (deleteError) {
    return { error: deleteError.message }
  }

  // Insert new associations
  if (siteIds.length > 0) {
    const { error: insertError } = await supabase.from("plan_sites").insert(
      siteIds.map((siteId) => ({
        plan_id: planId,
        site_id: siteId,
      }))
    )

    if (insertError) {
      return { error: insertError.message }
    }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}

export async function addPlanSite(planId: string, siteId: string) {
  const supabase = await createClient()

  const { error } = await supabase.from("plan_sites").insert({
    plan_id: planId,
    site_id: siteId,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}

export async function removePlanSite(planId: string, siteId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("plan_sites")
    .delete()
    .eq("plan_id", planId)
    .eq("site_id", siteId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/settings")
  return { success: true }
}
