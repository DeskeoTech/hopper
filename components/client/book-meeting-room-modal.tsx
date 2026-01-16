"use client"

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, Loader2, MapPin, Calendar as CalendarIcon, Clock, Coins, Check } from "lucide-react"
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
import { MeetingRoomCard } from "./meeting-room-card"
import { TimeSlotPicker } from "./time-slot-picker"
import { getMeetingRoomsBySite, checkAvailability, createMeetingRoomBooking } from "@/lib/actions/bookings"
import type { MeetingRoomResource } from "@/lib/types/database"

type Step = "site" | "room" | "datetime" | "confirm"

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
  const [step, setStep] = useState<Step>("site")
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(mainSiteId)
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomResource | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])

  const [rooms, setRooms] = useState<MeetingRoomResource[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [success, setSuccess] = useState(false)

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setStep("site")
      setSelectedSiteId(mainSiteId)
      setSelectedRoom(null)
      setSelectedDate(undefined)
      setSelectedSlots([])
      setRooms([])
      setUnavailableSlots([])
      setError(null)
      setSuccess(false)
    }
  }, [open, mainSiteId])

  // Load rooms when site changes
  useEffect(() => {
    if (selectedSiteId && step === "room") {
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
  }, [selectedSiteId, step])

  // Load availability when room and date change
  useEffect(() => {
    if (selectedRoom && selectedDate && step === "datetime") {
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
  }, [selectedRoom, selectedDate, step])

  const selectedSite = sites.find((s) => s.id === selectedSiteId)
  const creditsNeeded = selectedSlots.length * (selectedRoom?.hourly_credit_rate || 1)
  const hasEnoughCredits = remainingCredits >= creditsNeeded

  const handleNext = () => {
    setError(null)
    if (step === "site" && selectedSiteId) {
      setStep("room")
    } else if (step === "room" && selectedRoom) {
      setStep("datetime")
    } else if (step === "datetime" && selectedDate && selectedSlots.length > 0) {
      setStep("confirm")
    }
  }

  const handleBack = () => {
    setError(null)
    if (step === "room") {
      setStep("site")
      setSelectedRoom(null)
    } else if (step === "datetime") {
      setStep("room")
      setSelectedDate(undefined)
      setSelectedSlots([])
    } else if (step === "confirm") {
      setStep("datetime")
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
    if (step === "site") return !!selectedSiteId
    if (step === "room") return !!selectedRoom
    if (step === "datetime") return !!selectedDate && selectedSlots.length > 0 && hasEnoughCredits
    return false
  }

  const getStepTitle = () => {
    if (success) return "Réservation confirmée"
    switch (step) {
      case "site":
        return "Choisir un site"
      case "room":
        return "Choisir une salle"
      case "datetime":
        return "Choisir date et heure"
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2">
              {step !== "site" && !success && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="h-8 w-8"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              <DialogTitle>{getStepTitle()}</DialogTitle>
            </div>
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
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              {/* Step: Site Selection */}
              {step === "site" && (
                <div className="space-y-4">
                  <SearchableSelect
                    options={sortedSites.map((s) => ({
                      value: s.id,
                      label: s.id === mainSiteId ? `${s.name} (Site principal)` : s.name,
                    }))}
                    value={selectedSiteId || ""}
                    onValueChange={setSelectedSiteId}
                    placeholder="Sélectionner un site"
                    searchPlaceholder="Rechercher un site..."
                  />
                </div>
              )}

              {/* Step: Room Selection */}
              {step === "room" && (
                <div className="space-y-3">
                  {loadingRooms ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : rooms.length === 0 ? (
                    <p className="py-8 text-center type-body text-muted-foreground">
                      Aucune salle disponible sur ce site
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {rooms.map((room) => (
                        <MeetingRoomCard
                          key={room.id}
                          room={room}
                          selected={selectedRoom?.id === room.id}
                          onSelect={() => setSelectedRoom(room)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Date & Time Selection */}
              {step === "datetime" && (
                <div className="space-y-4">
                  <div>
                    <label className="type-body-sm font-medium text-foreground mb-2 block">
                      Date
                    </label>
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        setSelectedDate(date)
                        setSelectedSlots([])
                      }}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      className="rounded-lg border"
                    />
                  </div>

                  {selectedDate && (
                    <div>
                      <label className="type-body-sm font-medium text-foreground mb-2 block">
                        Créneaux horaires
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
                  )}

                  {selectedSlots.length > 0 && (
                    <div className="rounded-lg bg-muted p-3">
                      <div className="flex items-center justify-between">
                        <span className="type-body-sm text-muted-foreground">Coût total</span>
                        <div className="flex items-center gap-1">
                          <Coins className="h-4 w-4 text-primary" />
                          <span className="type-body font-semibold">{creditsNeeded} crédits</span>
                        </div>
                      </div>
                      {!hasEnoughCredits && (
                        <p className="mt-2 text-sm text-destructive">
                          Crédits insuffisants ({remainingCredits} disponibles)
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Step: Confirmation */}
              {step === "confirm" && selectedRoom && selectedDate && (
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
                          {selectedSlots.sort()[0].replace(":00", "h")} - {(parseInt(selectedSlots.sort()[selectedSlots.length - 1].split(":")[0]) + 1)}h
                          ({selectedSlots.length} heure{selectedSlots.length > 1 ? "s" : ""})
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
                      Il vous restera {remainingCredits - creditsNeeded} crédits après cette réservation
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              {!success && (
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    Annuler
                  </Button>
                  {step === "confirm" ? (
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
              Voulez-vous vraiment réserver cette salle ? {creditsNeeded} crédit{creditsNeeded > 1 ? "s" : ""} seront débités de votre compte.
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
