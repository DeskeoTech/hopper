import { Calendar } from "lucide-react"
import { UserBookingCard } from "./user-booking-card"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingsSectionProps {
  bookings: BookingWithDetails[]
}

export function UserBookingsSection({ bookings }: UserBookingsSectionProps) {
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
        <h2 className="type-h3 text-foreground">Mes reservations</h2>
      </div>

      {upcomingBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="type-small font-medium text-muted-foreground uppercase tracking-wide">
            A venir ({upcomingBookings.length})
          </h3>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <UserBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {pastBookings.length > 0 && (
        <div className="space-y-3">
          <h3 className="type-small font-medium text-muted-foreground uppercase tracking-wide">
            Passees ({pastBookings.length})
          </h3>
          <div className="space-y-3 opacity-75">
            {pastBookings.slice(0, 10).map((booking) => (
              <UserBookingCard key={booking.id} booking={booking} />
            ))}
          </div>
        </div>
      )}

      {bookings.length === 0 && (
        <div className="rounded-[20px] border border-dashed bg-card p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 type-body text-muted-foreground">
            Vous n&apos;avez pas encore de reservations
          </p>
        </div>
      )}
    </div>
  )
}
