"use client"

import { useMemo } from "react"
import { CalendarX2 } from "lucide-react"
import { UserBookingCard } from "./user-booking-card"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingsSectionProps {
  bookings: BookingWithDetails[]
  userId?: string
}

export function UserBookingsSection({
  bookings,
  userId,
}: UserBookingsSectionProps) {
  // Filter meeting room bookings (upcoming or ongoing, not cancelled)
  const meetingRoomBookings = useMemo(() => {
    const now = new Date()
    return bookings
      .filter((b) => {
        // Include if: upcoming (start > now) OR ongoing (start <= now <= end)
        const isUpcoming = new Date(b.start_date) > now
        const isOngoing = new Date(b.start_date) <= now && new Date(b.end_date) >= now
        return (isUpcoming || isOngoing) && b.status !== "cancelled"
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [bookings])

  if (meetingRoomBookings.length === 0) {
    return (
      <div className="rounded-[16px] bg-card p-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
          <CalendarX2 className="h-7 w-7 text-foreground/40" />
        </div>
        <p className="mt-4 text-base text-muted-foreground">
          Aucune réservation de salle
        </p>
      </div>
    )
  }

  return (
    <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
      <div className="flex gap-3 pb-2">
        {meetingRoomBookings.map((booking) => (
          <UserBookingCard
            key={`booking-${booking.id}`}
            booking={booking}
            userId={userId}
            isPast={false}
          />
        ))}
      </div>
    </div>
  )
}
