"use client"

import { useMemo } from "react"
import { Users, Coins, DoorOpen } from "lucide-react"
import type { MeetingRoomResource } from "@/lib/types/database"
import type { RoomBooking } from "@/lib/actions/bookings"

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00
const SLOT_HEIGHT = 52 // pixels per hour

interface RoomPlanningGridProps {
  rooms: MeetingRoomResource[]
  bookings: RoomBooking[]
  onSlotClick: (room: MeetingRoomResource, hour: number) => void
  remainingCredits: number
}

export function RoomPlanningGrid({
  rooms,
  bookings,
  onSlotClick,
  remainingCredits,
}: RoomPlanningGridProps) {
  // Group bookings by room
  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, RoomBooking[]>()
    bookings.forEach((booking) => {
      const existing = map.get(booking.resourceId) || []
      existing.push(booking)
      map.set(booking.resourceId, existing)
    })
    return map
  }, [bookings])

  // Get current hour for the "now" indicator
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const isWithinRange = currentHour >= 8 && currentHour < 20

  // Calculate now indicator position (percentage from top of grid)
  const nowPosition = isWithinRange
    ? ((currentHour - 8) * 60 + currentMinutes) / (12 * 60) * 100
    : null

  // Check if a slot is available
  const isSlotAvailable = (roomId: string, hour: number) => {
    const roomBookings = bookingsByRoom.get(roomId) || []
    return !roomBookings.some(
      (b) => hour >= b.startHour && hour < b.endHour
    )
  }

  // Check if user can afford to book (at least 1 hour)
  const canAffordRoom = (room: MeetingRoomResource) => {
    return remainingCredits >= (room.hourly_credit_rate || 1)
  }

  return (
    <div className="overflow-x-auto -mx-4 sm:-mx-6">
      <div className="min-w-[700px] px-4 sm:px-6">
        {/* Header with rooms */}
        <div className="flex sticky top-0 bg-background z-10 pb-3">
          {/* Time column header */}
          <div className="w-14 shrink-0" />

          {/* Room headers */}
          <div className="flex flex-1 gap-2">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex-1 min-w-[100px] text-center pt-4"
              >
                {/* Room icon/placeholder */}
                <div className="mx-auto w-full max-w-[80px] aspect-[4/3] rounded-lg bg-muted/60 flex items-center justify-center mb-2">
                  <DoorOpen className="h-6 w-6 text-muted-foreground/60" />
                </div>

                {/* Room name */}
                <p className="text-sm font-medium text-foreground truncate px-1">
                  {room.name}
                </p>

                {/* Room info */}
                <div className="flex items-center justify-center gap-2 mt-0.5 text-xs text-muted-foreground/80">
                  {room.capacity && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </span>
                  )}
                  {room.hourly_credit_rate && (
                    <span className="flex items-center gap-0.5">
                      <Coins className="h-3 w-3" />
                      {room.hourly_credit_rate}/h
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline grid */}
        <div className="flex relative mt-2">
          {/* Now indicator */}
          {nowPosition !== null && (
            <div
              className="absolute left-14 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${nowPosition}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
              <div className="h-[1px] bg-destructive flex-1" />
            </div>
          )}

          {/* Time column */}
          <div className="w-14 shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="flex items-start justify-end pr-3 -mt-2"
                style={{ height: SLOT_HEIGHT }}
              >
                <span className="text-xs text-muted-foreground/70">
                  {hour.toString().padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Room columns */}
          <div className="flex flex-1 gap-2">
            {rooms.map((room) => {
              const roomBookings = bookingsByRoom.get(room.id) || []
              const affordable = canAffordRoom(room)

              return (
                <div
                  key={room.id}
                  className="flex-1 min-w-[100px] relative"
                >
                  {/* Subtle background column */}
                  <div className="absolute inset-0 bg-muted/20 rounded-lg" />

                  {/* Hour slots */}
                  <div className="relative">
                    {HOURS.map((hour, index) => {
                      const available = isSlotAvailable(room.id, hour)
                      const isPast = currentHour > hour

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => available && affordable && !isPast && onSlotClick(room, hour)}
                          disabled={!available || !affordable || isPast}
                          className={`
                            w-full transition-colors relative
                            ${index < HOURS.length - 1 ? "border-b border-foreground/5" : ""}
                            ${available && affordable && !isPast
                              ? "hover:bg-primary/5 cursor-pointer"
                              : "cursor-not-allowed"
                            }
                            ${isPast ? "bg-foreground/[0.02]" : ""}
                          `}
                          style={{ height: SLOT_HEIGHT }}
                        />
                      )
                    })}
                  </div>

                  {/* Booking blocks */}
                  {roomBookings.map((booking) => {
                    const top = (booking.startHour - 8) * SLOT_HEIGHT
                    const height = (booking.endHour - booking.startHour) * SLOT_HEIGHT

                    return (
                      <div
                        key={booking.id}
                        className="absolute left-1 right-1 rounded-md bg-foreground/10 p-2 overflow-hidden pointer-events-none"
                        style={{ top, height }}
                      >
                        <p className="text-xs font-medium text-foreground truncate">
                          {booking.title || "Réservé"}
                        </p>
                        {booking.userName && height > 60 && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {booking.userName}
                          </p>
                        )}
                        {height > 80 && (
                          <p className="text-xs text-muted-foreground/70 mt-0.5">
                            {booking.startHour}h - {booking.endHour}h
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
