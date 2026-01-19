"use client"

import { useMemo, useEffect, useState } from "react"
import {
  format,
  startOfWeek,
  addDays,
  getHours,
  getMinutes,
  differenceInMinutes,
  isToday,
} from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface CalendarWeekViewProps {
  bookings: BookingWithDetails[]
  referenceDate: Date
}

const HOUR_HEIGHT = 60 // pixels per hour
const START_HOUR = 7
const END_HOUR = 20
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
)
const TOTAL_HEIGHT = HOURS.length * HOUR_HEIGHT

// More vibrant pastel colors for meeting rooms (same as month view)
const MEETING_ROOM_COLORS = [
  "bg-[#C5B4E3]", // vibrant lavender
  "bg-[#A8D5BA]", // vibrant mint green
  "bg-[#F5C6AA]", // vibrant peach
  "bg-[#9ECAE1]", // vibrant sky blue
  "bg-[#F2A6B3]", // vibrant rose
  "bg-[#B8D4E3]", // vibrant light blue
  "bg-[#D4C1A1]", // vibrant sand
  "bg-[#C9E4CA]", // vibrant sage
  "bg-[#E3B5D3]", // vibrant pink
  "bg-[#A5C8E1]", // vibrant periwinkle
]

// Neutral color for non-meeting room bookings
const DEFAULT_BOOKING_COLOR = "bg-muted/60"

// Generate a consistent color index for a meeting room based on its ID or name
function getMeetingRoomColorIndex(resourceId: string | null, resourceName: string | null): number {
  const identifier = resourceId || resourceName || "default"
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % MEETING_ROOM_COLORS.length
}

// Day names in French
const DAY_NAMES = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"]

export function CalendarWeekView({
  bookings,
  referenceDate,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(
    null
  )

  // Only weekdays (Monday to Friday)
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Calculate current time position for the indicator
  useEffect(() => {
    const updateTimePosition = () => {
      const now = new Date()
      const currentHour = getHours(now) + getMinutes(now) / 60

      if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
        const position = (currentHour - START_HOUR) * HOUR_HEIGHT
        setCurrentTimePosition(position)
      } else {
        setCurrentTimePosition(null)
      }
    }

    updateTimePosition()
    const interval = setInterval(updateTimePosition, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const grouped: Record<string, BookingWithDetails[]> = {}

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd")
      grouped[dayKey] = []
    })

    bookings.forEach((booking) => {
      const bookingDate = new Date(booking.start_date)
      const dayKey = format(bookingDate, "yyyy-MM-dd")
      if (grouped[dayKey]) {
        grouped[dayKey].push(booking)
      }
    })

    return grouped
  }, [bookings, weekDays])

  // Calculate booking position and dimensions
  const getBookingPosition = (booking: BookingWithDetails) => {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)

    const startHour = getHours(start) + getMinutes(start) / 60
    const duration = differenceInMinutes(end, start) / 60

    const top = Math.max(0, (startHour - START_HOUR) * HOUR_HEIGHT)
    const height = Math.max(40, duration * HOUR_HEIGHT)

    return { top, height }
  }

  // Get color for a booking - only meeting rooms get colors
  const getBookingColor = (booking: BookingWithDetails) => {
    if (booking.resource_type === "meeting_room") {
      const colorIndex = getMeetingRoomColorIndex(booking.resource_id, booking.resource_name)
      return MEETING_ROOM_COLORS[colorIndex]
    }
    return DEFAULT_BOOKING_COLOR
  }

  // Format time range for display
  const formatTimeRange = (booking: BookingWithDetails) => {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
  }

  // Check if today is in the current week
  const todayIndex = weekDays.findIndex((day) => isToday(day))

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[20px] border border-border/10 bg-card">
      {/* Header with day names */}
      <div className="flex h-14 shrink-0 items-center border-b border-border/10 bg-card">
        {/* Time column spacer */}
        <div className="hidden w-16 shrink-0 border-r border-border/10 sm:block md:w-20" />

        {/* Day headers */}
        <div className="grid flex-1 grid-cols-5 h-full">
          {weekDays.map((day, index) => (
            <div
              key={day.toISOString()}
              className={cn(
                "flex flex-col items-center justify-center border-r border-border/10 last:border-r-0",
                isToday(day) && "bg-white/10"
              )}
            >
              <span className="text-[10px] font-bold uppercase opacity-40">
                {DAY_NAMES[index]}
              </span>
              <span
                className={cn(
                  "mt-1 text-lg font-black leading-none",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d", { locale: fr })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <div className="no-scrollbar relative flex flex-1 overflow-y-auto">
        {/* Time labels column */}
        <div className="sticky left-0 z-10 hidden w-16 shrink-0 border-r border-border/10 bg-card sm:block md:w-20">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="relative"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-3 right-2 text-[10px] font-bold opacity-40 md:right-3">
                {hour.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Grid content area */}
        <div className="relative flex-1" style={{ minHeight: TOTAL_HEIGHT }}>
          {/* Horizontal grid lines */}
          <div className="pointer-events-none absolute inset-0 flex flex-col">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="w-full border-b border-border/[0.08]"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}
          </div>

          {/* Vertical grid lines for day columns */}
          <div className="pointer-events-none absolute inset-0 grid h-full grid-cols-5">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "h-full border-r border-border/5 last:border-r-0",
                  isToday(day) && "bg-white/5"
                )}
              />
            ))}
          </div>

          {/* Bookings layer */}
          <div className="absolute inset-0 grid grid-cols-5">
            {weekDays.map((day) => {
              const dayKey = format(day, "yyyy-MM-dd")
              const dayBookings = bookingsByDay[dayKey] || []

              return (
                <div key={day.toISOString()} className="relative h-full">
                  {dayBookings.map((booking) => {
                    const { top, height } = getBookingPosition(booking)
                    const isMeetingRoom = booking.resource_type === "meeting_room"

                    return (
                      <div
                        key={booking.id}
                        className={cn(
                          "absolute left-1 right-1 z-[2] cursor-pointer overflow-hidden rounded-[16px] border border-border/10 p-2 transition-all hover:shadow-md sm:rounded-[20px] sm:p-3",
                          getBookingColor(booking)
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: "40px",
                        }}
                      >
                        <div className="flex h-full flex-col justify-between">
                          <div className="min-w-0">
                            <p className="truncate text-[9px] font-bold uppercase opacity-60">
                              {formatTimeRange(booking)}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-black uppercase leading-tight sm:text-xs">
                              {booking.resource_name || "Ressource"}
                            </p>
                          </div>
                          {height >= 60 && (
                            <p className="truncate text-[9px] font-medium opacity-50">
                              {booking.site_name || booking.company_name || ""}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Current time indicator */}
          {currentTimePosition !== null && todayIndex >= 0 && (
            <div
              className="pointer-events-none absolute left-0 right-0 z-[5] flex items-center"
              style={{ top: `${currentTimePosition}px` }}
            >
              <div className="h-[1.5px] w-full bg-red-400" />
              <div className="absolute left-0 h-2 w-2 -translate-x-1/2 rounded-full bg-red-400 ring-2 ring-card" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
