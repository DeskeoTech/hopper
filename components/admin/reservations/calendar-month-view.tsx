"use client"

import { useMemo } from "react"
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface CalendarMonthViewProps {
  bookings: BookingWithDetails[]
  referenceDate: Date
  onDayNavigate?: (day: Date) => void
}

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
const WEEKDAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"]

export function CalendarMonthView({
  bookings,
  referenceDate,
  onDayNavigate,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(referenceDate)
  const monthEnd = endOfMonth(referenceDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  // Generate all days to display
  const calendarDays = useMemo(() => {
    const days: Date[] = []
    let currentDay = calendarStart

    while (currentDay <= calendarEnd) {
      days.push(currentDay)
      currentDay = addDays(currentDay, 1)
    }

    return days
  }, [calendarStart, calendarEnd])

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const grouped: Record<string, BookingWithDetails[]> = {}

    bookings.forEach((booking) => {
      const bookingDate = parseISO(booking.start_date)
      const dayKey = format(bookingDate, "yyyy-MM-dd")
      if (!grouped[dayKey]) {
        grouped[dayKey] = []
      }
      grouped[dayKey].push(booking)
    })

    return grouped
  }, [bookings])

  const handleDayClick = (day: Date) => {
    if (onDayNavigate) {
      onDayNavigate(day)
    }
  }

  const isToday = (date: Date) => isSameDay(date, new Date())

  // Split into weeks for grid
  const weeks = useMemo(() => {
    const result: Date[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7))
    }
    return result
  }, [calendarDays])

  return (
    <div className="p-2 sm:p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className="p-1 sm:p-2 text-center text-xs sm:text-sm font-medium text-muted-foreground"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{WEEKDAYS_SHORT[index]}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd")
          const dayBookings = bookingsByDay[dayKey] || []
          const isCurrentMonth = isSameMonth(day, referenceDate)
          const confirmedCount = dayBookings.filter(
            (b) => b.status === "confirmed"
          ).length
          const pendingCount = dayBookings.filter(
            (b) => b.status === "pending"
          ).length
          const cancelledCount = dayBookings.filter(
            (b) => b.status === "cancelled"
          ).length

          return (
            <button
              key={dayKey}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative min-h-[60px] sm:min-h-[100px] rounded-md sm:rounded-lg border border-border p-1 sm:p-2 text-left transition-colors hover:bg-accent/50",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isToday(day) && "ring-2 ring-primary"
              )}
            >
              <span
                className={cn(
                  "text-xs sm:text-sm font-medium",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d")}
              </span>

              {dayBookings.length > 0 && (
                <div className="mt-0.5 sm:mt-1 space-y-0.5 sm:space-y-1">
                  {confirmedCount > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1 rounded-sm bg-success/10 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs text-success">
                      <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-success" />
                      <span className="sm:hidden">{confirmedCount}</span>
                      <span className="hidden sm:inline">{confirmedCount} confirmee{confirmedCount > 1 ? "s" : ""}</span>
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1 rounded-sm bg-warning/10 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs text-warning">
                      <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-warning" />
                      <span className="sm:hidden">{pendingCount}</span>
                      <span className="hidden sm:inline">{pendingCount} en attente</span>
                    </div>
                  )}
                  {cancelledCount > 0 && (
                    <div className="flex items-center gap-0.5 sm:gap-1 rounded-sm bg-destructive/10 px-1 sm:px-1.5 py-0.5 text-[10px] sm:text-xs text-destructive">
                      <span className="h-1 w-1 sm:h-1.5 sm:w-1.5 rounded-full bg-destructive" />
                      <span className="sm:hidden">{cancelledCount}</span>
                      <span className="hidden sm:inline">{cancelledCount} annulee{cancelledCount > 1 ? "s" : ""}</span>
                    </div>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
