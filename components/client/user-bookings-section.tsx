"use client"

import { useMemo } from "react"
import { CalendarX2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserBookingCard } from "./user-booking-card"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingsSectionProps {
  bookings: BookingWithDetails[]
  userId?: string
  onBookClick?: () => void
  canBook?: boolean
}

export function UserBookingsSection({
  bookings,
  userId,
  onBookClick,
  canBook = true,
}: UserBookingsSectionProps) {
  // Memoize filtered bookings to avoid recalculating on every render
  const { upcomingBookings, pastBookings } = useMemo(() => {
    const now = new Date()
    return {
      upcomingBookings: bookings.filter(
        (b) => new Date(b.start_date) >= now && b.status !== "cancelled"
      ),
      pastBookings: bookings.filter(
        (b) => new Date(b.start_date) < now || b.status === "cancelled"
      ),
    }
  }, [bookings])

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

      {upcomingBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            À venir ({upcomingBookings.length})
          </h3>
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2">
              {upcomingBookings.map((booking) => (
                <UserBookingCard key={booking.id} booking={booking} userId={userId} isPast={false} />
              ))}
            </div>
          </div>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wide text-foreground/50">
            Passées ({pastBookings.length})
          </h3>
          <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
            <div className="flex gap-3 pb-2">
              {pastBookings.slice(0, 10).map((booking) => (
                <UserBookingCard key={booking.id} booking={booking} userId={userId} isPast={true} />
              ))}
            </div>
          </div>
        </div>
      )}

      {bookings.length === 0 && (
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
