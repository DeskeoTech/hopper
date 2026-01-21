"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateBooking } from "@/lib/actions/bookings"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface EditBookingDialogProps {
  booking: BookingWithDetails
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 8) // 8h to 20h

export function EditBookingDialog({
  booking,
  userId,
  open,
  onOpenChange,
  onSuccess,
}: EditBookingDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initialDate = parseISO(booking.start_date)
  const initialStartHour = new Date(booking.start_date).getHours()
  const initialEndHour = new Date(booking.end_date).getHours()

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(initialDate)
  const [startHour, setStartHour] = useState(initialStartHour.toString())
  const [endHour, setEndHour] = useState(initialEndHour.toString())

  const handleSave = async () => {
    if (!selectedDate) {
      setError("Veuillez selectionner une date")
      return
    }

    const startHourNum = parseInt(startHour)
    const endHourNum = parseInt(endHour)

    if (endHourNum <= startHourNum) {
      setError("L'heure de fin doit etre apres l'heure de debut")
      return
    }

    setIsLoading(true)
    setError(null)

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const startDate = `${dateStr}T${startHour.padStart(2, "0")}:00:00Z`
    const endDate = `${dateStr}T${endHour.padStart(2, "0")}:00:00Z`

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[20px] sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modifier la reservation</DialogTitle>
          <DialogDescription>
            Modifiez la date et l&apos;horaire de votre reservation pour{" "}
            <span className="font-medium">{booking.resource_name}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })
                  ) : (
                    <span>Selectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Debut</label>
              <Select value={startHour} onValueChange={setStartHour}>
                <SelectTrigger>
                  <SelectValue placeholder="Heure de debut" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fin</label>
              <Select value={endHour} onValueChange={setEndHour}>
                <SelectTrigger>
                  <SelectValue placeholder="Heure de fin" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((hour) => (
                    <SelectItem key={hour} value={hour.toString()}>
                      {hour.toString().padStart(2, "0")}:00
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Annuler
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
