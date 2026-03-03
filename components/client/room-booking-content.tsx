"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import { useTranslations, useLocale } from "next-intl"
import { getDateLocale } from "@/lib/i18n/date-locale"
import { toParisDate, createParisDate } from "@/lib/timezone"
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
import { RoomPlanningGrid, RoomHeaders, RoomTimeline, PhotoViewer } from "./room-planning-grid"
import { TimeSlotPicker } from "./time-slot-picker"
import {
  getMeetingRoomsBySite,
  getRoomBookingsForDate,
  checkAvailability,
  createMeetingRoomBooking,
} from "@/lib/actions/bookings"
import { disabledDateMatcher, createSiteAwareDisabledMatcher, getNextBusinessDay, getNextBusinessDays, getBusinessDaysFrom, getBusinessDaysCentered, getPreviousBusinessDay, isSameDay, isToday } from "@/lib/dates"
import { getSiteClosureDates } from "@/lib/actions/sites"
import { cn, formatTime, formatDuration } from "@/lib/utils"
import type { MeetingRoomResource } from "@/lib/types/database"
import type { RoomBooking } from "@/lib/actions/bookings"

type View = "planning" | "slots" | "confirm"

// Number of days to show in the day picker
const VISIBLE_DAYS_COUNT = 5

interface RoomBookingContentProps {
  userId: string
  companyId: string
  mainSiteId: string | null
  remainingCredits: number
  sites: Array<{ id: string; name: string }>
  userEmail?: string
  hasActivePlan?: boolean
  referral?: string
  // For modal usage
  isModal?: boolean
  selectedSiteIdProp?: string | null  // Controlled site selection from parent
  onSiteChange?: (siteId: string | null) => void  // Callback when site changes
  onClose?: () => void
  onSuccess?: () => void
}

