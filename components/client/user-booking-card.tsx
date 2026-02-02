"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin } from "lucide-react"
import { CancelBookingDialog } from "./cancel-booking-dialog"
import { EditBookingDialog } from "./edit-booking-dialog"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface UserBookingCardProps {
  booking: BookingWithDetails
  userId?: string
  isPast?: boolean
}

export function UserBookingCard({ booking, userId, isPast = false }: UserBookingCardProps) {
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const parsedDate = parseISO(booking.start_date)
  const dayName = format(parsedDate, "EEEE", { locale: fr }).toUpperCase()
  const dayNumber = format(parsedDate, "d", { locale: fr })
  const monthName = format(parsedDate, "MMMM", { locale: fr })
  const startTime = format(parsedDate, "HH:mm", { locale: fr })
  const endTime = format(parseISO(booking.end_date), "HH:mm", { locale: fr })
  const fullDate = format(parsedDate, "EEEE d MMMM yyyy", { locale: fr })

  const isCancelled = booking.status === "cancelled"
  // Past = end_date has passed (both date AND time)
  const isActuallyPast = new Date(booking.end_date) < new Date()
  const canModify = !isCancelled && !isActuallyPast && userId

  return (
    <>
      <div
        className={cn(
          "flex-shrink-0 w-[160px] rounded-[20px] bg-card p-4  transition-all duration-200",
          isPast && "opacity-50"
        )}
      >
        <div className="flex flex-col items-center text-center">
          {/* Type tag */}
          <span className="mb-2 rounded-full bg-foreground/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-foreground/70">
            SALLE DE RÉUNION
          </span>

          {/* Day name */}
          <p className="font-header text-[10px] font-medium tracking-wide text-foreground/40">
            {dayName}
          </p>

          {/* Day number + month */}
          <div className="mt-1 flex items-baseline gap-1">
            <span className="font-header text-2xl font-semibold text-foreground">
              {dayNumber}
            </span>
            <span className="text-xs text-foreground/50">{monthName}</span>
          </div>

          {/* Time */}
          <p className="mt-2 text-xs text-foreground/70">
            {startTime} - {endTime}
          </p>

          {/* Room name and floor */}
          {booking.resource_name && (
            <p className="mt-1.5 text-[10px] font-medium text-foreground/60 truncate max-w-[130px]">
              {booking.resource_name}
              {booking.resource_floor && ` · ${booking.resource_floor}`}
            </p>
          )}

          {/* Site name */}
          {booking.site_name && (
            <div className="mt-1 flex items-center gap-1 text-[10px] text-foreground/40">
              <MapPin className="h-2.5 w-2.5" />
              <span className="truncate max-w-[110px]">{booking.site_name}</span>
            </div>
          )}

          {/* Action buttons */}
          {canModify && (
            <div className="mt-3 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setEditDialogOpen(true)}
                className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] text-foreground/70 transition-colors hover:bg-foreground/10"
              >
                Modifier
              </button>
              <button
                type="button"
                onClick={() => setCancelDialogOpen(true)}
                className="rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                Annuler
              </button>
            </div>
          )}

          {/* Status badge for past/cancelled */}
          {(isPast || isCancelled) && (
            <span className="mt-2.5 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] text-foreground/50">
              {isCancelled ? "Annulée" : "Terminée"}
            </span>
          )}
        </div>
      </div>

      {userId && (
        <>
          <CancelBookingDialog
            bookingId={booking.id}
            userId={userId}
            bookingDate={fullDate}
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
