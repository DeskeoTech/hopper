"use client"

import { useState } from "react"
import { DoorOpen, ChevronDown, Clock, Building2, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"

export interface MeetingRoomBooking {
  id: string
  roomName: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  durationHours: number
  companyName: string | null
  userName: string | null
  notes: string | null
}

interface MeetingRoomBookingsProps {
  bookings: MeetingRoomBooking[]
  dateLabel?: string
  siteName?: string
}

interface RoomGroup {
  roomName: string
  bookings: MeetingRoomBooking[]
}

export function MeetingRoomBookings({ bookings, dateLabel = "aujourd'hui", siteName }: MeetingRoomBookingsProps) {
  const [expandedRooms, setExpandedRooms] = useState<Set<string>>(new Set())

  // Group bookings by room name
  const roomGroups: RoomGroup[] = []
  const roomMap = new Map<string, MeetingRoomBooking[]>()
  for (const booking of bookings) {
    const existing = roomMap.get(booking.roomName)
    if (existing) {
      existing.push(booking)
    } else {
      roomMap.set(booking.roomName, [booking])
    }
  }
  for (const [roomName, roomBookings] of roomMap) {
    roomGroups.push({ roomName, bookings: roomBookings })
  }
  roomGroups.sort((a, b) => a.roomName.localeCompare(b.roomName, "fr"))

  const toggleRoom = (roomName: string) => {
    setExpandedRooms(prev => {
      const next = new Set(prev)
      if (next.has(roomName)) {
        next.delete(roomName)
      } else {
        next.add(roomName)
      }
      return next
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="type-h3 text-foreground">
          Salles de réunion {dateLabel}{siteName ? ` - ${siteName}` : ""}
        </h2>
      </div>

      {roomGroups.length === 0 ? (
        <div className="rounded-[20px] bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <DoorOpen className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Aucune réservation de salle {dateLabel}
          </p>
        </div>
      ) : (
        <div className="rounded-[20px] bg-card">
          <div className="divide-y divide-gray-100">
            {roomGroups.map((group) => {
              const isExpanded = expandedRooms.has(group.roomName)

              return (
                <div key={group.roomName}>
                  {/* Room header */}
                  <button
                    type="button"
                    onClick={() => toggleRoom(group.roomName)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/50 sm:px-6"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                      <DoorOpen className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <span className="truncate font-bold text-foreground">
                        {group.roomName}
                      </span>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {group.bookings.length} réservation{group.bookings.length > 1 ? "s" : ""}
                      </p>
                    </div>

                    <ChevronDown className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </button>

                  {/* Expanded booking list */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 bg-gray-50/30 px-5 py-2 sm:px-6">
                      {group.bookings.map((booking) => (
                        <div
                          key={booking.id}
                          className="flex flex-col gap-1 rounded-lg px-3 py-3 transition-colors hover:bg-white sm:flex-row sm:items-center sm:gap-4"
                        >
                          {/* Time */}
                          <div className="flex items-center gap-2 text-sm font-medium text-foreground sm:min-w-[140px]">
                            <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{booking.startTime} – {booking.endTime}</span>
                            <span className="text-xs text-muted-foreground">({booking.durationHours}h)</span>
                          </div>

                          {/* Company */}
                          {booking.companyName && (
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground sm:min-w-[140px]">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />
                              <span className="truncate">{booking.companyName}</span>
                            </div>
                          )}

                          {/* Notes */}
                          {booking.notes && (
                            <div className="flex items-start gap-1.5 text-xs text-muted-foreground/80 sm:flex-1">
                              <MessageSquare className="mt-0.5 h-3 w-3 shrink-0" />
                              <span className="line-clamp-1">{booking.notes}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
