import { isWeekend } from "date-fns"

/**
 * Calculate Easter Sunday using the Anonymous Gregorian algorithm
 */
function getEasterSunday(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed month
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

/**
 * Get all French public holidays for a given year
 */
export function getFrenchHolidays(year: number): Date[] {
  const easter = getEasterSunday(year)

  // Fixed holidays
  const holidays: Date[] = [
    new Date(year, 0, 1),   // Jour de l'An
    new Date(year, 4, 1),   // Fête du Travail
    new Date(year, 4, 8),   // Victoire 1945
    new Date(year, 6, 14),  // Fête Nationale
    new Date(year, 7, 15),  // Assomption
    new Date(year, 10, 1),  // Toussaint
    new Date(year, 10, 11), // Armistice
    new Date(year, 11, 25), // Noël
  ]

  // Easter-based holidays
  const easterMs = easter.getTime()
  const dayMs = 24 * 60 * 60 * 1000

  holidays.push(new Date(easterMs + 1 * dayMs))  // Lundi de Pâques
  holidays.push(new Date(easterMs + 39 * dayMs)) // Ascension
  holidays.push(new Date(easterMs + 50 * dayMs)) // Lundi de Pentecôte

  return holidays
}

/**
 * Check if a date is a French public holiday
 */
export function isFrenchHoliday(date: Date): boolean {
  const year = date.getFullYear()
  const holidays = getFrenchHolidays(year)

  return holidays.some(
    (holiday) =>
      holiday.getFullYear() === date.getFullYear() &&
      holiday.getMonth() === date.getMonth() &&
      holiday.getDate() === date.getDate()
  )
}

/**
 * Check if a date is disabled for booking (weekend or French holiday)
 */
export function isDateDisabledForBooking(date: Date): boolean {
  // Check if it's a past date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (date < today) {
    return true
  }

  // Check if it's a weekend
  if (isWeekend(date)) {
    return true
  }

  // Check if it's a French holiday
  if (isFrenchHoliday(date)) {
    return true
  }

  return false
}

/**
 * Matcher function for Calendar component disabled prop
 * Returns true if date should be disabled (past, weekend, or holiday)
 */
export function disabledDateMatcher(date: Date): boolean {
  return isDateDisabledForBooking(date)
}

/**
 * Get the next available business day (not weekend, not holiday)
 */
export function getNextBusinessDay(date: Date): Date {
  let nextDate = new Date(date)
  nextDate.setDate(nextDate.getDate() + 1)

  // Keep incrementing until we find a valid business day
  while (isWeekend(nextDate) || isFrenchHoliday(nextDate)) {
    nextDate.setDate(nextDate.getDate() + 1)
  }

  return nextDate
}

/**
 * Get the previous available business day (not weekend, not holiday, not past)
 * Returns null if no valid previous business day exists (would be before today)
 */
export function getPreviousBusinessDay(date: Date): Date | null {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let prevDate = new Date(date)
  prevDate.setDate(prevDate.getDate() - 1)

  // Keep decrementing until we find a valid business day or hit today
  while ((isWeekend(prevDate) || isFrenchHoliday(prevDate)) && prevDate >= today) {
    prevDate.setDate(prevDate.getDate() - 1)
  }

  // If we've gone past today or it's still disabled, return null
  if (prevDate < today || isWeekend(prevDate) || isFrenchHoliday(prevDate)) {
    return null
  }

  return prevDate
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

/**
 * Get the next N available business days starting from today
 */
export function getNextBusinessDays(count: number): Date[] {
  const days: Date[] = []
  let currentDate = new Date()
  currentDate.setHours(0, 0, 0, 0)

  // If today is a business day, include it
  if (!isWeekend(currentDate) && !isFrenchHoliday(currentDate)) {
    days.push(new Date(currentDate))
  }

  // Get remaining days
  while (days.length < count) {
    currentDate = getNextBusinessDay(currentDate)
    days.push(new Date(currentDate))
  }

  return days
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}
