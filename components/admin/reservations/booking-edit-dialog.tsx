"use client"

import { useState, useTransition } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar, Clock, MapPin, User, Building2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { BookingStatusBadge } from "./booking-status-badge"
import { updateBookingDate, cancelBooking } from "@/lib/actions/bookings"
import type { BookingWithDetails } from "@/lib/types/database"

interface BookingEditDialogProps {
  booking: BookingWithDetails | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BookingEditDialog({
  booking,
  open,
  onOpenChange,
}: BookingEditDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state for date modification
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")

  // Reset form when booking changes
  const resetForm = () => {
    if (booking) {
      const startDate = parseISO(booking.start_date)
      const endDate = parseISO(booking.end_date)
      setDate(format(startDate, "yyyy-MM-dd"))
      setStartTime(format(startDate, "HH:mm"))
      setEndTime(format(endDate, "HH:mm"))
    }
    setError(null)
  }

  // Handle dialog open change
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  // Handle date modification
  const handleUpdateDate = () => {
    if (!booking) return

    setError(null)
    const newStartDate = `${date}T${startTime}:00`
    const newEndDate = `${date}T${endTime}:00`

    // Validate times
    if (startTime >= endTime) {
      setError("L'heure de fin doit être après l'heure de début")
      return
    }

    startTransition(async () => {
      const result = await updateBookingDate({
        bookingId: booking.id,
        startDate: new Date(newStartDate).toISOString(),
        endDate: new Date(newEndDate).toISOString(),
      })

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  // Handle booking cancellation
  const handleCancel = () => {
    if (!booking) return

    setError(null)
    startTransition(async () => {
      const result = await cancelBooking(booking.id)

      if (result.error) {
        setError(result.error)
        setShowCancelConfirm(false)
      } else {
        setShowCancelConfirm(false)
        onOpenChange(false)
      }
    })
  }

  if (!booking) return null

  const isCancelled = booking.status === "cancelled"
  const userName = [booking.user_first_name, booking.user_last_name]
    .filter(Boolean)
    .join(" ") || "Utilisateur inconnu"

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[500px] sm:rounded-[20px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>Détails de la réservation</span>
              <BookingStatusBadge status={booking.status} />
            </DialogTitle>
            <DialogDescription>
              {isCancelled
                ? "Cette réservation a été annulée"
                : "Modifier ou annuler cette réservation"}
            </DialogDescription>
          </DialogHeader>

          {/* Booking details */}
          <div className="space-y-4 py-4">
            {/* Resource info */}
            <div className="rounded-[16px] border border-border/10 bg-muted/30 p-4">
              <p className="text-sm font-bold uppercase tracking-tight">
                {booking.resource_name || "Ressource"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {booking.resource_type === "meeting_room"
                  ? "Salle de réunion"
                  : booking.resource_type === "bench"
                    ? "Poste"
                    : booking.resource_type === "flex_desk"
                      ? "Flex desk"
                      : "Fixed desk"}
              </p>
            </div>

            {/* Details grid */}
            <div className="grid gap-3 text-sm">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{booking.site_name || "Site inconnu"}</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{userName}</span>
              </div>
              {booking.company_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span>{booking.company_name}</span>
                </div>
              )}
            </div>

            {/* Date/time modification form */}
            {!isCancelled && (
              <div className="space-y-4 border-t border-border/10 pt-4">
                <p className="text-sm font-bold">Modifier la date et l&apos;heure</p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Date
                    </Label>
                    <Input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      disabled={isPending}
                      className="rounded-[12px]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="startTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Début
                      </Label>
                      <Input
                        id="startTime"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        disabled={isPending}
                        className="rounded-[12px]"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="endTime" className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Fin
                      </Label>
                      <Input
                        id="endTime"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        disabled={isPending}
                        className="rounded-[12px]"
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-destructive">{error}</p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            {!isCancelled && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowCancelConfirm(true)}
                  disabled={isPending}
                  className="w-full rounded-[12px] sm:w-auto"
                >
                  Annuler la réservation
                </Button>
                <Button
                  onClick={handleUpdateDate}
                  disabled={isPending}
                  className="w-full rounded-[12px] sm:w-auto"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    "Enregistrer"
                  )}
                </Button>
              </>
            )}
            {isCancelled && (
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="w-full rounded-[12px] sm:w-auto"
              >
                Fermer
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel confirmation dialog */}
      <AlertDialog open={showCancelConfirm} onOpenChange={setShowCancelConfirm}>
        <AlertDialogContent className="sm:rounded-[20px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette réservation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La réservation de{" "}
              <strong>{booking.resource_name}</strong> pour{" "}
              <strong>{userName}</strong> le{" "}
              <strong>
                {format(parseISO(booking.start_date), "d MMMM yyyy", {
                  locale: fr,
                })}
              </strong>{" "}
              sera définitivement annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isPending}
              className="rounded-[12px]"
            >
              Retour
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-[12px] bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Annulation...
                </>
              ) : (
                "Oui, annuler"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
