"use client"

import { useState, useMemo, useCallback } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { format, parseISO, addDays, subDays, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Users, DoorOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { BookingEditDialog } from "./booking-edit-dialog"
import { ViewToggle, type ViewMode } from "./view-toggle"
import { cn } from "@/lib/utils"
import type { MeetingRoomResource } from "@/lib/types/database"
import type { BookingWithDetails } from "@/lib/types/database"

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00
const SLOT_HEIGHT = 48 // pixels per hour

interface RoomBooking {
  id: string
  resourceId: string
  startHour: number
  endHour: number
  title: string | null
  userName: string | null
  status: string
  companyName: string | null
}

interface SiteRoomCalendarProps {
  rooms: MeetingRoomResource[]
  bookings: BookingWithDetails[]
  referenceDate: string
  paramPrefix: string
}

export function SiteRoomCalendar({
  rooms,
  bookings,
  referenceDate,
  paramPrefix,
}: SiteRoomCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [calendarOpen, setCalendarOpen] = useState(false)

  // State for booking edit dialog
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const currentDate = useMemo(() => {
    const dateParam = searchParams.get(`${paramPrefix}date`)
    return dateParam ? parseISO(dateParam) : new Date()
  }, [searchParams, paramPrefix])

  // Convert bookings to room format
  const roomBookings = useMemo(() => {
    const dateStr = format(currentDate, "yyyy-MM-dd")
    const filteredBookings = bookings.filter((b) => {
      const bookingDate = format(parseISO(b.start_date), "yyyy-MM-dd")
      return bookingDate === dateStr && b.resource_type === "meeting_room"
    })

    return filteredBookings.map((b): RoomBooking => ({
      id: b.id,
      resourceId: b.resource_id,
      startHour: new Date(b.start_date).getHours(),
      endHour: new Date(b.end_date).getHours(),
      title: b.notes,
      userName: [b.user_first_name, b.user_last_name].filter(Boolean).join(" ") || null,
      status: b.status,
      companyName: b.company_name,
    }))
  }, [bookings, currentDate])

  // Group bookings by room
  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, RoomBooking[]>()
    roomBookings.forEach((booking) => {
      const existing = map.get(booking.resourceId) || []
      existing.push(booking)
      map.set(booking.resourceId, existing)
    })
    return map
  }, [roomBookings])

  // Get current hour for the "now" indicator
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const isWithinRange = currentHour >= 8 && currentHour < 20

  // Calculate now indicator position (percentage from top of grid)
  const isCurrentDateToday = isToday(currentDate)
  const nowPosition = isWithinRange && isCurrentDateToday
    ? ((currentHour - 8) * 60 + currentMinutes) / (12 * 60) * 100
    : null

  // Navigation handlers
  const navigateToDate = useCallback(
    (date: Date) => {
      const params = new URLSearchParams(searchParams)
      params.set(`${paramPrefix}date`, format(date, "yyyy-MM-dd"))
      params.set(`${paramPrefix}view`, "rooms")
      router.push(`?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, paramPrefix]
  )

  const handlePreviousDay = () => {
    navigateToDate(subDays(currentDate, 1))
  }

  const handleNextDay = () => {
    navigateToDate(addDays(currentDate, 1))
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      navigateToDate(date)
      setCalendarOpen(false)
    }
  }

  const handleBookingClick = (booking: RoomBooking) => {
    const fullBooking = bookings.find((b) => b.id === booking.id)
    if (fullBooking) {
      setSelectedBooking(fullBooking)
      setIsDialogOpen(true)
    }
  }

  // Check if a slot is available
  const isSlotAvailable = (roomId: string, hour: number) => {
    const roomBookingList = bookingsByRoom.get(roomId) || []
    return !roomBookingList.some(
      (b) => hour >= b.startHour && hour < b.endHour && b.status !== "cancelled"
    )
  }

  // Handle view change
  const handleViewChange = useCallback(
    (newView: ViewMode) => {
      const params = new URLSearchParams(searchParams)
      params.set(`${paramPrefix}view`, newView)
      router.push(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [router, searchParams, paramPrefix, pathname]
  )

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-end">
          <ViewToggle currentView="rooms" onViewChange={handleViewChange} showRoomsView />
        </div>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <DoorOpen className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune salle de reunion sur ce site
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Navigation header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handlePreviousDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="min-w-[160px]">
                {isToday(currentDate) ? (
                  "Aujourd'hui"
                ) : (
                  <span className="capitalize">
                    {format(currentDate, "EEEE d MMMM", { locale: fr })}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={handleNextDay}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday(currentDate) && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => navigateToDate(new Date())}
            >
              Aujourd'hui
            </Button>
          )}
        </div>

        <ViewToggle currentView="rooms" onViewChange={handleViewChange} showRoomsView />
      </div>

      {/* Room planning grid */}
      <div className="overflow-x-auto -mx-6">
        <div className="min-w-[600px] px-6">
          {/* Use CSS Grid for perfect alignment between header and timeline */}
          <div
            className="grid"
            style={{
              gridTemplateColumns: `48px repeat(${rooms.length}, minmax(100px, 1fr))`,
              gap: "8px",
            }}
          >
            {/* Header row - Time column header */}
            <div className="shrink-0" />

            {/* Header row - Room headers */}
            {rooms.map((room) => (
              <div
                key={`header-${room.id}`}
                className="text-center py-3 px-1"
              >
                {/* Room photo or placeholder */}
                {room.photoUrls && room.photoUrls.length > 0 ? (
                  <div className="mx-auto w-16 h-12 rounded-lg overflow-hidden mb-2">
                    <img
                      src={room.photoUrls[0]}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="mx-auto w-16 h-12 rounded-lg bg-muted/60 flex items-center justify-center mb-2">
                    <DoorOpen className="h-6 w-6 text-muted-foreground/60" />
                  </div>
                )}

                {/* Room name */}
                <p className="text-sm font-medium text-foreground truncate">
                  {room.name}
                </p>

                {/* Room info */}
                <div className="flex items-center justify-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  {room.capacity && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-3 w-3" />
                      {room.capacity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Timeline grid - separate for relative positioning of now indicator */}
          <div
            className="grid relative"
            style={{
              gridTemplateColumns: `48px repeat(${rooms.length}, minmax(100px, 1fr))`,
              gap: "8px",
            }}
          >
            {/* Now indicator */}
            {nowPosition !== null && (
              <div
                className="absolute z-20 pointer-events-none flex items-center"
                style={{
                  top: `${nowPosition}%`,
                  left: "48px",
                  right: 0,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-destructive -ml-1" />
                <div className="h-[1px] bg-destructive flex-1" />
              </div>
            )}

            {/* Time column */}
            <div>
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="flex items-start justify-end pr-2 -mt-2"
                  style={{ height: SLOT_HEIGHT }}
                >
                  <span className="text-xs text-muted-foreground/70">
                    {hour}h
                  </span>
                </div>
              ))}
            </div>

            {/* Room columns */}
            {rooms.map((room) => {
              const roomBookingList = bookingsByRoom.get(room.id) || []

              return (
                <div
                  key={`grid-${room.id}`}
                  className="relative"
                >
                  {/* Subtle background column */}
                  <div className="absolute inset-0 bg-muted/20 rounded-lg" />

                  {/* Hour slots */}
                  <div className="relative">
                    {HOURS.map((hour, index) => {
                      const available = isSlotAvailable(room.id, hour)
                      const isPast = isCurrentDateToday && currentHour > hour

                      return (
                        <div
                          key={hour}
                          className={cn(
                            "w-full transition-colors relative",
                            index < HOURS.length - 1 && "border-b border-foreground/5",
                            isPast && "bg-foreground/[0.02]"
                          )}
                          style={{ height: SLOT_HEIGHT }}
                        />
                      )
                    })}
                  </div>

                  {/* Booking blocks */}
                  {roomBookingList.map((booking) => {
                    const top = (booking.startHour - 8) * SLOT_HEIGHT
                    const height = (booking.endHour - booking.startHour) * SLOT_HEIGHT
                    const isCancelled = booking.status === "cancelled"

                    return (
                      <button
                        key={booking.id}
                        type="button"
                        onClick={() => handleBookingClick(booking)}
                        className={cn(
                          "absolute left-1 right-1 rounded-md p-1.5 overflow-hidden text-left transition-all",
                          isCancelled
                            ? "bg-muted/50 opacity-60"
                            : "bg-primary/20 hover:bg-primary/30 cursor-pointer"
                        )}
                        style={{ top, height }}
                      >
                        <p className={cn(
                          "text-xs font-medium truncate",
                          isCancelled ? "text-muted-foreground line-through" : "text-foreground"
                        )}>
                          {booking.userName || "Sans nom"}
                        </p>
                        {booking.companyName && height > 50 && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {booking.companyName}
                          </p>
                        )}
                        {height > 70 && (
                          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                            {booking.startHour}h - {booking.endHour}h
                          </p>
                        )}
                        {isCancelled && height > 45 && (
                          <span className="text-[9px] text-muted-foreground bg-muted rounded px-1">
                            Annulee
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Booking edit dialog */}
      <BookingEditDialog
        booking={selectedBooking}
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  )
}
