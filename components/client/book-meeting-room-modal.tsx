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
  Building2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
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
import { SearchableSelect } from "@/components/ui/searchable-select"
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
import type { MeetingRoomResource } from "@/lib/types/database"
import type { RoomBooking } from "@/lib/actions/bookings"

type View = "planning" | "slots" | "confirm"

interface BookMeetingRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  companyId: string
  mainSiteId: string | null
  remainingCredits: number
  sites: Array<{ id: string; name: string }>
}

export function BookMeetingRoomModal({
  open,
  onOpenChange,
  userId,
  companyId,
  mainSiteId,
  remainingCredits,
  sites,
}: BookMeetingRoomModalProps) {
  const [view, setView] = useState<View>("planning")
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(mainSiteId)
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

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setView("planning")
      setSelectedSiteId(mainSiteId)
      setSelectedDate(new Date())
      setSelectedRoom(null)
      setSelectedStartHour(null)
      setSelectedSlots([])
      setRooms([])
      setBookings([])
      setUnavailableSlots([])
      setError(null)
      setSuccess(false)
    }
  }, [open, mainSiteId])

  // Load rooms when modal opens with a site selected, or when site changes
  useEffect(() => {
    if (open && selectedSiteId) {
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
  }, [open, selectedSiteId])

  // Load bookings when site or date changes
  useEffect(() => {
    if (open && selectedSiteId && selectedDate) {
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
  }, [open, selectedSiteId, selectedDate])

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

  const selectedSite = sites.find((s) => s.id === selectedSiteId)
  const creditsNeeded = selectedSlots.length * (selectedRoom?.hourly_credit_rate || 1)
  const hasEnoughCredits = remainingCredits >= creditsNeeded

  // Handle site change - reset selection
  const handleSiteChange = (newSiteId: string) => {
    setSelectedSiteId(newSiteId)
    setSelectedRoom(null)
    setSelectedStartHour(null)
    setSelectedSlots([])
    setView("planning")
    setError(null)
  }

  // Handle date change
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setSelectedRoom(null)
      setSelectedStartHour(null)
      setSelectedSlots([])
      setCalendarOpen(false)
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
      userId,
      resourceId: selectedRoom.id,
      startDate,
      endDate,
      creditsToUse: creditsNeeded,
      companyId,
    })

    setSubmitting(false)
    setConfirmOpen(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
      }, 2000)
    }
  }

  const canProceed = () => {
    if (view === "slots") return !!selectedDate && selectedSlots.length > 0 && hasEnoughCredits
    return false
  }

  const getViewTitle = () => {
    if (success) return "Réservation confirmée"
    switch (view) {
      case "planning":
        return "Réserver une salle"
      case "slots":
        return "Choisir les créneaux"
      case "confirm":
        return "Confirmer la réservation"
    }
  }

  // Sort sites with main site first
  const sortedSites = [...sites].sort((a, b) => {
    if (a.id === mainSiteId) return -1
    if (b.id === mainSiteId) return 1
    return a.name.localeCompare(b.name)
  })

  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="space-y-3 shrink-0">
            {/* Title row with back button */}
            <div className="flex items-center gap-2">
              {view !== "planning" && !success && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle>{getViewTitle()}</DialogTitle>
            </div>

            {/* Site switcher and date picker - visible on planning view */}
            {!success && view === "planning" && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {/* Site switcher */}
                <div className="flex items-center gap-2 flex-1">
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <SearchableSelect
                    options={sortedSites.map((s) => ({
                      value: s.id,
                      label: s.id === mainSiteId ? `${s.name} (Site principal)` : s.name,
                    }))}
                    value={selectedSiteId || ""}
                    onValueChange={handleSiteChange}
                    placeholder="Sélectionner un site"
                    searchPlaceholder="Rechercher un site..."
                    triggerClassName="flex-1 max-w-[250px]"
                  />
                </div>

                {/* Date navigation */}
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
            )}
          </DialogHeader>

          {success ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <p className="type-body text-foreground">
                Votre salle a été réservée avec succès !
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex flex-col">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive mb-4 shrink-0">
                  {error}
                </div>
              )}

              {/* View: Planning Grid */}
              {view === "planning" && (
                <div className="flex-1 overflow-auto">
                  {!selectedSiteId ? (
                    <div className="py-8 text-center">
                      <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-4 type-body text-muted-foreground">
                        Sélectionnez un site pour voir les salles disponibles
                      </p>
                    </div>
                  ) : loadingRooms || loadingBookings ? (
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
              )}

              {/* View: Time Slot Selection */}
              {view === "slots" && selectedRoom && (
                <div className="space-y-4 overflow-auto flex-1">
                  {/* Compact room summary */}
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="type-body font-medium truncate">{selectedRoom.name}</p>
                        <div className="flex items-center gap-2 type-body-sm text-muted-foreground">
                          {selectedRoom.capacity && <span>{selectedRoom.capacity} pers.</span>}
                          {selectedRoom.hourly_credit_rate && (
                            <span className="flex items-center gap-1">
                              <Coins className="h-3 w-3" />
                              {selectedRoom.hourly_credit_rate} crédit/h
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="type-body-sm text-muted-foreground">
                          {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>

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
                        <span className="type-body-sm text-muted-foreground">
                          Crédits disponibles
                        </span>
                        <span className="type-body-sm">{remainingCredits}</span>
                      </div>
                      {!hasEnoughCredits && (
                        <p className="mt-2 text-sm text-destructive font-medium">
                          Vous n'avez pas assez de crédits pour cette réservation
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* View: Confirmation */}
              {view === "confirm" && selectedRoom && selectedDate && (
                <div className="space-y-4 overflow-auto flex-1">
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
                          {parseInt(selectedSlots.sort()[selectedSlots.length - 1].split(":")[0]) + 1}
                          h ({selectedSlots.length} heure{selectedSlots.length > 1 ? "s" : ""})
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
                      Il vous restera {remainingCredits - creditsNeeded} crédits après cette
                      réservation
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              {!success && view !== "planning" && (
                <div className="flex justify-end gap-2 pt-4 shrink-0 border-t mt-4">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  {view === "confirm" ? (
                    <Button onClick={() => setConfirmOpen(true)} disabled={submitting}>
                      {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Confirmer la réservation
                    </Button>
                  ) : (
                    <Button onClick={handleNext} disabled={!canProceed()}>
                      Continuer
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

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
    </>
  )
}
