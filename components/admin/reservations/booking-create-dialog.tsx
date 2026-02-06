"use client"

import { useState, useEffect, useMemo, useTransition } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  Calendar as CalendarIcon,
  Clock,
  Check,
  FileText,
  Users,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { TimeSlotPicker } from "@/components/client/time-slot-picker"
import { RoomHeaders, RoomTimeline } from "@/components/client/room-planning-grid"
import {
  createBookingFromAdmin,
  getMeetingRoomsBySite,
  getRoomBookingsForDate,
  checkAvailability,
} from "@/lib/actions/bookings"
import {
  disabledDateMatcher,
  getNextBusinessDay,
  getPreviousBusinessDay,
  getBusinessDaysCentered,
  isSameDay,
  isToday as checkIsToday,
} from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { MeetingRoomResource } from "@/lib/types/database"
import type { RoomBooking } from "@/lib/actions/bookings"

type View = "planning" | "slots" | "confirm"

const VISIBLE_DAYS_COUNT = 5

interface Site {
  id: string
  name: string
}

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface BookingCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sites: Site[]
  users: User[]
}

export function BookingCreateDialog({
  open,
  onOpenChange,
  sites,
  users,
}: BookingCreateDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // View state
  const [view, setView] = useState<View>("planning")

  // Form state
  const [userId, setUserId] = useState("")
  const [siteId, setSiteId] = useState("")
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed")
  const [notes, setNotes] = useState("")

  // Calendar state
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewCenterDate, setViewCenterDate] = useState<Date>(new Date())
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Room state
  const [rooms, setRooms] = useState<MeetingRoomResource[]>([])
  const [bookings, setBookings] = useState<RoomBooking[]>([])
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomResource | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null)
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])

  // Loading states
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setView("planning")
      setUserId("")
      setSiteId("")
      setStatus("confirmed")
      setNotes("")
      setSelectedDate(new Date())
      setViewCenterDate(new Date())
      setRooms([])
      setBookings([])
      setSelectedRoom(null)
      setSelectedSlots([])
      setSelectedStartHour(null)
      setUnavailableSlots([])
      setError(null)
      setSuccess(false)
    }
  }, [open])

  // Load rooms when site changes
  useEffect(() => {
    if (!siteId) {
      setRooms([])
      return
    }
    setLoadingRooms(true)
    setRooms([])
    getMeetingRoomsBySite(siteId).then((result) => {
      setLoadingRooms(false)
      if (result.error) {
        setError(result.error)
      } else {
        setRooms(result.rooms)
      }
    })
  }, [siteId])

  // Load bookings when site or date changes
  useEffect(() => {
    if (!siteId || !selectedDate) return
    setLoadingBookings(true)
    setBookings([])
    const dateStr = format(selectedDate, "yyyy-MM-dd")
    getRoomBookingsForDate(siteId, dateStr).then((result) => {
      setLoadingBookings(false)
      if (result.error) {
        setError(result.error)
      } else {
        setBookings(result.bookings)
      }
    })
  }, [siteId, selectedDate])

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

  const selectedSite = sites.find((s) => s.id === siteId)

  // Site change handler
  const handleSiteChange = (newSiteId: string) => {
    setSiteId(newSiteId)
    setSelectedRoom(null)
    setSelectedStartHour(null)
    setSelectedSlots([])
    setView("planning")
    setError(null)
  }

  // Date change from calendar popover
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setViewCenterDate(date)
      setSelectedRoom(null)
      setSelectedStartHour(null)
      setSelectedSlots([])
      setCalendarOpen(false)
      if (view !== "planning") setView("planning")
    }
  }

  // Day click from day picker
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedRoom(null)
    setSelectedStartHour(null)
    setSelectedSlots([])
    if (view !== "planning") setView("planning")
  }

  // Slot click from planning grid
  const handleSlotClick = (room: MeetingRoomResource, hour: number) => {
    setSelectedRoom(room)
    setSelectedStartHour(hour)
    setSelectedSlots([])
    setView("slots")
    setError(null)
  }

  const handleNext = () => {
    setError(null)
    if (view === "slots" && selectedSlots.length > 0) {
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

  // Submit booking
  const handleConfirm = () => {
    if (!selectedRoom || !selectedDate || selectedSlots.length === 0 || !userId) return

    setError(null)

    const sortedSlots = [...selectedSlots].sort()
    const firstSlot = sortedSlots[0]
    const lastSlot = sortedSlots[sortedSlots.length - 1]
    const lastHour = parseInt(lastSlot.split(":")[0]) + 1

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const startDate = new Date(`${dateStr}T${firstSlot}:00`)
    const endDate = new Date(`${dateStr}T${lastHour.toString().padStart(2, "0")}:00:00`)

    startTransition(async () => {
      const result = await createBookingFromAdmin({
        userId,
        resourceId: selectedRoom.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status,
        notes: notes.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => {
          onOpenChange(false)
        }, 1500)
      }
    })
  }

  // Day picker data
  const upcomingDays = useMemo(() => {
    return getBusinessDaysCentered(viewCenterDate, VISIBLE_DAYS_COUNT)
  }, [viewCenterDate])

  const canNavigatePrev = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return upcomingDays.length > 0 && upcomingDays[0] > today
  }, [upcomingDays])

  const handlePrevDays = () => {
    if (upcomingDays.length > 0 && canNavigatePrev) {
      const firstDay = upcomingDays[0]
      const prevDay = getPreviousBusinessDay(firstDay)
      if (prevDay) setViewCenterDate(prevDay)
    }
  }

  const handleNextDays = () => {
    if (upcomingDays.length > 0) {
      const lastDay = upcomingDays[upcomingDays.length - 1]
      const nextDay = getNextBusinessDay(lastDay)
      setViewCenterDate(nextDay)
    }
  }

  // Prepare user options
  const userOptions = users.map((u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ")
    return {
      value: u.id,
      label: name
        ? `${name} (${u.email || "pas d'email"})`
        : u.email || "Utilisateur sans nom",
    }
  })

  const siteOptions = sites.map((s) => ({
    value: s.id,
    label: s.name,
  }))

  // Success screen
  if (success) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[900px] sm:rounded-[20px]">
          <VisuallyHidden>
            <DialogTitle>Nouvelle réservation</DialogTitle>
          </VisuallyHidden>
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
              <Check className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-sm font-medium text-foreground">
              La réservation a été créée avec succès !
            </p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] sm:rounded-[20px] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <VisuallyHidden>
          <DialogTitle>Nouvelle réservation</DialogTitle>
        </VisuallyHidden>
        {/* Header with user + site selectors */}
        <div className="shrink-0 space-y-4 border-b p-4 sm:p-6">
          <h2 className="font-header text-lg font-bold uppercase tracking-tight">
            Nouvelle réservation
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* User selection */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Utilisateur *</Label>
              <SearchableSelect
                options={userOptions}
                value={userId}
                onValueChange={setUserId}
                placeholder="Sélectionner un utilisateur"
                searchPlaceholder="Rechercher..."
                emptyMessage="Aucun utilisateur trouvé"
                triggerClassName="w-full rounded-[12px]"
              />
            </div>

            {/* Site selection */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Site *</Label>
              <SearchableSelect
                options={siteOptions}
                value={siteId}
                onValueChange={handleSiteChange}
                placeholder="Sélectionner un site"
                searchPlaceholder="Rechercher..."
                emptyMessage="Aucun site trouvé"
                triggerClassName="w-full rounded-[12px]"
              />
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 p-4 sm:p-6 pt-3 sm:pt-3">
          {!siteId ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-3 text-sm text-muted-foreground">
                Sélectionnez un utilisateur et un site pour commencer
              </p>
            </div>
          ) : (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* Day picker - always visible in planning view */}
              {view === "planning" && (
                <div className="shrink-0">
                  <div className="flex items-center justify-center gap-1">
                    {/* Previous arrow */}
                    <button
                      type="button"
                      onClick={handlePrevDays}
                      disabled={!canNavigatePrev}
                      className={cn(
                        "flex h-[48px] w-8 shrink-0 items-center justify-center rounded-[12px] transition-colors",
                        canNavigatePrev
                          ? "bg-foreground/5 hover:bg-foreground/10"
                          : "bg-foreground/5 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Day buttons */}
                    <div className="flex gap-1">
                      {upcomingDays.map((day) => {
                        const isSelected = isSameDay(day, selectedDate)
                        const dayIsToday = checkIsToday(day)
                        return (
                          <button
                            key={day.toISOString()}
                            type="button"
                            onClick={() => handleDayClick(day)}
                            className={cn(
                              "flex flex-col items-center justify-center min-w-[44px] h-[48px] rounded-[12px] transition-all",
                              isSelected
                                ? "bg-[#1B1918] text-white"
                                : "bg-foreground/5 hover:bg-foreground/10 text-foreground"
                            )}
                          >
                            <span
                              className={cn(
                                "text-[9px] font-medium uppercase tracking-wide",
                                isSelected
                                  ? "text-white/80"
                                  : "text-muted-foreground"
                              )}
                            >
                              {format(day, "EEE", { locale: fr })}
                            </span>
                            <span
                              className={cn(
                                "text-base font-semibold leading-tight",
                                isSelected ? "text-white" : "text-foreground"
                              )}
                            >
                              {format(day, "d")}
                            </span>
                            <span
                              className={cn(
                                "text-[8px]",
                                isSelected
                                  ? "text-white/70"
                                  : "text-muted-foreground/70"
                              )}
                            >
                              {dayIsToday
                                ? "Auj."
                                : format(day, "MMM", { locale: fr })}
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Next arrow */}
                    <button
                      type="button"
                      onClick={handleNextDays}
                      className="flex h-[48px] w-8 shrink-0 items-center justify-center rounded-[12px] bg-foreground/5 hover:bg-foreground/10 transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>

                    {/* Calendar button */}
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-[48px] w-8 shrink-0 rounded-[12px] border-0 bg-foreground/5 hover:bg-foreground/10"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={selectedDate}
                          onSelect={handleDateChange}
                          disabled={disabledDateMatcher}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive shrink-0">
                  {error}
                </div>
              )}

              {/* Planning Grid */}
              {view === "planning" && (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Room headers */}
                  {!loadingRooms && !loadingBookings && rooms.length > 0 && (
                    <div className="shrink-0">
                      <RoomHeaders rooms={rooms} />
                    </div>
                  )}

                  {/* Scrollable timeline */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {loadingRooms || loadingBookings ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : rooms.length === 0 ? (
                      <p className="py-8 text-center text-sm text-muted-foreground">
                        Aucune salle disponible sur ce site
                      </p>
                    ) : (
                      <RoomTimeline
                        rooms={rooms}
                        bookings={bookings}
                        onSlotClick={handleSlotClick}
                        selectedDate={selectedDate}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Slots view */}
              {view === "slots" && selectedRoom && (
                <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
                  <div className="rounded-[16px] p-4 bg-foreground/5">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium truncate">
                          {selectedRoom.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {selectedRoom.capacity && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {selectedRoom.capacity} pers.
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {format(selectedDate, "EEEE d MMMM", { locale: fr })}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground mb-2 block">
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
                </div>
              )}

              {/* Confirm view */}
              {view === "confirm" && selectedRoom && selectedDate && (
                <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
                  <div className="rounded-[16px] bg-foreground/5 p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Site</p>
                        <p className="text-sm font-medium">{selectedSite?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Date</p>
                        <p className="text-sm font-medium capitalize">
                          {format(selectedDate, "EEEE d MMMM yyyy", {
                            locale: fr,
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Horaire</p>
                        <p className="text-sm font-medium">
                          {selectedSlots.sort()[0].replace(":00", "h")} -{" "}
                          {parseInt(
                            selectedSlots.sort()[selectedSlots.length - 1].split(
                              ":"
                            )[0]
                          ) + 1}
                          h ({selectedSlots.length} heure
                          {selectedSlots.length > 1 ? "s" : ""})
                        </p>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <p className="text-sm font-medium">{selectedRoom.name}</p>
                      {selectedRoom.capacity && (
                        <p className="text-xs text-muted-foreground">
                          Capacité: {selectedRoom.capacity} personnes
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Admin options */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">Statut</Label>
                      <Select
                        value={status}
                        onValueChange={(v) =>
                          setStatus(v as "confirmed" | "pending")
                        }
                        disabled={isPending}
                      >
                        <SelectTrigger className="rounded-[12px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="confirmed">Confirmée</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Notes (optionnel)
                      </Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        disabled={isPending}
                        placeholder="Ajouter des notes..."
                        className="min-h-[60px] rounded-[12px]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              {view !== "planning" && (
                <div className="flex justify-end gap-3 pt-3 shrink-0 border-t border-foreground/5">
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    className="rounded-full"
                    disabled={isPending}
                  >
                    Retour
                  </Button>
                  {view === "confirm" ? (
                    <Button
                      onClick={handleConfirm}
                      disabled={isPending || !userId}
                      className="rounded-full bg-[#1B1918] hover:bg-[#1B1918]/90"
                    >
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Confirmer la réservation
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={selectedSlots.length === 0}
                      className="rounded-full bg-[#1B1918] hover:bg-[#1B1918]/90"
                    >
                      Continuer
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
