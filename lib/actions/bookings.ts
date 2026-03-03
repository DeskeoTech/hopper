"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { toParisDate, parisStartOfDay, parisEndOfDay } from "@/lib/timezone"
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

  if (!rooms || rooms.length === 0) {
    return { rooms: [] }
  }

  // Fetch photos for all rooms
  const roomIds = rooms.map((r) => r.id)
  const { data: photos } = await supabase
    .from("resource_photos")
    .select("resource_id, storage_path")
    .in("resource_id", roomIds)
    .order("created_at", { ascending: true })

  // Build photo URLs map
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const photosByRoom: Record<string, string[]> = {}
  photos?.forEach((photo) => {
    const url = `${supabaseUrl}/storage/v1/object/public/resource-photos/${photo.storage_path}`
    if (!photosByRoom[photo.resource_id]) {
      photosByRoom[photo.resource_id] = [url]
    } else {
      photosByRoom[photo.resource_id].push(url)
    }
  })

  // Add photos to rooms
  const roomsWithPhotos = rooms.map((room) => ({
    ...room,
    photoUrls: photosByRoom[room.id] || [],
  }))

  return { rooms: roomsWithPhotos as MeetingRoomResource[] }
}

export async function checkAvailability(
  resourceId: string,
  date: string // YYYY-MM-DD
): Promise<{ bookings: Array<{ start_date: string; end_date: string }>; error?: string }> {
  const supabase = await createClient()

  const startOfDay = parisStartOfDay(date)
  const endOfDay = parisEndOfDay(date)

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
  userId: string
  startHour: number
  endHour: number
  title: string | null
  userName: string | null
  notes: string | null
}

