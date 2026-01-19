"use client"

import { useState, useEffect } from "react"
import { format, addDays, subDays } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Coins,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { RoomPlanningGrid } from "./room-planning-grid"
import { TimeSlotPicker } from "./time-slot-picker"
import {
  getMeetingRoomsBySite,
  getRoomBookingsForDate,
  checkAvailability,
  createMeetingRoomBooking,
} from "@/lib/actions/bookings"
import { useClientLayout } from "./client-layout-provider"
import type { MeetingRoomResource } from "@/lib/types/database"
import type { RoomBooking } from "@/lib/actions/bookings"

type View = "planning" | "slots" | "confirm"

export function RoomBookingPage() {
  const { user, credits, selectedSiteId, selectedSite } = useClientLayout()
  const remainingCredits = credits?.remaining || 0

  const [view, setView] = useState<View>("planning")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomResource | null>(null)
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  const [rooms, setRooms] = useState<MeetingRoomResource[]>([])
  const [bookings, setBookings] = useState<RoomBooking[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Load rooms when site changes
  useEffect(() => {
    if (selectedSiteId) {
      setLoadingRooms(true)
      setRooms([])
      getMeetingRoomsBySite(selectedSiteId).then((result) => {
        setLoadingRooms(false)
        if (result.error) {
          setError(result.error)
        } else {
          setRooms(result.rooms)
        }
      })
    }
  }, [selectedSiteId])

  // Load bookings when site or date changes
  useEffect(() => {
    if (selectedSiteId && selectedDate) {
      setLoadingBookings(true)
      setBookings([])
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      getRoomBookingsForDate(selectedSiteId, dateStr).then((result) => {
        setLoadingBookings(false)
        if (result.error) {
          setError(result.error)
        } else {
          setBookings(result.bookings)
        }
      })
    }
  }, [selectedSiteId, selectedDate])

  // Load availability when room and date change (for slots view)
  useEffect(() => {
    if (selectedRoom && selectedDate && view === "slots") {
      setLoadingSlots(true)
      setUnavailableSlots([])
      const dateStr = format(selectedDate, "yyyy-MM-dd")
      checkAvailability(selectedRoom.id, dateStr).then((result) => {
        setLoadingSlots(false)
        if (result.error) {
          setError(result.error)
        } else {
          // Convert bookings to unavailable slots
          const unavailable: string[] = []
          result.bookings.forEach((booking) => {
            const startHour = new Date(booking.start_date).getHours()
            const endHour = new Date(booking.end_date).getHours()
            for (let h = startHour; h < endHour; h++) {
              unavailable.push(`${h.toString().padStart(2, "0")}:00`)
            }
          })
          setUnavailableSlots(unavailable)
        }
      })
    }
  }, [selectedRoom, selectedDate, view])

  // Pre-select the clicked slot when entering slots view
  useEffect(() => {
    if (view === "slots" && selectedStartHour !== null) {
      setSelectedSlots([`${selectedStartHour.toString().padStart(2, "0")}:00`])
    }
  }, [view, selectedStartHour])

  const creditsNeeded = selectedSlots.length * (selectedRoom?.hourly_credit_rate || 1)
  const hasEnoughCredits = remainingCredits >= creditsNeeded

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setSelectedRoom(null)
      setSelectedStartHour(null)
      setSelectedSlots([])
      setCalendarOpen(false)
      if (view !== "planning") setView("planning")
    }
  }

  // Handle slot click from planning grid
  const handleSlotClick = (room: MeetingRoomResource, hour: number) => {
    setSelectedRoom(room)
    setSelectedStartHour(hour)
    setSelectedSlots([])
    setView("slots")
    setError(null)
  }

  const handleNext = () => {
    setError(null)
    if (view === "slots" && selectedDate && selectedSlots.length > 0) {
      setView("confirm")
    }
  }

  const handleBack = () => {
    setError(null)
    if (view === "slots") {
      setView("planning")
      setSelectedRoom(null)
      setSelectedStartHour(null)
      setSelectedSlots([])
    } else if (view === "confirm") {
      setView("slots")
    }
  }

  const handleCancel = () => {
    setView("planning")
    setSelectedRoom(null)
    setSelectedStartHour(null)
    setSelectedSlots([])
    setError(null)
  }

  const handleConfirm = async () => {
    if (!selectedRoom || !selectedDate || selectedSlots.length === 0) return

    setSubmitting(true)
    setError(null)

    // Sort slots and get first/last
    const sortedSlots = [...selectedSlots].sort()
    const firstSlot = sortedSlots[0]
    const lastSlot = sortedSlots[sortedSlots.length - 1]
    const lastHour = parseInt(lastSlot.split(":")[0]) + 1

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const startDate = `${dateStr}T${firstSlot}:00Z`
    const endDate = `${dateStr}T${lastHour.toString().padStart(2, "0")}:00:00Z`

    const result = await createMeetingRoomBooking({
      userId: user.id,
      resourceId: selectedRoom.id,
      startDate,
      endDate,
      creditsToUse: creditsNeeded,
      companyId: user.company_id || "",
    })

    setSubmitting(false)
    setConfirmOpen(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        handleCancel()
        // Reload bookings
        if (selectedSiteId) {
          setLoadingBookings(true)
          const dateStr = format(selectedDate, "yyyy-MM-dd")
          getRoomBookingsForDate(selectedSiteId, dateStr).then((r) => {
            setLoadingBookings(false)
            if (!r.error) setBookings(r.bookings)
          })
        }
      }, 2000)
    }
  }

  const canProceed = () => {
    if (view === "slots") return !!selectedDate && selectedSlots.length > 0 && hasEnoughCredits
    return false
  }

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  if (!selectedSiteId) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <MapPin className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 type-body text-muted-foreground">
          Sélectionnez un site dans le menu pour voir les salles disponibles
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="type-body font-medium">{selectedSite?.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate(subDays(selectedDate, 1))}
            disabled={isToday}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[140px]">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {isToday ? "Aujourd'hui" : format(selectedDate, "dd/MM/yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-100 p-4 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-green-500">
            <Check className="h-5 w-5 text-white" />
          </div>
          <p className="type-body font-medium text-green-800">
            Votre salle a été réservée avec succès !
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Planning Grid */}
        <div className={`rounded-lg bg-card p-4 sm:p-6 ${view === "planning" ? "lg:col-span-3" : "lg:col-span-2"}`}>
          {loadingRooms || loadingBookings ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : rooms.length === 0 ? (
            <p className="py-8 text-center type-body text-muted-foreground">
              Aucune salle disponible sur ce site
            </p>
          ) : (
            <RoomPlanningGrid
              rooms={rooms}
              bookings={bookings}
              onSlotClick={handleSlotClick}
              remainingCredits={remainingCredits}
            />
          )}
        </div>

        {/* Side panel for slots/confirm */}
        {view !== "planning" && selectedRoom && (
          <div className="rounded-lg bg-card p-4 sm:p-6 lg:col-span-1">
            {/* Panel header */}
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="icon" onClick={handleBack} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="type-body font-semibold">
                {view === "slots" ? "Choisir les créneaux" : "Confirmer"}
              </h3>
              <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Slots view */}
            {view === "slots" && (
              <div className="space-y-4">
                {/* Room summary */}
                <div className="rounded-lg border p-3 bg-muted/50">
                  <p className="type-body font-medium truncate">{selectedRoom.name}</p>
                  <div className="flex items-center gap-2 type-body-sm text-muted-foreground mt-1">
                    {selectedRoom.capacity && <span>{selectedRoom.capacity} pers.</span>}
                    {selectedRoom.hourly_credit_rate && (
                      <span className="flex items-center gap-1">
                        <Coins className="h-3 w-3" />
                        {selectedRoom.hourly_credit_rate} crédit/h
                      </span>
                    )}
                  </div>
                  <p className="type-body-sm text-muted-foreground mt-1">
                    {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                  </p>
                </div>

                {/* Time slot picker */}
                <div>
                  <label className="type-body-sm font-medium text-foreground mb-2 block">
                    Sélectionnez vos créneaux
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-4">
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

                {/* Credits summary */}
                {selectedSlots.length > 0 && (
                  <div
                    className={`rounded-lg p-3 ${!hasEnoughCredits ? "bg-destructive/10 border border-destructive/20" : "bg-muted"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="type-body-sm text-muted-foreground">Coût total</span>
                      <div className="flex items-center gap-1">
                        <Coins
                          className={`h-4 w-4 ${!hasEnoughCredits ? "text-destructive" : "text-primary"}`}
                        />
                        <span
                          className={`type-body font-semibold ${!hasEnoughCredits ? "text-destructive" : ""}`}
                        >
                          {creditsNeeded} crédits
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="type-body-sm text-muted-foreground">Disponibles</span>
                      <span className="type-body-sm">{remainingCredits}</span>
                    </div>
                    {!hasEnoughCredits && (
                      <p className="mt-2 text-sm text-destructive font-medium">
                        Crédits insuffisants
                      </p>
                    )}
                  </div>
                )}

                {/* Action button */}
                <Button onClick={handleNext} disabled={!canProceed()} className="w-full">
                  Continuer
                </Button>
              </div>
            )}

            {/* Confirm view */}
            {view === "confirm" && (
              <div className="space-y-4">
                <div className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="type-body-sm text-muted-foreground">Site</p>
                      <p className="type-body font-medium">{selectedSite?.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="type-body-sm text-muted-foreground">Date</p>
                      <p className="type-body font-medium capitalize">
                        {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="type-body-sm text-muted-foreground">Horaire</p>
                      <p className="type-body font-medium">
                        {selectedSlots.sort()[0].replace(":00", "h")} -{" "}
                        {parseInt(selectedSlots.sort()[selectedSlots.length - 1].split(":")[0]) + 1}h
                      </p>
                    </div>
                  </div>
                  <div className="border-t pt-3">
                    <p className="type-body font-medium">{selectedRoom.name}</p>
                    {selectedRoom.capacity && (
                      <p className="type-body-sm text-muted-foreground">
                        Capacité: {selectedRoom.capacity} personnes
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                  <div className="flex items-center justify-between">
                    <span className="type-body font-medium">Total à débiter</span>
                    <div className="flex items-center gap-1">
                      <Coins className="h-5 w-5 text-primary" />
                      <span className="type-h4 text-primary">{creditsNeeded} crédits</span>
                    </div>
                  </div>
                  <p className="mt-1 type-body-sm text-muted-foreground">
                    Reste: {remainingCredits - creditsNeeded} crédits
                  </p>
                </div>

                <Button onClick={() => setConfirmOpen(true)} className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer la réservation
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la réservation</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment réserver cette salle ? {creditsNeeded} crédit
              {creditsNeeded > 1 ? "s" : ""} seront débités de votre compte.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
