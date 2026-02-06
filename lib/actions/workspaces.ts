"use server"

import { createClient } from "@/lib/supabase/server"
import type { FlexPassOffer, FlexDeskAvailability } from "@/lib/types/database"

export async function getFlexPasses(): Promise<{
  passes: FlexPassOffer[]
  error?: string
}> {
  const supabase = await createClient()

  const { data: plans, error } = await supabase
    .from("plans")
    .select("id, name, price_per_seat_month, recurrence")
    .ilike("name", "%NOMAD%")
    .eq("service_type", "plan")
    .eq("archived", false)
    .order("price_per_seat_month", { ascending: true })

  if (error) {
    return { passes: [], error: error.message }
  }

  const passes: FlexPassOffer[] = (plans || []).map((plan) => ({
    id: plan.id,
    name: plan.name,
    pricePerSeatMonth: plan.price_per_seat_month,
    recurrence: plan.recurrence,
  }))

  return { passes }
}

export async function getFlexDeskAvailability(
  siteId: string,
  date: string // YYYY-MM-DD
): Promise<{
  availability: FlexDeskAvailability | null
  error?: string
}> {
  const supabase = await createClient()

  // 1. Get flex desk resource and site info for this site (open sites only)
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("id, capacity, site_id, sites!inner(id, name, status)")
    .eq("site_id", siteId)
    .eq("type", "flex_desk")
    .eq("status", "available")
    .eq("sites.status", "open")
    .single()

  if (resourceError || !resource) {
    return {
      availability: null,
      error: resourceError?.message || "Aucun poste flex disponible sur ce site",
    }
  }

  // 2. Count confirmed bookings for this date
  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`

  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("seats_count")
    .eq("resource_id", resource.id)
    .eq("status", "confirmed")
    .gte("start_date", startOfDay)
    .lte("start_date", endOfDay)

  if (bookingsError) {
    return { availability: null, error: bookingsError.message }
  }

  const bookedCount = (bookings || []).reduce(
    (sum, b) => sum + (b.seats_count || 1),
    0
  )

  // 3. Get first site photo
  const { data: photo } = await supabase
    .from("site_photos")
    .select("storage_path")
    .eq("site_id", siteId)
    .limit(1)
    .single()

  const siteData = resource.sites as { id: string; name: string }
  const totalCapacity = resource.capacity || 0

  return {
    availability: {
      siteId: siteData.id,
      siteName: siteData.name,
      totalCapacity,
      bookedCount,
      availableCount: Math.max(0, totalCapacity - bookedCount),
      photoUrl: photo?.storage_path || null,
    },
  }
}

export async function getSitesWithFlexDesks(): Promise<{
  sites: Array<{ id: string; name: string; flexCapacity: number }>
  error?: string
}> {
  const supabase = await createClient()

  const { data: resources, error } = await supabase
    .from("resources")
    .select("site_id, capacity, sites!inner(id, name, status)")
    .eq("type", "flex_desk")
    .eq("status", "available")
    .eq("sites.status", "open")

  if (error) {
    return { sites: [], error: error.message }
  }

  const sites = (resources || []).map((r) => {
    const siteData = r.sites as { id: string; name: string }
    return {
      id: siteData.id,
      name: siteData.name,
      flexCapacity: r.capacity || 0,
    }
  })

  return { sites }
}

export async function initiateFlexPassPurchase(data: {
  passId: string
  siteId: string
  date: string
  postsCount: number
  userId: string
  companyId: string
}): Promise<{ redirectUrl?: string; error?: string }> {
  // Placeholder for Stripe integration via n8n
  // The n8n workflow will generate a Stripe checkout URL and store it in Supabase
  return {
    error: "La fonctionnalite de paiement sera bientot disponible. Contactez-nous pour reserver.",
  }
}
