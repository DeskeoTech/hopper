"use client"

import { useMemo } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
} from "date-fns"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface CalendarMonthViewProps {
  bookings: BookingWithDetails[]
  referenceDate: Date
  onDayNavigate?: (day: Date) => void
}

// Day names in French
const WEEKDAYS = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"]

// More vibrant pastel colors for meeting rooms
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

export function CalendarMonthView({
  bookings,
  referenceDate,
  onDayNavigate,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(referenceDate)
  const monthEnd = endOfMonth(referenceDate)
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })
  const today = startOfDay(new Date())

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
      const bookingDate = new Date(booking.start_date)
      const dayKey = format(bookingDate, "yyyy-MM-dd")
      if (!grouped[dayKey]) {
        grouped[dayKey] = []
      }
      grouped[dayKey].push(booking)
    })

    return grouped
  }, [bookings])

  // Get unique meeting rooms from all bookings for the legend
  const uniqueMeetingRooms = useMemo(() => {
    const rooms = new Map<string, { id: string | null; name: string | null }>()
    bookings.forEach((booking) => {
      if (booking.resource_type === "meeting_room" && booking.resource_id) {
        rooms.set(booking.resource_id, {
          id: booking.resource_id,
          name: booking.resource_name,
        })
      }
    })
    return Array.from(rooms.values())
  }, [bookings])

  const handleDayClick = (day: Date) => {
    if (onDayNavigate) {
      onDayNavigate(day)
    }
  }

  const isToday = (date: Date) => isSameDay(date, new Date())
  const isPast = (date: Date) => isBefore(startOfDay(date), today)

  return (
    <div className="overflow-hidden rounded-[20px] border border-border/10 bg-card">
      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border/10 bg-card">
        {WEEKDAYS.map((day) => (
          <div
            key={day}
            className="p-2 text-center text-[10px] font-bold uppercase tracking-wider text-foreground/40 sm:p-3 sm:text-xs"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dayKey = format(day, "yyyy-MM-dd")
          const dayBookings = bookingsByDay[dayKey] || []
          const isCurrentMonth = isSameMonth(day, referenceDate)
          const dayIsPast = isPast(day) && isCurrentMonth
          const dayIsToday = isToday(day)

          // Filter only meeting room bookings and group by room
          const meetingRoomBookings = dayBookings.filter(
            (b) => b.resource_type === "meeting_room"
          )
          const bookingsByRoom = meetingRoomBookings.reduce(
            (acc, booking) => {
              const roomKey = booking.resource_id || booking.resource_name || "unknown"
              if (!acc[roomKey]) {
                acc[roomKey] = {
                  bookings: [],
                  resourceId: booking.resource_id,
                  resourceName: booking.resource_name,
                }
              }
              acc[roomKey].bookings.push(booking)
              return acc
            },
            {} as Record<string, { bookings: BookingWithDetails[]; resourceId: string | null; resourceName: string | null }>
          )

          // Count other bookings (non meeting room)
          const otherBookingsCount = dayBookings.length - meetingRoomBookings.length

          return (
            <button
              key={dayKey}
              onClick={() => handleDayClick(day)}
              className={cn(
                "relative flex min-h-[80px] flex-col border-b border-r border-border/5 p-2 text-left transition-all hover:bg-white/30 sm:min-h-[110px] sm:p-3 md:min-h-[120px]",
                // Past days: slightly darkened
                dayIsPast && isCurrentMonth && "bg-muted/40",
                // Not current month: more subtle
                !isCurrentMonth && "bg-muted/20",
                // Current month normal days
                isCurrentMonth && !dayIsPast && "bg-white/20",
                // Today: highlighted with ring
                dayIsToday && "bg-white/50 ring-2 ring-inset ring-foreground",
                // Last column: no right border
                (index + 1) % 7 === 0 && "border-r-0"
              )}
            >
              {/* Day number */}
              <span
                className={cn(
                  "text-sm font-medium sm:text-base",
                  !isCurrentMonth && "opacity-40",
                  dayIsPast && isCurrentMonth && "opacity-60",
                  dayIsToday && "font-bold"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Meeting room booking indicators - colored lines by room */}
              {Object.keys(bookingsByRoom).length > 0 && (
                <div className="mt-1.5 flex flex-col gap-1 sm:mt-2">
                  {Object.entries(bookingsByRoom)
                    .slice(0, 3) // Show max 3 rooms
                    .map(([roomKey, roomData]) => {
                      const colorIndex = getMeetingRoomColorIndex(
                        roomData.resourceId,
                        roomData.resourceName
                      )
                      return (
                        <div
                          key={roomKey}
                          className={cn(
                            "h-2 rounded-full sm:h-2.5",
                            MEETING_ROOM_COLORS[colorIndex]
                          )}
                          style={{
                            // Width based on number of bookings (min 40%, max 100%)
                            width: `${Math.min(40 + roomData.bookings.length * 20, 100)}%`,
                          }}
                          title={`${roomData.resourceName || "Salle"}: ${roomData.bookings.length} reservation(s)`}
                        />
                      )
                    })}

                  {/* Show "+X more" if more than 3 rooms */}
                  {Object.keys(bookingsByRoom).length > 3 && (
                    <span className="text-[9px] text-foreground/50 sm:text-[10px]">
                      +{Object.keys(bookingsByRoom).length - 3} salle(s)
                    </span>
                  )}
                </div>
              )}

              {/* Total count at bottom */}
              {dayBookings.length > 0 && (
                <span className="mt-auto pt-1 text-[9px] font-medium text-foreground/50 sm:text-[10px]">
                  {meetingRoomBookings.length > 0 && (
                    <span>{meetingRoomBookings.length} salle{meetingRoomBookings.length > 1 ? "s" : ""}</span>
                  )}
                  {otherBookingsCount > 0 && (
                    <span className="ml-1 opacity-60">+{otherBookingsCount}</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend - show unique meeting rooms */}
      {uniqueMeetingRooms.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border/10 px-4 py-3 text-[10px] sm:gap-4 sm:text-xs">
          <span className="font-medium text-foreground/50">Salles:</span>
          {uniqueMeetingRooms.slice(0, 6).map((room) => {
            const colorIndex = getMeetingRoomColorIndex(room.id, room.name)
            return (
              <div key={room.id || room.name} className="flex items-center gap-1.5">
                <div
                  className={cn(
                    "h-2.5 w-5 rounded-full",
                    MEETING_ROOM_COLORS[colorIndex]
                  )}
                />
                <span className="max-w-[80px] truncate text-foreground/70">
                  {room.name || "Salle"}
                </span>
              </div>
            )
          })}
          {uniqueMeetingRooms.length > 6 && (
            <span className="text-foreground/50">+{uniqueMeetingRooms.length - 6}</span>
          )}
        </div>
      )}
    </div>
  )
}
