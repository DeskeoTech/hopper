"use client"

import { useMemo } from "react"
import { CalendarX2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserBookingCard } from "./user-booking-card"
import { ContractCard } from "./contract-card"
import type { BookingWithDetails, ContractForDisplay, ReservationItem, ReservationItemType } from "@/lib/types/database"

interface UserBookingsSectionProps {
  bookings: BookingWithDetails[]
  contracts?: ContractForDisplay[]
  userId?: string
  onBookClick?: () => void
  canBook?: boolean
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
  onBookClick,
  canBook = true,
}: UserBookingsSectionProps) {
  // Create unified reservation items and filter by past/upcoming
  const { upcomingItems, pastItems } = useMemo(() => {
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

    // Filter and sort by start_date descending (most recent first)
    // For bookings: use start_date to determine upcoming/past (once started = past)
    // For contracts: use end_date (active until terminated or ended)
    const upcoming = allItems
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

    const past = allItems
      .filter((item) => {
        if (item.booking) {
          // Booking is past if it has started or is cancelled
          return new Date(item.start_date) <= now || item.status === "cancelled"
        }
        if (item.contract) {
          return item.status === "terminated" || (item.end_date && new Date(item.end_date) < now)
        }
        return false
      })
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())

    return { upcomingItems: upcoming, pastItems: past }
  }, [bookings, contracts])

  const totalItems = bookings.length + contracts.length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-header text-xl text-foreground">Mes réservations</h2>
        {onBookClick && (
          <Button
            variant="outline"
            onClick={onBookClick}
            className="rounded-full border-foreground/20 transition-all duration-200 hover:bg-foreground hover:text-primary-foreground"
          >
            Réserver
          </Button>
        )}
      </div>

      {upcomingItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            À venir ({upcomingItems.length})
          </h3>
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
        </div>
      )}

      {pastItems.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Passées ({pastItems.length})
          </h3>
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2">
              {pastItems.slice(0, 10).map((item) =>
                item.booking ? (
                  <UserBookingCard
                    key={`booking-${item.id}`}
                    booking={item.booking}
                    userId={userId}
                    isPast={true}
                  />
                ) : item.contract ? (
                  <ContractCard
                    key={`contract-${item.id}`}
                    contract={item.contract}
                    type={item.type}
                    isPast={true}
                  />
                ) : null
              )}
            </div>
          </div>
        </div>
      )}

      {totalItems === 0 && (
        <div className="rounded-[16px] bg-card p-8 text-center shadow-sm sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-background">
            <CalendarX2 className="h-8 w-8 text-foreground/50" />
          </div>
          <p className="mt-6 text-foreground/70">
            {canBook
              ? "Vous n'avez pas encore de réservations"
              : "Vous n'avez pas de contrat actif pour réserver une salle"}
          </p>
          {onBookClick && canBook && (
            <Button
              onClick={onBookClick}
              className="mt-6 rounded-full bg-foreground text-primary-foreground hover:bg-foreground/90"
              size="lg"
            >
              Faire une réservation
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
