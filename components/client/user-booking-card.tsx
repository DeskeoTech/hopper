"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin } from "lucide-react"
import { CancelBookingDialog } from "./cancel-booking-dialog"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingCardProps {
  booking: BookingWithDetails
  userId?: string
  isPast?: boolean
}

export function UserBookingCard({ booking, userId, isPast = false }: UserBookingCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)

  const parsedDate = parseISO(booking.start_date)
  const formattedDate = format(parsedDate, "dd/MM/yyyy", { locale: fr })
  const startTime = format(parsedDate, "HH:mm", { locale: fr })
  const endTime = format(parseISO(booking.end_date), "HH:mm", { locale: fr })
  const fullDate = format(parsedDate, "EEEE d MMMM yyyy", { locale: fr })

  const isCancelled = booking.status === "cancelled"
  // Past = end_date has passed (both date AND time)
  const now = new Date()
  const isActuallyPast = new Date(booking.end_date) < now
  // Ongoing = currently happening (start_date <= now <= end_date)
  const isOngoing = new Date(booking.start_date) <= now && new Date(booking.end_date) >= now
  const canModify = !isCancelled && !isActuallyPast && userId

  return (
    <>
      <div
        className={cn(
          "flex-shrink-0 w-[180px] rounded-[20px] bg-card p-5 transition-all duration-200",
          isPast && "opacity-50"
        )}
      >
        <div className="flex flex-col items-center text-center">
          {/* Date DD/MM/YYYY */}
          <p className="font-header text-xl font-semibold text-foreground">
            {formattedDate}
          </p>

          {/* Time */}
          <p className="mt-2 text-sm text-foreground/70">
            {startTime} - {endTime}
          </p>

          {/* Room name and floor */}
          {booking.resource_name && (
            <p className="mt-1.5 text-xs font-medium text-foreground/60 truncate max-w-[150px]">
              {booking.resource_name}
              {booking.resource_floor && ` · ${booking.resource_floor}`}
            </p>
          )}

          {/* Site name */}
          {booking.site_name && (
            <div className="mt-1 flex items-center gap-1 text-xs text-foreground/40">
              <MapPin className="h-3 w-3" />
              <span className="truncate max-w-[130px]">{booking.site_name}</span>
            </div>
          )}

          {/* Action button */}
          {canModify && (
            <button
              type="button"
              onClick={() => setCancelDialogOpen(true)}
              className="mt-3 rounded-full bg-foreground/5 px-3 py-1.5 text-xs text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              Annuler
            </button>
          )}

          {/* Status badge: En cours > Annulée > Terminée */}
          {isOngoing && !isCancelled && (
            <span className="mt-2.5 rounded-full bg-green-500/20 px-3 py-1 text-xs font-semibold text-green-700">
              En cours
            </span>
          )}
          {!isOngoing && (isPast || isCancelled) && (
            <span className="mt-2.5 rounded-full bg-foreground/5 px-3 py-1 text-xs text-foreground/50">
              {isCancelled ? "Annulée" : "Terminée"}
            </span>
          )}
        </div>
      </div>

      {userId && (
        <CancelBookingDialog
          bookingId={booking.id}
          userId={userId}
          bookingDate={fullDate}
          open={cancelDialogOpen}
          onOpenChange={setCancelDialogOpen}
        />
      )}
    </>
  )
}
