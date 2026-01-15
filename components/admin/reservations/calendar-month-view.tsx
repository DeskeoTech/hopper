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
    <div className="p-4">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-sm font-medium text-muted-foreground"
          >
            {day}
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
                "relative min-h-[100px] rounded-lg border border-border p-2 text-left transition-colors hover:bg-accent/50",
                !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                isToday(day) && "ring-2 ring-primary"
              )}
            >
              <span
                className={cn(
                  "text-sm font-medium",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d")}
              </span>

              {dayBookings.length > 0 && (
                <div className="mt-1 space-y-1">
                  {confirmedCount > 0 && (
                    <div className="flex items-center gap-1 rounded-sm bg-success/10 px-1.5 py-0.5 text-xs text-success">
                      <span className="h-1.5 w-1.5 rounded-full bg-success" />
                      {confirmedCount} confirmee{confirmedCount > 1 ? "s" : ""}
                    </div>
                  )}
                  {pendingCount > 0 && (
                    <div className="flex items-center gap-1 rounded-sm bg-warning/10 px-1.5 py-0.5 text-xs text-warning">
                      <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                      {pendingCount} en attente
                    </div>
                  )}
                  {cancelledCount > 0 && (
                    <div className="flex items-center gap-1 rounded-sm bg-destructive/10 px-1.5 py-0.5 text-xs text-destructive">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      {cancelledCount} annulee{cancelledCount > 1 ? "s" : ""}
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