export async function getRoomBookingsForDate(
  siteId: string,
  date: string // YYYY-MM-DD
): Promise<{ bookings: RoomBooking[]; error?: string }> {
  const supabase = await createClient()

  const startOfDay = parisStartOfDay(date)
  const endOfDay = parisEndOfDay(date)

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
      user_id,
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
      userId: b.user_id,
      startHour: toParisDate(b.start_date).getHours(),
      endHour: toParisDate(b.end_date).getHours(),
      title: b.notes,
      userName: user ? [user.first_name, user.last_name].filter(Boolean).join(" ") || null : null,
      notes: b.notes,
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
  referral?: string
  notes?: string
  stripeCheckoutSessionId?: string
}): Promise<{ success?: boolean; error?: string; bookingId?: string }> {
  const supabase = await createClient()

  // 0. Check site closure for the booking date
  const bookingDateStr = data.startDate.substring(0, 10)

  const { data: resourceForSite, error: resourceSiteError } = await supabase
    .from("resources")
    .select("site_id")
    .eq("id", data.resourceId)
    .single()

  if (resourceSiteError || !resourceForSite) {
    return { error: "Ressource introuvable" }
  }

  const { data: closureCheck } = await supabase
    .from("site_closures")
    .select("id")
    .eq("site_id", resourceForSite.site_id)
    .eq("date", bookingDateStr)
    .maybeSingle()

  if (closureCheck) {
    return { error: "Le site est fermé à cette date" }
  }

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
  // Use admin client to bypass RLS on credits table (users without contract_id on their credits can't read them)
  const adminSupabase = createAdminClient()

  const { data: allCredits, error: creditsError } = await adminSupabase
    .from("credits")
    .select("id, remaining_balance, expiration")
    .eq("company_id", data.companyId)
    .gt("remaining_balance", 0)
    .order("created_at", { ascending: false })

  if (creditsError) {
    return { error: "Erreur lors de la vérification des crédits" }
  }

  // Filter valid credits (no expiration or expiration in the future)
  const now = new Date()
  const validCredits = (allCredits || []).filter((c) => {
    if (!c.expiration) return true // No expiration = permanent
    return new Date(c.expiration) > now
  })

  if (validCredits.length === 0) {
    return { error: "Aucun crédit disponible" }
  }

  // Sum all valid credits for availability check
  const totalAvailable = validCredits.reduce((sum, c) => sum + c.remaining_balance, 0)

  if (totalAvailable < data.creditsToUse) {
    return { error: `Crédits insuffisants (${totalAvailable} restants, ${data.creditsToUse} requis)` }
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
      ...(data.referral ? { referral: data.referral } : {}),
      ...(data.notes ? { notes: data.notes } : {}),
      ...(data.stripeCheckoutSessionId ? { stripe_checkout_session_id: data.stripeCheckoutSessionId } : {}),
    })
    .select("id")
    .single()

  if (bookingError) {
    return { error: bookingError.message }
  }

  // 4. Deduct credits across multiple records (oldest first / FIFO)
  const sortedCredits = [...validCredits].reverse() // validCredits is newest-first, reverse for FIFO
  let remainingToDeduct = data.creditsToUse
  const deductions: { creditId: string; amount: number; balanceBefore: number; balanceAfter: number }[] = []

  for (const credit of sortedCredits) {
    if (remainingToDeduct <= 0) break

    const deduct = Math.min(remainingToDeduct, credit.remaining_balance)
    const newBalance = credit.remaining_balance - deduct

    const { error: creditUpdateError } = await adminSupabase
      .from("credits")
      .update({ remaining_balance: newBalance })
      .eq("id", credit.id)

    if (creditUpdateError) {
      // Rollback: restore previously deducted credits and delete booking
      for (const d of deductions) {
        await adminSupabase.from("credits").update({ remaining_balance: d.balanceBefore }).eq("id", d.creditId)
      }
      await supabase.from("bookings").delete().eq("id", booking.id)
      return { error: "Erreur lors de la déduction des crédits" }
    }

    deductions.push({ creditId: credit.id, amount: deduct, balanceBefore: credit.remaining_balance, balanceAfter: newBalance })
    remainingToDeduct -= deduct
  }

  // 5. Create credit transaction records (use admin client to bypass RLS)
  for (const d of deductions) {
    await adminSupabase.from("credit_transactions").insert({
      credit_id: d.creditId,
      company_id: data.companyId,
      booking_id: booking.id,
      user_id: data.userId,
      transaction_type: "consumption",
      amount: d.amount,
      balance_before: d.balanceBefore,
      balance_after: d.balanceAfter,
      reason: "Réservation de salle de réunion",
      performed_by: data.userId,
    })
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

  // Refund credits if any were used
  if (booking.credits_used && booking.credits_used > 0 && booking.user_id) {
    // Get user's company_id
    const { data: user } = await supabase
      .from("users")
      .select("company_id")
      .eq("id", booking.user_id)
      .single()

    if (user?.company_id) {
      // Use admin client for credit operations to bypass RLS
      const adminSupabase = createAdminClient()

      // Find the credit record for this company (with valid credits or any recent one)
      const { data: creditRecord } = await adminSupabase
        .from("credits")
        .select("id, remaining_balance")
        .eq("company_id", user.company_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single()

      if (creditRecord) {
        // Refund the credits
        const newBalance = creditRecord.remaining_balance + booking.credits_used
        await adminSupabase
          .from("credits")
          .update({
            remaining_balance: newBalance,
          })
          .eq("id", creditRecord.id)

        // Create credit transaction record for refund
        await adminSupabase.from("credit_transactions").insert({
          credit_id: creditRecord.id,
          company_id: user.company_id,
          booking_id: bookingId,
          user_id: booking.user_id,
          transaction_type: "refund",
          amount: -booking.credits_used,
          balance_before: creditRecord.remaining_balance,
          balance_after: newBalance,
          reason: "Annulation de réservation",
          performed_by: userId || booking.user_id,
        })
      }
    }
  }

  revalidatePath("/")
  revalidatePath("/compte")
  revalidatePath("/admin/reservations")
  return { success: true }
}

// Get the valid credit balance for a user (via their company)
export async function getUserCreditBalance(
  userId: string
): Promise<{ credits: number; companyId: string | null; error?: string }> {
  const supabase = await createClient()

  // Get user's company_id
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("company_id")
    .eq("id", userId)
    .single()

  if (userError || !user) {
    return { credits: 0, companyId: null, error: "Utilisateur introuvable" }
  }

  if (!user.company_id) {
    return { credits: 0, companyId: null, error: "Utilisateur sans entreprise associée" }
  }

  // Get valid credits using the SQL function
  const { data: creditsResult, error: creditsError } = await supabase
    .rpc("get_company_valid_credits", { p_company_id: user.company_id })

  if (creditsError) {
    return { credits: 0, companyId: user.company_id, error: creditsError.message }
  }

  return { credits: creditsResult ?? 0, companyId: user.company_id }
}

// Admin function for creating a new booking (with credit check)
export async function createBookingFromAdmin(data: {
  userId: string
  resourceId: string
  startDate: string // ISO timestamp
  endDate: string // ISO timestamp
  status: "confirmed" | "pending"
  notes?: string
  referral?: string
}): Promise<{ success?: boolean; error?: string; bookingId?: string }> {
  const supabase = await createClient()

  // Check for conflicts (overlapping bookings) only for confirmed bookings
  if (data.status === "confirmed") {
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
      return { error: "Ce créneau est déjà réservé pour cette ressource" }
    }
  }

  // Get resource hourly credit rate and site_id
  const { data: resource, error: resourceError } = await supabase
    .from("resources")
    .select("hourly_credit_rate, site_id")
    .eq("id", data.resourceId)
    .single()

  if (resourceError || !resource) {
    return { error: "Ressource introuvable" }
  }

  // Check site closure for the booking date
  const adminBookingDateStr = data.startDate.substring(0, 10)
  const { data: adminClosureCheck } = await supabase
    .from("site_closures")
    .select("id")
    .eq("site_id", resource.site_id)
    .eq("date", adminBookingDateStr)
    .maybeSingle()

  if (adminClosureCheck) {
    return { error: "Le site est fermé à cette date" }
  }

  // Calculate credits needed
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  const durationHours = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60)
  const hourlyRate = resource.hourly_credit_rate || 1
  const creditsNeeded = Math.ceil(durationHours * hourlyRate)

  // Check user's credit balance
  const { credits: availableCredits, companyId, error: creditError } = await getUserCreditBalance(data.userId)

  if (creditError) {
    return { error: creditError }
  }

  if (!companyId) {
    return { error: "Le solde de crédit de cet utilisateur est insuffisant (pas d'entreprise associée)" }
  }

  if (availableCredits < creditsNeeded) {
    return {
      error: `Le solde de crédit de cet utilisateur est insuffisant (${availableCredits} crédit${availableCredits !== 1 ? 's' : ''} disponible${availableCredits !== 1 ? 's' : ''}, ${creditsNeeded} requis)`
    }
  }

  // Find the credit record to deduct from (use admin client to bypass RLS)
  const adminSupabase = createAdminClient()
  const { data: creditRecord, error: creditRecordError } = await adminSupabase
    .from("credits")
    .select("id, remaining_balance")
    .eq("company_id", companyId)
    .gt("remaining_balance", 0)
    .or("expiration.is.null,expiration.gt.now()")
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (creditRecordError || !creditRecord) {
    return { error: "Aucun crédit disponible pour cette période" }
  }

  // Create booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: data.userId,
      resource_id: data.resourceId,
      start_date: data.startDate,
      end_date: data.endDate,
      status: data.status,
      notes: data.notes || null,
      referral: data.referral || null,
      credits_used: creditsNeeded,
    })
    .select("id")
    .single()

  if (bookingError) {
    return { error: bookingError.message }
  }

  // Deduct credits (use admin client to bypass RLS)
  const newBalance = creditRecord.remaining_balance - creditsNeeded
  const { error: creditUpdateError } = await adminSupabase
    .from("credits")
    .update({
      remaining_balance: newBalance,
    })
    .eq("id", creditRecord.id)

  if (creditUpdateError) {
    // Rollback booking if credit deduction fails
    await supabase.from("bookings").delete().eq("id", booking.id)
    return { error: "Erreur lors de la déduction des crédits" }
  }

  // Create credit transaction record (use admin client to bypass RLS)
  await adminSupabase.from("credit_transactions").insert({
    credit_id: creditRecord.id,
    company_id: companyId,
    booking_id: booking.id,
    user_id: data.userId,
    transaction_type: "consumption",
    amount: creditsNeeded,
    balance_before: creditRecord.remaining_balance,
    balance_after: newBalance,
    reason: "Réservation de salle de réunion",
  })

  revalidatePath("/admin/reservations")
  return { success: true, bookingId: booking.id }
}

// Fetch meeting rooms for a given site (used in admin create booking)
export async function getResourcesBySite(
  siteId: string
): Promise<{ resources: Array<{ id: string; name: string; type: string }>; error?: string }> {
  const supabase = await createClient()

  const { data: resources, error } = await supabase
    .from("resources")
    .select("id, name, type")
    .eq("site_id", siteId)
    .eq("status", "available")
    .eq("type", "meeting_room")
    .order("name")

  if (error) {
    return { resources: [], error: error.message }
  }

  return { resources: resources || [] }
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
