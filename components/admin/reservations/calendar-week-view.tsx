"use client"

import { useMemo } from "react"
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  isSameDay,
  getHours,
  getMinutes,
  differenceInMinutes,
} from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { BookingCard } from "./booking-card"
import type { BookingWithDetails } from "@/lib/types/database"

interface CalendarWeekViewProps {
  bookings: BookingWithDetails[]
  referenceDate: Date
}

const HOUR_HEIGHT = 60 // pixels per hour
const START_HOUR = 7
const END_HOUR = 21
const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

export function CalendarWeekView({
  bookings,
  referenceDate,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  const bookingsByDay = useMemo(() => {
    const grouped: Record<string, BookingWithDetails[]> = {}

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd")
      grouped[dayKey] = []
    })

    bookings.forEach((booking) => {
      const bookingDate = parseISO(booking.start_date)
      const dayKey = format(bookingDate, "yyyy-MM-dd")
      if (grouped[dayKey]) {
        grouped[dayKey].push(booking)
      }
    })

    return grouped
  }, [bookings, weekDays])

  const getBookingPosition = (booking: BookingWithDetails) => {
    const start = parseISO(booking.start_date)
    const end = parseISO(booking.end_date)

    const startHour = getHours(start) + getMinutes(start) / 60
    const duration = differenceInMinutes(end, start) / 60

    const top = Math.max(0, (startHour - START_HOUR) * HOUR_HEIGHT)
    const height = Math.max(30, duration * HOUR_HEIGHT)

    return { top, height }
  }

  const isToday = (date: Date) => isSameDay(date, new Date())

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Header with day names */}
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border">
          <div className="p-2" />
          {weekDays.map((day) => (
            <div
              key={day.toISOString()}
              className={cn(
                "border-l border-border p-2 text-center",
                isToday(day) && "bg-primary/5"
              )}
            >
              <div className="text-xs uppercase text-muted-foreground">
                {format(day, "EEE", { locale: fr })}
              </div>
              <div
                className={cn(
                  "text-lg font-semibold",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d", { locale: fr })}
              </div>
            </div>
          ))}
        </div>

        {/* Time grid */}
        <div className="relative grid grid-cols-[60px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-3 right-2 text-xs text-muted-foreground">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns with bookings */}
          {weekDays.map((day) => {
            const dayKey = format(day, "yyyy-MM-dd")
            const dayBookings = bookingsByDay[dayKey] || []

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative border-l border-border",
                  isToday(day) && "bg-primary/5"
                )}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {/* Bookings */}
                {dayBookings.map((booking) => {
                  const { top, height } = getBookingPosition(booking)

                  return (
                    <div
                      key={booking.id}
                      className="absolute left-1 right-1 overflow-hidden"
                      style={{
                        top: `${top}px`,
                        height: `${height}px`,
                        minHeight: "30px",
                      }}
                    >
                      <BookingCard booking={booking} compact />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
