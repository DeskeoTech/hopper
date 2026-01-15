import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, User, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookingStatusBadge } from "./booking-status-badge"
import type { BookingWithDetails } from "@/lib/types/database"

interface BookingCardProps {
  booking: BookingWithDetails
  compact?: boolean
}

const resourceTypeLabels: Record<string, string> = {
  bench: "Bench",
  meeting_room: "Salle de reunion",
  flex_desk: "Flex desk",
  fixed_desk: "Bureau fixe",
}

export function BookingCard({ booking, compact = false }: BookingCardProps) {
  const startTime = format(parseISO(booking.start_date), "HH:mm", {
    locale: fr,
  })
  const endTime = format(parseISO(booking.end_date), "HH:mm", { locale: fr })
  const userName =
    booking.user_first_name || booking.user_last_name
      ? `${booking.user_first_name || ""} ${booking.user_last_name || ""}`.trim()
      : booking.user_email || "Utilisateur inconnu"

  if (compact) {
    return (
      <div
        className={cn(
          "rounded-md border p-2 text-xs",
          booking.status === "confirmed" &&
            "border-success/30 bg-success/10 text-success",
          booking.status === "pending" &&
            "border-warning/30 bg-warning/10 text-warning",
          booking.status === "cancelled" &&
            "border-destructive/30 bg-destructive/10 text-destructive",
          !booking.status && "border-border bg-muted text-muted-foreground"
        )}
      >
        <div className="font-medium">
          {startTime} - {endTime}
        </div>
        <div className="truncate">{booking.resource_name || "Ressource"}</div>
        <div className="truncate opacity-80">{userName}</div>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 flex-shrink-0" />
            <span>
              {startTime} - {endTime}
            </span>
          </div>

          <h3 className="font-semibold text-foreground">
            {booking.resource_name || "Ressource inconnue"}
            {booking.resource_type && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({resourceTypeLabels[booking.resource_type] || booking.resource_type})
              </span>
            )}
          </h3>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-4 w-4" />
              <span>{userName}</span>
              {booking.company_name && (
                <span className="text-muted-foreground/70">
                  ({booking.company_name})
                </span>
              )}
            </div>

            {booking.site_name && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{booking.site_name}</span>
              </div>
            )}
          </div>

          {booking.notes && (
            <p className="text-sm text-muted-foreground">{booking.notes}</p>
          )}
        </div>

        <BookingStatusBadge status={booking.status} />
      </div>
    </div>
  )
}
