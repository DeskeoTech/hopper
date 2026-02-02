"use client"

import { useMemo } from "react"
import { CalendarX2 } from "lucide-react"
import { UserBookingCard } from "./user-booking-card"
import { ContractCard } from "./contract-card"
import type { BookingWithDetails, ContractForDisplay, ReservationItem, ReservationItemType } from "@/lib/types/database"

interface UserBookingsSectionProps {
  bookings: BookingWithDetails[]
  contracts?: ContractForDisplay[]
  userId?: string
}

function getPassType(recurrence: string | null): ReservationItemType {
  switch (recurrence) {
    case "daily":
      return "pass_day"
    case "weekly":
      return "pass_week"
    case "monthly":
      return "pass_month"
    default:
      return "pass_month"
  }
}

export function UserBookingsSection({
  bookings,
  contracts = [],
  userId,
}: UserBookingsSectionProps) {
  // Create unified reservation items and filter for upcoming only
  const upcomingItems = useMemo(() => {
    const now = new Date()

    // Transform bookings to reservation items
    const bookingItems: ReservationItem[] = bookings.map((b) => ({
      id: b.id,
      type: "meeting_room" as ReservationItemType,
      start_date: b.start_date,
      end_date: b.end_date,
      site_name: b.site_name,
      status: b.status || "confirmed",
      booking: b,
    }))

    // Transform contracts to reservation items
    const contractItems: ReservationItem[] = contracts.map((c) => ({
      id: c.id,
      type: getPassType(c.plan_recurrence),
      start_date: c.start_date || "",
      end_date: c.end_date || "",
      site_name: c.site_name,
      status: c.status,
      contract: c,
    }))

    // Combine all items
    const allItems = [...bookingItems, ...contractItems]

    // Filter for upcoming only and sort by start_date ascending
    return allItems
      .filter((item) => {
        if (item.booking) {
          // Booking is upcoming if it hasn't started yet
          return new Date(item.start_date) > now && item.status !== "cancelled"
        }
        if (item.contract) {
          return item.status !== "terminated" && (!item.end_date || new Date(item.end_date) >= now)
        }
        return false
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [bookings, contracts])

  return (
    <div className="space-y-4">
      <h2 className="font-header text-xl text-foreground">Réservations à venir</h2>

      {upcomingItems.length > 0 ? (
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 pb-2">
            {upcomingItems.map((item) =>
              item.booking ? (
                <UserBookingCard
                  key={`booking-${item.id}`}
                  booking={item.booking}
                  userId={userId}
                  isPast={false}
                />
              ) : item.contract ? (
                <ContractCard
                  key={`contract-${item.id}`}
                  contract={item.contract}
                  type={item.type}
                  isPast={false}
                />
              ) : null
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-[20px] bg-card p-6 text-center ">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarX2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune réservation à venir
          </p>
        </div>
      )}
    </div>
  )
}
