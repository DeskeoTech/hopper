"use client"

import { useState } from "react"
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
import { cancelBooking } from "@/lib/actions/bookings"

interface CancelBookingDialogProps {
  bookingId: string
  userId: string
  bookingDate: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CancelBookingDialog({
  bookingId,
  userId,
  bookingDate,
  open,
  onOpenChange,
  onSuccess,
}: CancelBookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCancel = async () => {
    setIsLoading(true)
    setError(null)

    const result = await cancelBooking(bookingId, userId)

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[20px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Annuler la reservation</AlertDialogTitle>
          <AlertDialogDescription>
            Etes-vous sur de vouloir annuler cette reservation du {bookingDate} ?
            Cette action est irreversible.
          </AlertDialogDescription>
          {error && (
            <p className="text-sm text-destructive mt-2">{error}</p>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Non, garder
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? "Annulation..." : "Oui, annuler"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