export function RoomBookingContent({
  userId,
  companyId,
  mainSiteId,
  remainingCredits,
  sites,
  userEmail = "",
  hasActivePlan = true,
  referral,
  isModal = false,
  selectedSiteIdProp,
  onSiteChange,
  onClose,
  onSuccess,
}: RoomBookingContentProps) {
  const [view, setView] = useState<View>("planning")
  // Use controlled state from parent if provided (modal mode), otherwise local state
  const [localSelectedSiteId, setLocalSelectedSiteId] = useState<string | null>(mainSiteId)
  const selectedSiteId = isModal && selectedSiteIdProp !== undefined ? selectedSiteIdProp : localSelectedSiteId
  const setSelectedSiteId = (siteId: string | null) => {
    if (isModal && onSiteChange) {
      onSiteChange(siteId)
    } else {
      setLocalSelectedSiteId(siteId)
    }
  }
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [viewCenterDate, setViewCenterDate] = useState<Date>(new Date()) // Controls which days are shown in the picker
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
  const [viewerPhotos, setViewerPhotos] = useState<string[] | null>(null)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [siteClosureDates, setSiteClosureDates] = useState<Set<string>>(new Set())

  const t = useTranslations("roomBooking")
  const tc = useTranslations("common")
  const locale = useLocale()
  const dateLocale = getDateLocale(locale)
  const [notes, setNotes] = useState("");
  // Photo viewer handlers
  const handlePhotoClick = (photos: string[], index: number) => {
    setViewerPhotos(photos)
    setViewerIndex(index)
  }

  const closePhotoViewer = () => {
    setViewerPhotos(null)
  }

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

  // Load rooms and closure dates when site changes
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
      getSiteClosureDates(selectedSiteId).then(setSiteClosureDates)
    } else {
      setSiteClosureDates(new Set())
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
            const start = toParisDate(booking.start_date)
            const end = toParisDate(booking.end_date)
            const startH = start.getHours() + start.getMinutes() / 60
            const endH = end.getHours() + end.getMinutes() / 60
            for (let h = startH; h < endH; h += 0.5) {
              const hours = Math.floor(h)
              const minutes = Math.round((h % 1) * 60)
              unavailable.push(`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`)
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
      const hours = Math.floor(selectedStartHour)
      const minutes = Math.round((selectedStartHour % 1) * 60)
      setSelectedSlots([`${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`])
    }
  }, [view, selectedStartHour])

  const selectedSite = sites.find((s) => s.id === selectedSiteId)
  const creditsNeeded = selectedSlots.length * ((selectedRoom?.hourly_credit_rate ?? 0) / 2)
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

  // Handle date change from calendar (updates both selected date and view center)
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setViewCenterDate(date) // Also center the view on this date
      setSelectedRoom(null)
      setSelectedStartHour(null)
      setSelectedSlots([])
      setCalendarOpen(false)
      if (view !== "planning") setView("planning")
    }
  }

  // Handle day click from the day picker (only updates selected date, not view center)
  const handleDayClick = (date: Date) => {
    setSelectedDate(date)
    setSelectedRoom(null)
    setSelectedStartHour(null)
    setSelectedSlots([])
    if (view !== "planning") setView("planning")
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
    // Add 30 minutes to the last slot start to get the end time
    const [lastH, lastM] = lastSlot.split(":").map(Number)
    const endMinutes = lastM + 30
    const endH = lastH + Math.floor(endMinutes / 60)
    const endMin = endMinutes % 60
    const endTimeStr = `${endH.toString().padStart(2, "0")}:${endMin.toString().padStart(2, "0")}`

    const dateStr = format(selectedDate, "yyyy-MM-dd")
    const startDate = createParisDate(dateStr, firstSlot).toISOString()
    const endDate = createParisDate(dateStr, endTimeStr).toISOString()

    const result = await createMeetingRoomBooking({
      userId,
      resourceId: selectedRoom.id,
      startDate,
      endDate,
      creditsToUse: creditsNeeded,
      companyId,
      referral,
      notes,
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

  // Site-aware disabled date matcher (memoized)
  const siteDisabledMatcher = useMemo(
    () => createSiteAwareDisabledMatcher(siteClosureDates),
    [siteClosureDates]
  )

  // Get business days centered around the view center date, excluding site closures
  const upcomingDays = useMemo(() => {
    const days = getBusinessDaysCentered(viewCenterDate, VISIBLE_DAYS_COUNT + siteClosureDates.size + 5)
    return days
      .filter((d) => !siteClosureDates.has(format(d, "yyyy-MM-dd")))
      .slice(0, VISIBLE_DAYS_COUNT)
  }, [viewCenterDate, siteClosureDates])

  // Check if we can navigate to previous days
  const canNavigatePrev = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return upcomingDays.length > 0 && upcomingDays[0] > today
  }, [upcomingDays])

  // Navigate to previous set of days (without changing selected date)
  const handlePrevDays = () => {
    if (upcomingDays.length > 0 && canNavigatePrev) {
      const firstDay = upcomingDays[0]
      const prevDay = getPreviousBusinessDay(firstDay)
      if (prevDay) {
        setViewCenterDate(prevDay)
      }
    }
  }

  // Navigate to next set of days (without changing selected date)
  const handleNextDays = () => {
    if (upcomingDays.length > 0) {
      const lastDay = upcomingDays[upcomingDays.length - 1]
      const nextDay = getNextBusinessDay(lastDay)
      setViewCenterDate(nextDay)
    }
  }

  // Render credits insufficient message with links
  const renderCreditsError = () => (
    <div className="mt-3 space-y-2">
      {hasActivePlan ? (
        <>
          <p className="text-sm text-destructive font-medium">
            {t("notEnoughCredits")}
          </p>
          <Link
            href="/boutique?tab=credits"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            onClick={onClose}
          >
            {tc("buyMoreCredits")}
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm text-destructive font-medium">
            {t("passExpiredCoworking")}
          </p>
          <a
            href={`https://hopper-coworking.com/?email_user=${encodeURIComponent(userEmail)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            {tc("subscribePass")}
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
          {t("bookingSuccess")}
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
          {t("selectSiteMessage")}
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
              placeholder={t("selectSite")}
              searchPlaceholder={t("searchSite")}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={isModal ? "flex flex-col flex-1 min-h-0 gap-5" : "space-y-6"}>
      {/* Fullscreen photo viewer */}
      {viewerPhotos && (
        <PhotoViewer
          photos={viewerPhotos}
          initialIndex={viewerIndex}
          onClose={closePhotoViewer}
        />
      )}

      {/* Header controls - always visible in planning view */}
      {view === "planning" && (
        <div className={`space-y-3 ${isModal ? "shrink-0" : ""}`}>
          {/* Modal: Capacity filter + Day picker */}
          {isModal && (
            <div className="space-y-2 sm:space-y-0">
              {/* Day picker - full width on mobile, centered on desktop */}
              <div className="flex items-center justify-center gap-1 sm:relative sm:h-[52px]">
                {/* On desktop, capacity filter is positioned left */}
                {capacityOptions.length > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 absolute left-0">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <div className="flex gap-1">
                      <Button
                        variant={capacityFilter === null ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs rounded-full"
                        onClick={() => setCapacityFilter(null)}
                      >
                        {tc("all")}
                      </Button>
                      {capacityOptions.map((cap) => (
                        <Button
                          key={cap}
                          variant={capacityFilter === cap ? "default" : "outline"}
                          size="sm"
                          className="h-7 px-2 text-xs rounded-full"
                          onClick={() => setCapacityFilter(cap)}
                        >
                          {cap}+
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Previous arrow */}
                <button
                  type="button"
                  onClick={handlePrevDays}
                  disabled={!canNavigatePrev}
                  className={cn(
                    "flex h-10 w-8 sm:h-[52px] sm:w-9 shrink-0 items-center justify-center rounded-[12px] transition-colors",
                    canNavigatePrev
                      ? "bg-foreground/5 hover:bg-foreground/10"
                      : "bg-foreground/5 opacity-50 cursor-not-allowed"
                  )}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {/* Day buttons */}
                <div className="flex gap-0.5 sm:gap-1">
                  {upcomingDays.map((day) => {
                    const isSelected = isSameDay(day, selectedDate)
                    const dayIsToday = isToday(day)
                    return (
                      <button
                        key={day.toISOString()}
                        type="button"
                        onClick={() => handleDayClick(day)}
                        className={cn(
                          "flex flex-col items-center justify-center min-w-[40px] h-10 sm:min-w-[46px] sm:h-[52px] rounded-[10px] sm:rounded-[12px] transition-all",
                          isSelected
                            ? "bg-[#1B1918] text-white"
                            : "bg-foreground/5 hover:bg-foreground/10 text-foreground"
                        )}
                      >
                        <span className={cn(
                          "text-[8px] sm:text-[9px] font-medium uppercase tracking-wide",
                          isSelected ? "text-white/80" : "text-muted-foreground"
                        )}>
                          {format(day, "EEE", { locale: dateLocale })}
                        </span>
                        <span className={cn(
                          "text-sm sm:text-base font-semibold leading-tight",
                          isSelected ? "text-white" : "text-foreground"
                        )}>
                          {format(day, "d")}
                        </span>
                        <span className={cn(
                          "text-[7px] sm:text-[8px]",
                          isSelected ? "text-white/70" : "text-muted-foreground/70"
                        )}>
                          {dayIsToday ? tc("todayShort") : format(day, "MMM", { locale: dateLocale })}
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Next arrow */}
                <button
                  type="button"
                  onClick={handleNextDays}
                  className="flex h-10 w-8 sm:h-[52px] sm:w-9 shrink-0 items-center justify-center rounded-[12px] bg-foreground/5 hover:bg-foreground/10 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>

                {/* Calendar button */}
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-10 w-8 sm:h-[52px] sm:w-9 shrink-0 rounded-[12px] border-0 bg-foreground/5 hover:bg-foreground/10"
                    >
                      <CalendarIcon className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={siteDisabledMatcher}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Capacity filter - separate row on mobile */}
              {capacityOptions.length > 0 && (
                <div className="flex items-center gap-1.5 sm:hidden overflow-x-auto">
                  <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex gap-1">
                    <Button
                      variant={capacityFilter === null ? "default" : "outline"}
                      size="sm"
                      className="h-7 px-2 text-xs rounded-full shrink-0"
                      onClick={() => setCapacityFilter(null)}
                    >
                      {tc("all")}
                    </Button>
                    {capacityOptions.map((cap) => (
                      <Button
                        key={cap}
                        variant={capacityFilter === cap ? "default" : "outline"}
                        size="sm"
                        className="h-7 px-2 text-xs rounded-full shrink-0"
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

          {/* Date row - Page only */}
          <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isModal ? "hidden" : ""}`}>

            {/* Date navigation - page mode */}
            {!isModal && (
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
                      {isTodaySelected ? tc("today") : format(selectedDate, "dd/MM/yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={handleDateChange}
                      disabled={siteDisabledMatcher}
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
                  <p className="type-body-sm text-muted-foreground">{t("myCredits")}</p>
                  <p className="type-h4 text-foreground">
                    {remainingCredits} {remainingCredits > 1 ? tc("credits") : tc("credit")}
                  </p>
                </div>
              </div>
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
                        {t("passExpired")}
                      </p>
                      <p className="mt-1 text-sm text-amber-700">
                        {t("cannotBookRoom")}
                      </p>
                      <a
                        href={`https://hopper-coworking.com/?email_user=${encodeURIComponent(userEmail)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                      >
                        {tc("subscribePass")}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </>
                  ) : (
                    <>
                      <p className="font-medium text-amber-800">
                        {t("noCreditsLeft")}
                      </p>
                      <p className="mt-1 text-sm text-amber-700">
                        {t("noCreditsMessage")}
                      </p>
                      <Link
                        href="/boutique?tab=credits"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                      >
                        {tc("buyCredits")}
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
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {/* Warning banner for modal when user has no credits (pass expired is shown in modal header) */}
          {view === "planning" && hasActivePlan && remainingCredits === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 mb-3 shrink-0">
              <div className="flex items-start gap-2">
                <Coins className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-amber-800">
                    {t("noCreditsLeft")}
                  </p>
                  <Link
                    href="/boutique?tab=credits"
                    onClick={onClose}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-800"
                  >
                    {tc("buyCredits")}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Planning Grid */}
          {view === "planning" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Room headers - FIXED (outside scroll) */}
              {!loadingRooms && !loadingBookings && filteredRooms.length > 0 && (
                <div className="shrink-0">
                  <RoomHeaders rooms={filteredRooms} onPhotoClick={handlePhotoClick} />
                </div>
              )}

              {/* Scrollable timeline container */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {loadingRooms || loadingBookings ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredRooms.length === 0 ? (
                  <p className="py-8 text-center type-body text-muted-foreground">
                    {rooms.length === 0
                      ? t("noRoomsOnSite")
                      : t("noRoomsCapacity")}
                  </p>
                ) : (
                  <RoomTimeline
                    rooms={filteredRooms}
                    bookings={bookings}
                    onSlotClick={handleSlotClick}
                    selectedDate={selectedDate}
                    currentUserId={userId}
                  />
                )}
              </div>

            </div>
          )}

          {/* Slots view */}
          {view === "slots" && selectedRoom && (
            <div className="space-y-3 sm:space-y-4 flex-1 overflow-y-auto min-h-0">
              <div className="rounded-[16px] p-3 sm:p-4 bg-foreground/5">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="type-body font-medium truncate">{selectedRoom.name}</p>
                    <div className="flex items-center gap-2 type-body-sm text-muted-foreground">
                      {selectedRoom.capacity && <span>{selectedRoom.capacity} {tc("persons")}</span>}
                      {selectedRoom.hourly_credit_rate && (
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {selectedRoom.hourly_credit_rate} {tc("creditPerHour")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <p className="type-body-sm text-muted-foreground">
                      {format(selectedDate, "EEEE d MMMM", { locale: dateLocale })}
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
                        {t("noCreditsLeft")}
                      </p>
                      <p className="mt-1 text-sm text-destructive/80">
                        {t("cannotBookWithoutCredits")}
                      </p>
                      {renderCreditsError()}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="type-body-sm font-medium text-foreground mb-2 block">
                  {t("selectSlots")}
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
                    <span className="type-body-sm text-muted-foreground">{t("totalCost")}</span>
                    <div className="flex items-center gap-1">
                      <Coins
                        className={`h-4 w-4 ${!hasEnoughCredits ? "text-destructive" : "text-primary"}`}
                      />
                      <span
                        className={`type-body font-semibold ${!hasEnoughCredits ? "text-destructive" : ""}`}
                      >
                        {creditsNeeded} {tc("credits")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="type-body-sm text-muted-foreground">
                      {t("creditsAvailable")}
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
            <div className="space-y-4 flex-1 overflow-y-auto min-h-0">
              <div className="rounded-[16px] bg-foreground/5 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="type-body-sm text-muted-foreground">{tc("site")}</p>
                    <p className="type-body font-medium">{selectedSite?.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="type-body-sm text-muted-foreground">{tc("date")}</p>
                    <p className="type-body font-medium capitalize">
                      {format(selectedDate, "EEEE d MMMM yyyy", { locale: dateLocale })}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="type-body-sm text-muted-foreground">{tc("time")}</p>
                    <p className="type-body font-medium">
                      {(() => {
                        const sorted = [...selectedSlots].sort()
                        const [fH, fM] = sorted[0].split(":").map(Number)
                        const [lH, lM] = sorted[sorted.length - 1].split(":").map(Number)
                        const endMin = lM + 30
                        const eH = lH + Math.floor(endMin / 60)
                        const eM = endMin % 60
                        const duration = sorted.length * 0.5
                        return `${formatTime(fH + fM / 60)} - ${formatTime(eH + eM / 60)} (${formatDuration(duration)})`
                      })()}
                    </p>
                  </div>
                </div>
                <div className="border-t pt-3">
                  <p className="type-body font-medium">{selectedRoom.name}</p>
                  {selectedRoom.capacity && (
                    <p className="type-body-sm text-muted-foreground">
                      {t("capacityPersons", { count: selectedRoom.capacity })}
                    </p>
                  )}
                </div>
              </div>

              {/* Notes input */}
              <div className="rounded-[16px] bg-foreground/5 p-4">
                <label htmlFor="booking-notes" className="type-body-sm font-medium mb-1.5 block">
                  {t("notes")}
                </label>
                <textarea
                  id="booking-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="w-full rounded-[12px] border border-input bg-background px-3 py-2 type-body-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 min-h-[80px] resize-none"
                />
              </div>

              <div className="rounded-[16px] bg-[#1B1918] p-4 text-white">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t("totalToDebit")}</span>
                  <div className="flex items-center gap-1">
                    <Coins className="h-5 w-5" />
                    <span className="text-lg font-bold">{creditsNeeded} {tc("credits")}</span>
                  </div>
                </div>
                <p className="mt-1 text-xs text-white/70">
                  {t("remainingAfter", { remaining: remainingCredits - creditsNeeded })}
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons (modal) */}
          {view !== "planning" && (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3 pt-3 sm:pt-4 shrink-0 border-t border-foreground/5 mt-3 sm:mt-4">
              <Button variant="outline" onClick={handleBack} className="rounded-full w-full sm:w-auto">
                {tc("back")}
              </Button>
              {view === "confirm" ? (
                <Button onClick={handleConfirm} disabled={submitting} className="rounded-full bg-[#1B1918] hover:bg-[#1B1918]/90 w-full sm:w-auto">
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t("confirmBooking")}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()} className="rounded-full bg-[#1B1918] hover:bg-[#1B1918]/90 w-full sm:w-auto">
                  {tc("continue")}
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
                  ? t("noRoomsOnSite")
                  : t("noRoomsCapacity")}
              </p>
            ) : (
              <RoomPlanningGrid
                rooms={filteredRooms}
                bookings={bookings}
                onSlotClick={handleSlotClick}
                selectedDate={selectedDate}
                currentUserId={userId}
              />
            )}

            {/* Capacity filter - below calendar */}
            {capacityOptions.length > 0 && view === "planning" && (
              <div className="flex items-center gap-2 flex-wrap pt-4 mt-4 border-t">
                <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t("capacity")}</span>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant={capacityFilter === null ? "default" : "outline"}
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setCapacityFilter(null)}
                  >
                    {tc("all")}
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
                  {view === "slots" ? t("chooseSlots") : tc("confirm")}
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
                      {selectedRoom.capacity && <span>{selectedRoom.capacity} {tc("persons")}</span>}
                      {selectedRoom.hourly_credit_rate && (
                        <span className="flex items-center gap-1">
                          <Coins className="h-3 w-3" />
                          {selectedRoom.hourly_credit_rate} {tc("creditPerHour")}
                        </span>
                      )}
                    </div>
                    <p className="type-body-sm text-muted-foreground mt-1">
                      {format(selectedDate, "EEEE d MMMM", { locale: dateLocale })}
                    </p>
                  </div>

                  <div>
                    <label className="type-body-sm font-medium text-foreground mb-2 block">
                      {t("selectSlots")}
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
                        <span className="type-body-sm text-muted-foreground">{t("totalCost")}</span>
                        <div className="flex items-center gap-1">
                          <Coins
                            className={`h-4 w-4 ${!hasEnoughCredits ? "text-destructive" : "text-primary"}`}
                          />
                          <span
                            className={`type-body font-semibold ${!hasEnoughCredits ? "text-destructive" : ""}`}
                          >
                            {creditsNeeded} {tc("credits")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="type-body-sm text-muted-foreground">{t("available")}</span>
                        <span className="type-body-sm">{remainingCredits}</span>
                      </div>
                      {!hasEnoughCredits && renderCreditsError()}
                    </div>
                  )}

                  <Button onClick={handleNext} disabled={!canProceed()} className="w-full">
                    {tc("continue")}
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
                        <p className="type-body-sm text-muted-foreground">{tc("site")}</p>
                        <p className="type-body font-medium">{selectedSite?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="type-body-sm text-muted-foreground">{tc("date")}</p>
                        <p className="type-body font-medium capitalize">
                          {format(selectedDate, "EEEE d MMMM yyyy", { locale: dateLocale })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="type-body-sm text-muted-foreground">{tc("time")}</p>
                        <p className="type-body font-medium">
                          {(() => {
                            const sorted = [...selectedSlots].sort()
                            const [fH, fM] = sorted[0].split(":").map(Number)
                            const [lH, lM] = sorted[sorted.length - 1].split(":").map(Number)
                            const endMin = lM + 30
                            const eH = lH + Math.floor(endMin / 60)
                            const eM = endMin % 60
                            return `${formatTime(fH + fM / 60)} - ${formatTime(eH + eM / 60)}`
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="border-t pt-3">
                      <p className="type-body font-medium">{selectedRoom.name}</p>
                      {selectedRoom.capacity && (
                        <p className="type-body-sm text-muted-foreground">
                          {t("capacityPersons", { count: selectedRoom.capacity })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-4">
                    <div className="flex items-center justify-between">
                      <span className="type-body font-medium">{t("totalToDebit")}</span>
                      <div className="flex items-center gap-1">
                        <Coins className="h-5 w-5 text-primary" />
                        <span className="type-h4 text-primary">{creditsNeeded} {tc("credits")}</span>
                      </div>
                    </div>
                    <p className="mt-1 type-body-sm text-muted-foreground">
                      {t("remainingCredits", { remaining: remainingCredits - creditsNeeded })}
                    </p>
                  </div>

                  <Button onClick={handleConfirm} className="w-full" disabled={submitting}>
                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {t("confirmBooking")}
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
