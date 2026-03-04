/**
 * Detects if a Supabase error is a booking overlap constraint violation.
 * PostgreSQL error code 23P01 = exclusion_violation.
 */
export function isBookingOverlapError(error: { code?: string; message?: string }): boolean {
  return (
    error.code === "23P01" ||
    (error.message?.includes("no_overlapping_confirmed_meeting_room_bookings") ?? false)
  )
}

export const BOOKING_CONFLICT_MESSAGE = "Ce créneau est déjà réservé"
