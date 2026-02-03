"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
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
  Users,
  ExternalLink,
  X,
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
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
import { disabledDateMatcher, getNextBusinessDay, getNextBusinessDays, getPreviousBusinessDay, isSameDay, isToday } from "@/lib/dates"
import { cn } from "@/lib/utils"
import type { MeetingRoomResource } from "@/lib/types/database"
import type { RoomBooking } from "@/lib/actions/bookings"

type View = "planning" | "slots" | "confirm"

interface RoomBookingContentProps {
  userId: string
  companyId: string
  mainSiteId: string | null
  remainingCredits: number
  allocatedCredits?: number
  sites: Array<{ id: string; name: string }>
  userEmail?: string
  hasActivePlan?: boolean
  // For modal usage
  isModal?: boolean
  onClose?: () => void
  onSuccess?: () => void
}

export function RoomBookingContent({
  userId,
  companyId,
  mainSiteId,
  remainingCredits,
  allocatedCredits,
  sites,
  userEmail = "",
  hasActivePlan = true,
  isModal = false,
  onClose,
  onSuccess,
}: RoomBookingContentProps) {
  const [view, setView] = useState<View>("planning")
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(mainSiteId)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomResource | null>(null)
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<string[]>([])
  const [capacityFilter, setCapacityFilter] = useState<number | null>(null)

  const [rooms, setRooms] = useState<MeetingRoomResource[]>([])
  const [bookings, setBookings] = useState<RoomBooking[]>([])
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [loadingBookings, setLoadingBookings] = useState(false)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)

  // Filter rooms by capacity
  const filteredRooms = useMemo(() => {
    if (capacityFilter === null) return rooms
    return rooms.filter((room) => room.capacity && room.capacity >= capacityFilter)
  }, [rooms, capacityFilter])

  // Get unique capacity values for filter options
  const capacityOptions = useMemo(() => {
    const capacities = rooms
      .map((r) => r.capacity)
      .filter((c): c is number => c !== null)
    return [...new Set(capacities)].sort((a, b) => a - b)
  }, [rooms])

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
    setCapacityFilter(null)
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

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => {
        if (isModal) {
          onSuccess?.()
          onClose?.()
        } else {
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
        }
      }, 2000)
    }
  }

  const canProceed = () => {
    if (view === "slots") return !!selectedDate && selectedSlots.length > 0 && hasEnoughCredits
    return false
  }

  // Sort sites with main site first
  const sortedSites = [...sites].sort((a, b) => {
    if (a.id === mainSiteId) return -1
    if (b.id === mainSiteId) return 1
    return a.name.localeCompare(b.name)
  })

  const isTodaySelected = isToday(selectedDate)
  const previousBusinessDay = getPreviousBusinessDay(selectedDate)

  // Get next 10 business days for quick selection (modal only)
  const upcomingDays = useMemo(() => getNextBusinessDays(10), [])

  // Render credits insufficient message with links
  const renderCreditsError = () => (
    <div className="mt-3 space-y-2">
      {hasActivePlan ? (
        <>
          <p className="text-sm text-destructive font-medium">
            Vous n'avez pas assez de crédits pour cette réservation
          </p>
          <Link
            href="/boutique?tab=credits"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            onClick={onClose}
          >
            Acheter des crédits supplémentaires
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-destructive font-medium">
            Votre pass Hopper Coworking a expiré
          </p>
          <a
            href={`https://hopper-coworking.com/?email_user=${encodeURIComponent(userEmail)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Souscrire un nouveau pass
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </>
      )}
    </div>
  )

  // Success screen
  if (success) {
    return (
      <div className="py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
          <Check className="h-8 w-8 text-green-500" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Votre salle a été réservée avec succès !
        </p>
      </div>
    )
  }

  // No site selected
  if (!selectedSiteId) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Building2 className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Sélectionnez un site pour voir les salles disponibles
        </p>
        {sites.length > 0 && (
          <div className="mt-4 w-full max-w-[250px]">
            <SearchableSelect
              options={sortedSites.map((s) => ({
                value: s.id,
                label: s.name,
              }))}
              value=""
              onValueChange={handleSiteChange}
              placeholder="Sélectionner un site"
              searchPlaceholder="Rechercher un site..."
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={isModal ? "flex flex-col h-full gap-5" : "space-y-6"}>
      {/* Header controls - always visible in planning view */}
      {view === "planning" && (
        <div className={`space-y-3 ${isModal ? "shrink-0" : ""}`}>
          {/* Site selector (modal only - above date row) */}
          {isModal && (
            <div className="flex items-center gap-2 w-full">
              <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
              <SearchableSelect
                options={sortedSites.map((s) => ({
                  value: s.id,
                  label: s.name,
                }))}
                value={selectedSiteId || ""}
                onValueChange={handleSiteChange}
                placeholder="Sélectionner un site"
                searchPlaceholder="Rechercher un site..."
                triggerClassName="flex-1"
              />
            </div>
          )}

          {/* Date row */}
          <div className={`flex flex-col gap-3 sm:flex-row sm:items-center ${isModal ? "sm:justify-center" : "sm:justify-between"}`}>

            {/* Date navigation - different for modal vs page */}
            {isModal ? (
              // Modal: horizontal scrollable day picker
              <div className="flex items-center gap-2 w-full justify-center">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {upcomingDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate)
                    const dayIsToday = isToday(day)
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDateChange(day)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[52px] h-[58px] rounded-[16px] transition-all",
                          isSelected
                            ? "bg-[#1B1918] text-white "
                            : "bg-foreground/5 hover:bg-foreground/10 text-foreground"
                        )}
                      >
                        <span className={cn(
                          "text-[10px] font-medium uppercase tracking-wide",
                          isSelected ? "text-white/80" : "text-muted-foreground"
                        )}>
                          {format(day, "EEE", { locale: fr })}
                        </span>
                        <span className={cn(
                          "text-lg font-semibold leading-tight",
                          isSelected ? "text-white" : "text-foreground"
                        )}>
                          {format(day, "d")}
                        </span>
                        <span className={cn(
                          "text-[9px]",
                          isSelected ? "text-white/70" : "text-muted-foreground/70"
                        )}>
                          {dayIsToday ? "Auj." : format(day, "MMM", { locale: fr })}
                        </span>
                      </button>
                    )
                  })}
                </div>
                {/* Calendar button for other dates */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-[58px] w-10 shrink-0 rounded-[16px] border-0 bg-foreground/5 hover:bg-foreground/10"
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
            ) : (
              // Page: classic navigation with arrows
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
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
                    <Button variant="outline" className="min-w-[140px]">
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      {isTodaySelected ? "Aujourd'hui" : format(selectedDate, "dd/MM/yyyy")}
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
                  className="h-8 w-8"
                  onClick={() => setSelectedDate(getNextBusinessDay(selectedDate))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Credits indicator (page only) */}
          {!isModal && (
            <div className="flex items-center justify-between rounded-[16px] border bg-card p-3 sm:p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Coins className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="type-body-sm text-muted-foreground">Mes crédits disponibles</p>
                  <p className="type-h4 text-foreground">
                    {remainingCredits} crédit{remainingCredits > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {allocatedCredits && allocatedCredits > 0 && (
                <div className="hidden sm:block">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${Math.round((remainingCredits / allocatedCredits) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 type-body-sm text-muted-foreground text-right">
                    sur {allocatedCredits}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Warning banner when user can't book (page only) */}
          {!isModal && (!hasActivePlan || remainingCredits === 0) && (
            <div className="rounded-[16px] border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
                  <Coins className="h-4 w-4 text-amber-600" />
                </div>
                <div className="flex-1">
                  {!hasActivePlan ? (
                    <>
                      <p className="font-medium text-amber-800">
                        Votre pass Hopper a expiré
                      </p>
                      <p className="mt-1 text-sm text-amber-700">
                        Vous ne pouvez pas réserver de salle de réunion. Souscrivez un nouveau pass pour accéder aux réservations.
                      </p>
                      <a
                        href={`https://hopper-coworking.com/?email_user=${encodeURIComponent(userEmail)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                      >
                        Souscrire un pass
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-amber-800">
                        Vous n&apos;avez plus de crédits
                      </p>
                      <p className="mt-1 text-sm text-amber-700">
                        Votre solde de crédits est à 0. Achetez des crédits supplémentaires pour réserver une salle de réunion.
                      </p>
                      <Link
                        href="/boutique?tab=credits"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                      >
                        Acheter des crédits
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive shrink-0">
          {error}
        </div>
      )}

      {/* Main content */}
      {isModal ? (
        // Modal layout
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Warning banner for modal when user has no credits (pass expired is shown in modal header) */}
          {view === "planning" && hasActivePlan && remainingCredits === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-3 shrink-0">
              <div className="flex items-start gap-2">
                <Coins className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    Vous n&apos;avez plus de crédits
                  </p>
                  <Link
                    href="/boutique?tab=credits"
                    onClick={onClose}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
                  >
                    Acheter des crédits
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Planning Grid */}
          {view === "planning" && (
            <div className="flex-1 overflow-auto flex flex-col">
              <div className="flex-1">
                {loadingRooms || loadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <p className="py-8 text-center type-body text-muted-foreground">
                    {rooms.length === 0
                      ? "Aucune salle disponible sur ce site"
                      : "Aucune salle ne correspond au filtre de capacité"}
                  </p>
                ) : (
                  <RoomPlanningGrid
                    rooms={filteredRooms}
                    bookings={bookings}
                    onSlotClick={handleSlotClick}
                    remainingCredits={remainingCredits}
                    selectedDate={selectedDate}
                  />
                )}
              </div>

              {/* Capacity filter - below calendar */}
              {capacityOptions.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-3 mt-3 border-t shrink-0">
                  <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Capacité</span>
                  <div className="flex flex-wrap gap-1">
                    <Button
                      variant={capacityFilter === null ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setCapacityFilter(null)}
                    >
                      Toutes
                    </Button>
                    {capacityOptions.map((cap) => (
                      <Button
                        key={cap}
                        variant={capacityFilter === cap ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => setCapacityFilter(cap)}
                      >
                        {cap}+
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Slots view */}
          {view === "slots" && selectedRoom && (
            <div className="space-y-4 overflow-auto flex-1">
              <div className="rounded-[16px] p-4 bg-foreground/5">
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

              {/* Warning when user has no credits */}
              {remainingCredits === 0 && (
                <div className="rounded-[16px] border border-destructive/20 bg-destructive/10 p-4">
                  <div className="flex items-start gap-3">
                    <Coins className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-destructive">
                        Vous n&apos;avez plus de crédits
                      </p>
                      <p className="mt-1 text-sm text-destructive/80">
                        Vous ne pouvez pas réserver cette salle sans crédits.
                      </p>
                      {renderCreditsError()}
                    </div>
                  </div>
                </div>
              )}

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
                  className={`rounded-[16px] p-4 ${!hasEnoughCredits ? "bg-destructive/10" : "bg-foreground/5"}`}
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
                  {!hasEnoughCredits && renderCreditsError()}
                </div>
              )}
            </div>
          )}

          {/* Confirm view */}
          {view === "confirm" && selectedRoom && selectedDate && (
            <div className="space-y-4 overflow-auto flex-1">
              <div className="rounded-[16px] bg-foreground/5 p-4 space-y-3">
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

              <div className="rounded-[16px] bg-[#1B1918] p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total à débiter</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-5 w-5" />
                    <span className="text-lg font-bold">{creditsNeeded} crédits</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-white/70">
                  Il vous restera {remainingCredits - creditsNeeded} crédits après cette
                  réservation
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons (modal) */}
          {view !== "planning" && (
            <div className="flex justify-end gap-3 pt-4 shrink-0 border-t border-foreground/5 mt-4">
              <Button variant="outline" onClick={onClose} className="rounded-full">
                Annuler
              </Button>
              {view === "confirm" ? (
                <Button onClick={handleConfirm} disabled={submitting} className="rounded-full bg-[#1B1918] hover:bg-[#1B1918]/90">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmer la réservation
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()} className="rounded-full bg-[#1B1918] hover:bg-[#1B1918]/90">
                  Continuer
                </Button>
              )}
            </div>
          )}
        </div>
      ) : (
        // Page layout
        <div className="grid gap-4 md:gap-6 lg:grid-cols-3">
          {/* Planning Grid */}
          <div className={`rounded-[16px] bg-card p-3 sm:p-4 md:p-6 ${view === "planning" ? "lg:col-span-3" : "lg:col-span-2"}`}>
            {loadingRooms || loadingBookings ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredRooms.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {rooms.length === 0
                  ? "Aucune salle disponible sur ce site"
                  : "Aucune salle ne correspond au filtre de capacité"}
              </p>
            ) : (
              <RoomPlanningGrid
                rooms={filteredRooms}
                bookings={bookings}
                onSlotClick={handleSlotClick}
                remainingCredits={remainingCredits}
                selectedDate={selectedDate}
              />
            )}

            {/* Capacity filter - below calendar */}
            {capacityOptions.length > 0 && view === "planning" && (
              <div className="flex items-center gap-2 flex-wrap pt-4 mt-4 border-t">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Capacité</span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={capacityFilter === null ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCapacityFilter(null)}
                  >
                    Toutes
                  </Button>
                  {capacityOptions.map((cap) => (
                    <Button
                      key={cap}
                      variant={capacityFilter === cap ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setCapacityFilter(cap)}
                    >
                      {cap}+
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Side panel for slots/confirm (page) */}
          {view !== "planning" && selectedRoom && (
            <div className="rounded-[16px] bg-card p-3 sm:p-4 md:p-6 lg:col-span-1">
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
                        <span className="type-body-sm text-muted-foreground">Disponibles</span>
                        <span className="type-body-sm">{remainingCredits}</span>
                      </div>
                      {!hasEnoughCredits && renderCreditsError()}
                    </div>
                  )}

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

                  <Button onClick={handleConfirm} className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirmer la réservation
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  )
}
