"use client"

import { useState, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight, Loader2, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TimeSlotPicker } from "./time-slot-picker"
import { checkAvailability, updateBooking } from "@/lib/actions/bookings"
import { disabledDateMatcher, getNextBusinessDay, getPreviousBusinessDay, isToday } from "@/lib/dates"
import type { BookingWithDetails } from "@/lib/types/database"

interface EditBookingDialogProps {
  booking: BookingWithDetails
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function EditBookingDialog({
  booking,
  userId,
  open,
  onOpenChange,
  onSuccess,
}: EditBookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)

  const initialDate = parseISO(booking.start_date)
  const initialStartHour = new Date(booking.start_date).getHours()
  const initialEndHour = new Date(booking.end_date).getHours()

  // Build initial slots from booking
  const buildInitialSlots = () => {
    const slots: string[] = []
    for (let h = initialStartHour; h < initialEndHour; h++) {
      slots.push(`${h.toString().padStart(2, "0")}:00`)
    }
    return slots
  }

  const [selectedDate, setSelectedDate] = useState<Date>(initialDate)
  const [selectedSlots, setSelectedSlots] = useState<string[]>(buildInitialSlots())
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSelectedDate(initialDate)
      setSelectedSlots(buildInitialSlots())
      setError(null)
    }
  }, [open])

  // Load availability when date changes
  useEffect(() => {
    if (open && booking.resource_id && selectedDate) {
      setLoadingSlots(true)
      setUnavailableSlots([])
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      checkAvailability(booking.resource_id, dateStr).then((result) => {
        setLoadingSlots(false)
        if (result.error) {
          setError(result.error)
        } else {
          // Convert bookings to unavailable slots
          // Exclude current booking's slots from unavailable
          const unavailable: string[] = []
          result.bookings.forEach((b) => {
            const startHour = new Date(b.start_date).getHours()
            const endHour = new Date(b.end_date).getHours()
            for (let h = startHour; h < endHour; h++) {
              const slot = `${h.toString().padStart(2, "0")}:00`
              // Only mark as unavailable if it's not from the current booking being edited
              // Check if this booking overlaps with the current booking being edited
              const isCurrentBookingSlot =
                format(selectedDate, "yyyy-MM-dd") === format(initialDate, "yyyy-MM-dd") &&
                h >= initialStartHour && h < initialEndHour
              if (!isCurrentBookingSlot) {
                unavailable.push(slot)
              }
            }
          })
          setUnavailableSlots(unavailable)
        }
      })
    }
  }, [open, booking.resource_id, selectedDate])

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setSelectedSlots([])
      setCalendarOpen(false)
      setError(null)
    }
  }

  const handleSave = async () => {
    if (selectedSlots.length === 0) {
      setError("Veuillez sélectionner au moins un créneau")
      return
    }

    setIsLoading(true)
    setError(null)

    // Sort slots and get first/last
    const sortedSlots = [...selectedSlots].sort()
    const firstSlot = sortedSlots[0]
    const lastSlot = sortedSlots[sortedSlots.length - 1]
    const lastHour = parseInt(lastSlot.split(":")[0]) + 1

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const startDate = `${dateStr}T${firstSlot}:00Z`
    const endDate = `${dateStr}T${lastHour.toString().padStart(2, "0")}:00:00Z`

    const result = await updateBooking({
      bookingId: booking.id,
      userId,
      startDate,
      endDate,
      resourceId: booking.resource_id || "",
    })

    if (result.error) {
      setError(result.error)
      setIsLoading(false)
      return
    }

    setIsLoading(false)
    onOpenChange(false)
    onSuccess?.()
  }

  const isTodaySelected = isToday(selectedDate)
  const previousBusinessDay = getPreviousBusinessDay(selectedDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modifier la réservation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Room info */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <p className="font-medium text-foreground">{booking.resource_name}</p>
            {booking.resource_capacity && (
              <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>{booking.resource_capacity} personnes</span>
              </div>
            )}
          </div>

          {/* Date navigation */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => {
                  if (previousBusinessDay) {
                    setSelectedDate(previousBusinessDay)
                  }
                }}
                disabled={!previousBusinessDay}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {isTodaySelected
                      ? "Aujourd'hui"
                      : format(selectedDate, "EEEE d MMMM", { locale: fr })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateChange}
                    disabled={disabledDateMatcher}
                  />
                </PopoverContent>
              </Popover>

              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={() => setSelectedDate(getNextBusinessDay(selectedDate))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Time slot picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Créneaux</label>
            {loadingSlots ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <TimeSlotPicker
                selectedSlots={selectedSlots}
                onSlotsChange={setSelectedSlots}
                unavailableSlots={unavailableSlots}
              />
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || selectedSlots.length === 0}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
