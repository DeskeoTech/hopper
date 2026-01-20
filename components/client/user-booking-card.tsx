"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Clock, Pencil, X } from "lucide-react"
import { BookingStatusBadge } from "@/components/admin/reservations/booking-status-badge"
import { Button } from "@/components/ui/button"
import { CancelBookingDialog } from "./cancel-booking-dialog"
import { EditBookingDialog } from "./edit-booking-dialog"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingCardProps {
  booking: BookingWithDetails
  userId?: string
}

const resourceTypeLabels: Record<string, string> = {
  bench: "Bench",
  meeting_room: "Salle de reunion",
  flex_desk: "Flex desk",
  fixed_desk: "Bureau fixe",
}

export function UserBookingCard({ booking, userId }: UserBookingCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const date = format(parseISO(booking.start_date), "EEEE d MMMM yyyy", {
    locale: fr,
  })
  const startTime = format(parseISO(booking.start_date), "HH:mm", { locale: fr })
  const endTime = format(parseISO(booking.end_date), "HH:mm", { locale: fr })

  const isCancelled = booking.status === "cancelled"
  const canModify = !isCancelled && userId

  return (
    <>
      <div className="rounded-[20px] border border-border bg-card p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="type-body font-medium capitalize text-foreground">
              {date}
            </p>

            <div className="flex items-center gap-2 type-body-sm text-muted-foreground">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>
                {startTime} - {endTime}
              </span>
            </div>

            <h3 className="type-body font-semibold text-foreground">
              {booking.resource_name || "Ressource inconnue"}
              {booking.resource_type && (
                <span className="ml-2 type-body-sm font-normal text-muted-foreground">
                  ({resourceTypeLabels[booking.resource_type] || booking.resource_type})
                </span>
              )}
            </h3>

            {booking.site_name && (
              <div className="flex items-center gap-1 type-body-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{booking.site_name}</span>
              </div>
            )}

            {canModify && (
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="h-8 text-xs"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                  className="h-8 text-xs text-destructive hover:text-destructive"
                >
                  <X className="mr-1 h-3 w-3" />
                  Annuler
                </Button>
              </div>
            )}
          </div>

          <BookingStatusBadge status={booking.status} />
        </div>
      </div>

      {userId && (
        <>
          <CancelBookingDialog
            bookingId={booking.id}
            userId={userId}
            bookingDate={date}
            open={cancelDialogOpen}
            onOpenChange={setCancelDialogOpen}
          />

          <EditBookingDialog
            booking={booking}
            userId={userId}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        </>
      )}
    </>
  )
}
