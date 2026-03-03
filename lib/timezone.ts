import { TZDate } from "@date-fns/tz"

export const PARIS_TZ = "Europe/Paris"

/**
 * Convert an ISO string to a TZDate in Paris timezone.
 * Use this for formatting/display to ensure Paris time is shown regardless of server TZ.
 */
export function toParisDate(isoString: string): TZDate {
  return new TZDate(isoString, PARIS_TZ)
}

/**
 * Create a Paris-timezone Date from a date string and time string.
 * Use this when creating bookings to correctly interpret user-entered times as Paris time.
 * Example: createParisDate("2026-03-02", "10:00") → 10:00 Paris = 09:00 UTC
 */
export function createParisDate(dateStr: string, timeStr: string): TZDate {
  return new TZDate(`${dateStr}T${timeStr}:00`, PARIS_TZ)
}

/**
 * Get the start of day in Paris timezone as an ISO string.
 * Use this for DB queries instead of `${date}T00:00:00Z`.
 */
export function parisStartOfDay(dateStr: string): string {
  return new TZDate(`${dateStr}T00:00:00`, PARIS_TZ).toISOString()
}

/**
 * Get the end of day in Paris timezone as an ISO string.
 * Use this for DB queries instead of `${date}T23:59:59Z`.
 */
export function parisEndOfDay(dateStr: string): string {
  return new TZDate(`${dateStr}T23:59:59`, PARIS_TZ).toISOString()
}

/**
 * Get the current time as a TZDate in Paris timezone.
 */
export function nowInParis(): TZDate {
  return new TZDate(Date.now(), PARIS_TZ)
}
