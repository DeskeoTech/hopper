"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Clock, Pencil, X, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CancelBookingDialog } from "./cancel-booking-dialog"
import { EditBookingDialog } from "./edit-booking-dialog"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingCardProps {
  booking: BookingWithDetails
  userId?: string
  isPast?: boolean
}

const resourceTypeLabels: Record<string, string> = {
  bench: "Bench",
  meeting_room: "Salle de réunion",
  flex_desk: "Flex desk",
  fixed_desk: "Bureau fixe",
}

function getStatusBadge(status: string, isPast: boolean) {
  if (status === "cancelled") {
    return (
      <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-medium text-foreground/70">
        Annulée
      </span>
    )
  }
  if (isPast) {
    return (
      <span className="rounded-full bg-foreground/10 px-3 py-1 text-xs font-medium text-foreground/70">
        Terminée
      </span>
    )
  }
  return (
    <span className="rounded-full bg-foreground px-3 py-1 text-xs font-medium text-primary-foreground">
      Confirmée
    </span>
  )
}

export function UserBookingCard({ booking, userId, isPast = false }: UserBookingCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const date = format(parseISO(booking.start_date), "EEEE d MMMM yyyy", {
    locale: fr,
  })
  const startTime = format(parseISO(booking.start_date), "HH:mm", { locale: fr })
  const endTime = format(parseISO(booking.end_date), "HH:mm", { locale: fr })

  const isCancelled = booking.status === "cancelled"
  const isActuallyPast = new Date(booking.start_date) < new Date()
  const canModify = !isCancelled && !isActuallyPast && userId

  return (
    <>
      <div
        className={cn(
          "rounded-[16px] p-6 shadow-sm transition-all duration-200",
          isPast ? "bg-card/60" : "bg-card"
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div className={cn("min-w-0 flex-1 space-y-2", isPast && "opacity-70")}>
            <p className="text-base font-medium capitalize text-foreground">
              {date}
            </p>

            <div className="flex items-center gap-2 text-sm text-foreground/60">
              <Clock className="h-4 w-4 flex-shrink-0" />
              <span>
                {startTime} - {endTime}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-foreground">
              {booking.resource_name || "Ressource inconnue"}
            </h3>

            <div className="flex flex-wrap items-center gap-3 text-sm text-foreground/60">
              {booking.resource_capacity && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{booking.resource_capacity} pers.</span>
                </div>
              )}
              {booking.site_name && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{booking.site_name}</span>
                </div>
              )}
            </div>

            {canModify && (
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditDialogOpen(true)}
                  className="h-8 rounded-[12px] border-foreground/20 text-xs transition-all duration-200 hover:bg-foreground hover:text-primary-foreground"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCancelDialogOpen(true)}
                  className="h-8 rounded-[12px] border-foreground/20 text-xs transition-all duration-200 hover:bg-foreground hover:text-primary-foreground"
                >
                  <X className="mr-1 h-3 w-3" />
                  Annuler
                </Button>
              </div>
            )}
          </div>

          {getStatusBadge(booking.status, isPast)}
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
