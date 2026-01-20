"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { MeetingRoomResource } from "@/lib/types/database"

export async function getMeetingRoomsBySite(
  siteId: string
): Promise<{ rooms: MeetingRoomResource[]; error?: string }> {
  const supabase = await createClient()

  const { data: rooms, error } = await supabase
    .from("resources")
    .select("id, name, capacity, floor, hourly_credit_rate, equipments, status")
    .eq("site_id", siteId)
    .eq("type", "meeting_room")
    .eq("status", "available")
    .order("name")

  if (error) {
    return { rooms: [], error: error.message }
  }

  return { rooms: (rooms as MeetingRoomResource[]) || [] }
}

export async function checkAvailability(
  resourceId: string,
  date: string // YYYY-MM-DD
): Promise<{ bookings: Array<{ start_date: string; end_date: string }>; error?: string }> {
  const supabase = await createClient()

  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`

  const { data: bookings, error } = await supabase
    .from("bookings")
    .select("start_date, end_date")
    .eq("resource_id", resourceId)
    .eq("status", "confirmed")
    .gte("start_date", startOfDay)
    .lte("start_date", endOfDay)

  if (error) {
    return { bookings: [], error: error.message }
  }

  return { bookings: bookings || [] }
}

export interface RoomBooking {
  id: string
  resourceId: string
  startHour: number
  endHour: number
  title: string | null
  userName: string | null
}

export async function getRoomBookingsForDate(
  siteId: string,
  date: string // YYYY-MM-DD
): Promise<{ bookings: RoomBooking[]; error?: string }> {
  const supabase = await createClient()

  const startOfDay = `${date}T00:00:00Z`
  const endOfDay = `${date}T23:59:59Z`

  // Get all meeting room IDs for this site first
  const { data: rooms, error: roomsError } = await supabase
    .from("resources")
    .select("id")
    .eq("site_id", siteId)
    .eq("type", "meeting_room")
    .eq("status", "available")

  if (roomsError) {
    return { bookings: [], error: roomsError.message }
  }

  if (!rooms || rooms.length === 0) {
    return { bookings: [] }
  }

  const roomIds = rooms.map((r) => r.id)

  // Get all bookings for these rooms on this date
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(`
      id,
      resource_id,
      start_date,
      end_date,
      notes,
      users:user_id (first_name, last_name)
    `)
    .in("resource_id", roomIds)
    .eq("status", "confirmed")
    .gte("start_date", startOfDay)
    .lte("start_date", endOfDay)

  if (bookingsError) {
    return { bookings: [], error: bookingsError.message }
  }

  const result: RoomBooking[] = (bookings || []).map((b) => {
    const user = b.users as { first_name: string | null; last_name: string | null } | null
    return {
      id: b.id,
      resourceId: b.resource_id,
      startHour: new Date(b.start_date).getHours(),
      endHour: new Date(b.end_date).getHours(),
      title: b.notes,
      userName: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || null : null,
    }
  })

  return { bookings: result }
}

// Admin function for updating booking date (drag & drop)
export async function updateBookingDate(data: {
  bookingId: string
  startDate: string // ISO timestamp
  endDate: string // ISO timestamp
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the existing booking
  const { data: existingBooking, error: fetchError } = await supabase
    .from("bookings")
    .select("resource_id, status")
    .eq("id", data.bookingId)
    .single()

  if (fetchError || !existingBooking) {
    return { error: "Réservation introuvable" }
  }

  if (existingBooking.status === "cancelled") {
    return { error: "Impossible de modifier une réservation annulée" }
  }

  // Check for conflicts (overlapping bookings excluding current one)
  const { data: conflicts, error: conflictError } = await supabase
    .from("bookings")
    .select("id")
    .eq("resource_id", existingBooking.resource_id)
    .eq("status", "confirmed")
    .neq("id", data.bookingId)
    .lt("start_date", data.endDate)
    .gt("end_date", data.startDate)

  if (conflictError) {
    return { error: conflictError.message }
  }

  if (conflicts && conflicts.length > 0) {
    return { error: "Ce créneau est déjà réservé" }
  }

  // Update the booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      start_date: data.startDate,
      end_date: data.endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.bookingId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/admin/reservations")
  return { success: true }
}

export async function createMeetingRoomBooking(data: {
  userId: string
  resourceId: string
  startDate: string // ISO timestamp
  endDate: string // ISO timestamp
  creditsToUse: number
  companyId: string
}): Promise<{ success?: boolean; error?: string; bookingId?: string }> {
  const supabase = await createClient()

  // 1. Check for conflicts (overlapping bookings)
  const { data: conflicts, error: conflictError } = await supabase
    .from("bookings")
    .select("id")
    .eq("resource_id", data.resourceId)
    .eq("status", "confirmed")
    .lt("start_date", data.endDate)
    .gt("end_date", data.startDate)

  if (conflictError) {
    return { error: conflictError.message }
  }

  if (conflicts && conflicts.length > 0) {
    return { error: "Ce créneau est déjà réservé" }
  }

  // 2. Check credits availability
  const today = new Date().toISOString().split("T")[0]
  const { data: credits, error: creditsError } = await supabase
    .from("credits")
    .select("id, remaining_credits, contracts!inner(company_id, status)")
    .eq("contracts.company_id", data.companyId)
    .eq("contracts.status", "active")
    .lte("period", today)
    .order("period", { ascending: false })
    .limit(1)
    .single()

  if (creditsError || !credits) {
    return { error: "Aucun crédit disponible pour cette période" }
  }

  if (credits.remaining_credits < data.creditsToUse) {
    return { error: `Crédits insuffisants (${credits.remaining_credits} restants, ${data.creditsToUse} requis)` }
  }

  // 3. Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: data.userId,
      resource_id: data.resourceId,
      start_date: data.startDate,
      end_date: data.endDate,
      status: "confirmed",
      credits_used: data.creditsToUse,
    })
    .select("id")
    .single()

  if (bookingError) {
    return { error: bookingError.message }
  }

  // 4. Deduct credits
  const { error: creditUpdateError } = await supabase
    .from("credits")
    .update({
      remaining_credits: credits.remaining_credits - data.creditsToUse,
      updated_at: new Date().toISOString(),
    })
    .eq("id", credits.id)

  if (creditUpdateError) {
    // Rollback booking if credit deduction fails
    await supabase.from("bookings").delete().eq("id", booking.id)
    return { error: "Erreur lors de la déduction des crédits" }
  }

  revalidatePath("/")
  return { success: true, bookingId: booking.id }
}

export async function cancelBooking(
  bookingId: string,
  userId?: string // Optional - when not provided (admin use), skip ownership check
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the booking to verify ownership and get credits info
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, user_id, status, credits_used, resource_id")
    .eq("id", bookingId)
    .single()

  if (fetchError || !booking) {
    return { error: "Réservation introuvable" }
  }

  // Verify the user owns this booking (only if userId is provided - client use)
  if (userId && booking.user_id !== userId) {
    return { error: "Vous n'êtes pas autorisé à annuler cette réservation" }
  }

  // Check if already cancelled
  if (booking.status === "cancelled") {
    return { error: "Cette réservation est déjà annulée" }
  }

  // Update booking status to cancelled
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId)

  if (updateError) {
    return { error: updateError.message }
  }

  // Note: Credits are not refunded for cancelled bookings
  // If credits should be refunded, uncomment the following code:
  /*
  if (booking.credits_used && booking.credits_used > 0) {
    // Refund credits logic would go here
  }
  */

  revalidatePath("/")
  revalidatePath("/admin/reservations")
  return { success: true }
}

export async function updateBooking(data: {
  bookingId: string
  userId: string
  startDate: string // ISO timestamp
  endDate: string // ISO timestamp
  resourceId: string
}): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient()

  // Get the existing booking
  const { data: booking, error: fetchError } = await supabase
    .from("bookings")
    .select("id, user_id, status, credits_used, resource_id, start_date, end_date")
    .eq("id", data.bookingId)
    .single()

  if (fetchError || !booking) {
    return { error: "Réservation introuvable" }
  }

  // Verify the user owns this booking
  if (booking.user_id !== data.userId) {
    return { error: "Vous n'êtes pas autorisé à modifier cette réservation" }
  }

  // Check if cancelled
  if (booking.status === "cancelled") {
    return { error: "Impossible de modifier une réservation annulée" }
  }

  // Check for conflicts (overlapping bookings), excluding current booking
  const { data: conflicts, error: conflictError } = await supabase
    .from("bookings")
    .select("id")
    .eq("resource_id", data.resourceId)
    .eq("status", "confirmed")
    .neq("id", data.bookingId)
    .lt("start_date", data.endDate)
    .gt("end_date", data.startDate)

  if (conflictError) {
    return { error: conflictError.message }
  }

  if (conflicts && conflicts.length > 0) {
    return { error: "Ce créneau est déjà réservé" }
  }

  // Update the booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      start_date: data.startDate,
      end_date: data.endDate,
      resource_id: data.resourceId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.bookingId)

  if (updateError) {
    return { error: updateError.message }
  }

  revalidatePath("/")
  return { success: true }
}
