import { Calendar, CalendarX2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserBookingCard } from "./user-booking-card"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingsSectionProps {
  bookings: BookingWithDetails[]
  userId?: string
  onBookClick?: () => void
}

export function UserBookingsSection({
  bookings,
  userId,
  onBookClick,
}: UserBookingsSectionProps) {
  const now = new Date()
  const upcomingBookings = bookings.filter(
    (b) => new Date(b.start_date) >= now && b.status !== "cancelled"
  )
  const pastBookings = bookings.filter(
    (b) => new Date(b.start_date) < now || b.status === "cancelled"
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        <h2 className="text-base font-bold uppercase tracking-wide text-foreground sm:text-lg">
          Mes réservations
        </h2>
      </div>

      {upcomingBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="type-small font-medium uppercase tracking-wide text-muted-foreground">
            À venir ({upcomingBookings.length})
          </h3>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <UserBookingCard key={booking.id} booking={booking} userId={userId} />
            ))}
          </div>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="type-small font-medium uppercase tracking-wide text-muted-foreground">
            Passées ({pastBookings.length})
          </h3>
          <div className="space-y-3 opacity-75">
            {pastBookings.slice(0, 10).map((booking) => (
              <UserBookingCard key={booking.id} booking={booking} userId={userId} />
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="rounded-[20px] bg-card p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CalendarX2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-6 type-body text-muted-foreground">
            Vous n&apos;avez pas encore de réservations
          </p>
          {onBookClick && (
            <Button onClick={onBookClick} className="mt-6 uppercase" size="lg">
              Faire une réservation
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
