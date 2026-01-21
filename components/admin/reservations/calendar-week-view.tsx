"use client"

import { useMemo, useEffect, useState, useCallback, useRef } from "react"
import {
  format,
  startOfWeek,
  addDays,
  getHours,
  getMinutes,
  differenceInMinutes,
  isToday,
  isPast,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import type { BookingWithDetails } from "@/lib/types/database"

interface CalendarWeekViewProps {
  bookings: BookingWithDetails[]
  referenceDate: Date
  onBookingClick?: (booking: BookingWithDetails) => void
  onBookingUpdate?: (
    bookingId: string,
    startDate: string,
    endDate: string
  ) => Promise<{ error?: string }>
}

// Drag state interface
interface DragState {
  booking: BookingWithDetails
  initialMouseY: number
  initialMouseX: number
  initialTop: number
  initialHeight: number
  currentTop: number
  currentDayIndex: number
  originalDayIndex: number
  gridRect: DOMRect
}

const HOUR_HEIGHT = 60 // pixels per hour
const START_HOUR = 7
const END_HOUR = 20
const HOURS = Array.from(
  { length: END_HOUR - START_HOUR },
  (_, i) => START_HOUR + i
)
const TOTAL_HEIGHT = HOURS.length * HOUR_HEIGHT

// Snap configuration (30 minutes)
const SNAP_MINUTES = 30
const SNAP_HEIGHT = HOUR_HEIGHT * (SNAP_MINUTES / 60) // 30px for 30 min

// Minimum drag distance to differentiate from click
const MIN_DRAG_DISTANCE = 5

// More vibrant pastel colors for meeting rooms (same as month view)
const MEETING_ROOM_COLORS = [
  "bg-[#C5B4E3]", // vibrant lavender
  "bg-[#A8D5BA]", // vibrant mint green
  "bg-[#F5C6AA]", // vibrant peach
  "bg-[#9ECAE1]", // vibrant sky blue
  "bg-[#F2A6B3]", // vibrant rose
  "bg-[#B8D4E3]", // vibrant light blue
  "bg-[#D4C1A1]", // vibrant sand
  "bg-[#C9E4CA]", // vibrant sage
  "bg-[#E3B5D3]", // vibrant pink
  "bg-[#A5C8E1]", // vibrant periwinkle
]

// Neutral color for non-meeting room bookings
const DEFAULT_BOOKING_COLOR = "bg-muted/60"

// Gray color for past or cancelled bookings
const INACTIVE_BOOKING_COLOR = "bg-muted/50"

// Generate a consistent color index for a meeting room based on its ID or name
function getMeetingRoomColorIndex(resourceId: string | null, resourceName: string | null): number {
  const identifier = resourceId || resourceName || "default"
  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    const char = identifier.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash) % MEETING_ROOM_COLORS.length
}

// Day names in French
const DAY_NAMES = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI"]

export function CalendarWeekView({
  bookings,
  referenceDate,
  onBookingClick,
  onBookingUpdate,
}: CalendarWeekViewProps) {
  const weekStart = startOfWeek(referenceDate, { weekStartsOn: 1 })
  const [currentTimePosition, setCurrentTimePosition] = useState<number | null>(
    null
  )

  // Drag & drop state
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  // Only weekdays (Monday to Friday)
  const weekDays = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i))
  }, [weekStart])

  // Calculate current time position for the indicator
  useEffect(() => {
    const updateTimePosition = () => {
      const now = new Date()
      const currentHour = getHours(now) + getMinutes(now) / 60

      if (currentHour >= START_HOUR && currentHour <= END_HOUR) {
        const position = (currentHour - START_HOUR) * HOUR_HEIGHT
        setCurrentTimePosition(position)
      } else {
        setCurrentTimePosition(null)
      }
    }

    updateTimePosition()
    const interval = setInterval(updateTimePosition, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [])

  // Group bookings by day
  const bookingsByDay = useMemo(() => {
    const grouped: Record<string, BookingWithDetails[]> = {}

    weekDays.forEach((day) => {
      const dayKey = format(day, "yyyy-MM-dd")
      grouped[dayKey] = []
    })

    bookings.forEach((booking) => {
      const bookingDate = new Date(booking.start_date)
      const dayKey = format(bookingDate, "yyyy-MM-dd")
      if (grouped[dayKey]) {
        grouped[dayKey].push(booking)
      }
    })

    return grouped
  }, [bookings, weekDays])

  // Calculate booking position and dimensions
  const getBookingPosition = (booking: BookingWithDetails) => {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)

    const startHour = getHours(start) + getMinutes(start) / 60
    const duration = differenceInMinutes(end, start) / 60

    const top = Math.max(0, (startHour - START_HOUR) * HOUR_HEIGHT)
    const height = Math.max(40, duration * HOUR_HEIGHT)

    return { top, height }
  }

  // Check if a booking is in the past (end date has passed)
  const isBookingPast = useCallback((booking: BookingWithDetails): boolean => {
    return isPast(new Date(booking.end_date))
  }, [])

  // Get color for a booking - gray for past/cancelled, colored for active
  const getBookingColor = (booking: BookingWithDetails) => {
    // Past or cancelled bookings are grayed out
    if (booking.status === "cancelled" || isBookingPast(booking)) {
      return INACTIVE_BOOKING_COLOR
    }
    // Only active meeting rooms get vibrant colors
    if (booking.resource_type === "meeting_room") {
      const colorIndex = getMeetingRoomColorIndex(booking.resource_id, booking.resource_name)
      return MEETING_ROOM_COLORS[colorIndex]
    }
    return DEFAULT_BOOKING_COLOR
  }

  // Format time range for display
  const formatTimeRange = (booking: BookingWithDetails) => {
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    return `${format(start, "HH:mm")} - ${format(end, "HH:mm")}`
  }

  // Check if today is in the current week
  const todayIndex = weekDays.findIndex((day) => isToday(day))

  // Snap position to 30-minute grid
  const snapToGrid = useCallback((top: number): number => {
    const snapped = Math.round(top / SNAP_HEIGHT) * SNAP_HEIGHT
    // Clamp to valid range
    return Math.max(0, Math.min(snapped, TOTAL_HEIGHT - SNAP_HEIGHT))
  }, [])

  // Calculate day index from mouse X position
  const getDayIndexFromX = useCallback(
    (mouseX: number, gridRect: DOMRect): number => {
      const relativeX = mouseX - gridRect.left
      const columnWidth = gridRect.width / 5
      const dayIndex = Math.floor(relativeX / columnWidth)
      return Math.max(0, Math.min(dayIndex, 4))
    },
    []
  )

  // Handle mouse down on booking
  const handleMouseDown = useCallback(
    (
      e: React.MouseEvent,
      booking: BookingWithDetails,
      dayIndex: number
    ) => {
      // Don't allow drag for cancelled or past bookings, or if no update handler
      if (booking.status === "cancelled" || isBookingPast(booking) || !onBookingUpdate || isUpdating) {
        return
      }

      // Only left click
      if (e.button !== 0) return

      e.preventDefault()
      e.stopPropagation()

      const grid = gridRef.current
      if (!grid) return

      const gridRect = grid.getBoundingClientRect()
      const { top, height } = getBookingPosition(booking)

      setDragState({
        booking,
        initialMouseY: e.clientY,
        initialMouseX: e.clientX,
        initialTop: top,
        initialHeight: height,
        currentTop: top,
        currentDayIndex: dayIndex,
        originalDayIndex: dayIndex,
        gridRect,
      })
    },
    [onBookingUpdate, isUpdating, getBookingPosition, isBookingPast]
  )

  // Handle mouse move during drag
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragState) return

      const deltaY = e.clientY - dragState.initialMouseY
      const deltaX = e.clientX - dragState.initialMouseX

      // Check if we've moved enough to consider it a drag
      if (
        !isDragging &&
        (Math.abs(deltaX) > MIN_DRAG_DISTANCE ||
          Math.abs(deltaY) > MIN_DRAG_DISTANCE)
      ) {
        setIsDragging(true)
      }

      if (isDragging) {
        const newTop = Math.max(
          0,
          Math.min(
            dragState.initialTop + deltaY,
            TOTAL_HEIGHT - dragState.initialHeight
          )
        )
        const newDayIndex = getDayIndexFromX(e.clientX, dragState.gridRect)

        setDragState((prev) =>
          prev
            ? {
                ...prev,
                currentTop: newTop,
                currentDayIndex: newDayIndex,
              }
            : null
        )
      }
    },
    [dragState, isDragging, getDayIndexFromX]
  )

  // Handle mouse up - finalize drag
  const handleMouseUp = useCallback(async () => {
    if (!dragState) return

    // If we didn't drag, trigger click instead
    if (!isDragging) {
      setDragState(null)
      onBookingClick?.(dragState.booking)
      return
    }

    const snappedTop = snapToGrid(dragState.currentTop)
    const newDayIndex = dragState.currentDayIndex

    // Calculate new start time
    const hoursFromTop = snappedTop / HOUR_HEIGHT
    const newStartHour = Math.floor(START_HOUR + hoursFromTop)
    const newStartMinutes = Math.round((hoursFromTop % 1) * 60)

    // Calculate duration from original booking
    const originalStart = new Date(dragState.booking.start_date)
    const originalEnd = new Date(dragState.booking.end_date)
    const durationMinutes = differenceInMinutes(originalEnd, originalStart)

    // Build new dates
    const newDay = weekDays[newDayIndex]
    let newStartDate = setMilliseconds(
      setSeconds(
        setMinutes(setHours(newDay, newStartHour), newStartMinutes),
        0
      ),
      0
    )
    let newEndDate = new Date(newStartDate.getTime() + durationMinutes * 60000)

    // Check if anything actually changed
    const originalStartHour =
      getHours(originalStart) + getMinutes(originalStart) / 60
    const originalTop = (originalStartHour - START_HOUR) * HOUR_HEIGHT
    const originalDayKey = format(originalStart, "yyyy-MM-dd")
    const newDayKey = format(newDay, "yyyy-MM-dd")

    if (
      Math.abs(snappedTop - originalTop) < 1 &&
      originalDayKey === newDayKey
    ) {
      // No change, just reset
      setDragState(null)
      setIsDragging(false)
      return
    }

    // Call update handler
    setIsUpdating(true)
    try {
      const result = await onBookingUpdate?.(
        dragState.booking.id,
        newStartDate.toISOString(),
        newEndDate.toISOString()
      )

      if (result?.error) {
        // Show error - the parent should handle toast notifications
        console.error("Booking update failed:", result.error)
      }
    } catch (error) {
      console.error("Booking update error:", error)
    } finally {
      setIsUpdating(false)
      setDragState(null)
      setIsDragging(false)
    }
  }, [
    dragState,
    isDragging,
    snapToGrid,
    weekDays,
    onBookingClick,
    onBookingUpdate,
  ])

  // Handle escape key to cancel drag
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && dragState) {
        setDragState(null)
        setIsDragging(false)
      }
    },
    [dragState]
  )

  // Add/remove global event listeners for drag
  useEffect(() => {
    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleMouseUp)
      window.addEventListener("keydown", handleKeyDown)

      return () => {
        window.removeEventListener("mousemove", handleMouseMove)
        window.removeEventListener("mouseup", handleMouseUp)
        window.removeEventListener("keydown", handleKeyDown)
      }
    }
  }, [dragState, handleMouseMove, handleMouseUp, handleKeyDown])

  // Format time from top position for ghost preview
  const formatTimeFromTop = useCallback((top: number, durationMinutes: number) => {
    const snappedTop = snapToGrid(top)
    const hoursFromTop = snappedTop / HOUR_HEIGHT
    const startHour = Math.floor(START_HOUR + hoursFromTop)
    const startMinutes = Math.round((hoursFromTop % 1) * 60)
    const endDate = new Date(2000, 0, 1, startHour, startMinutes + durationMinutes)
    return `${startHour.toString().padStart(2, "0")}:${startMinutes.toString().padStart(2, "0")} - ${format(endDate, "HH:mm")}`
  }, [snapToGrid])

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[20px] border border-border/10 bg-card">
      {/* Header with day names */}
      <div className="flex h-14 shrink-0 items-center border-b border-border/10 bg-card">
        {/* Time column spacer */}
        <div className="hidden w-16 shrink-0 border-r border-border/10 sm:block md:w-20" />

        {/* Day headers */}
        <div className="grid flex-1 grid-cols-5 h-full">
          {weekDays.map((day, index) => (
            <div
              key={day.toISOString()}
              className={cn(
                "flex flex-col items-center justify-center border-r border-border/10 last:border-r-0",
                isToday(day) && "bg-white/10"
              )}
            >
              <span className="text-[10px] font-bold uppercase opacity-40">
                {DAY_NAMES[index]}
              </span>
              <span
                className={cn(
                  "mt-1 text-lg font-black leading-none",
                  isToday(day) && "text-primary"
                )}
              >
                {format(day, "d", { locale: fr })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Time grid */}
      <div className="no-scrollbar relative flex flex-1 overflow-y-auto">
        {/* Time labels column */}
        <div className="sticky left-0 z-10 hidden w-16 shrink-0 border-r border-border/10 bg-card sm:block md:w-20">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="relative"
              style={{ height: HOUR_HEIGHT }}
            >
              <span className="absolute -top-3 right-2 text-[10px] font-bold opacity-40 md:right-3">
                {hour.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Grid content area */}
        <div
          ref={gridRef}
          className="relative flex-1"
          style={{ minHeight: TOTAL_HEIGHT }}
        >
          {/* Horizontal grid lines */}
          <div className="pointer-events-none absolute inset-0 flex flex-col">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="w-full border-b border-border/[0.08]"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}
          </div>

          {/* Vertical grid lines for day columns */}
          <div className="pointer-events-none absolute inset-0 grid h-full grid-cols-5">
            {weekDays.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "h-full border-r border-border/5 last:border-r-0",
                  isToday(day) && "bg-white/5"
                )}
              />
            ))}
          </div>

          {/* Bookings layer */}
          <div className="absolute inset-0 grid grid-cols-5">
            {weekDays.map((day, dayIndex) => {
              const dayKey = format(day, "yyyy-MM-dd")
              const dayBookings = bookingsByDay[dayKey] || []

              return (
                <div key={day.toISOString()} className="relative h-full">
                  {dayBookings.map((booking) => {
                    const { top, height } = getBookingPosition(booking)
                    const isBeingDragged =
                      isDragging && dragState?.booking.id === booking.id
                    const canDrag =
                      booking.status !== "cancelled" &&
                      !isBookingPast(booking) &&
                      !!onBookingUpdate &&
                      !isUpdating

                    return (
                      <div
                        key={booking.id}
                        className={cn(
                          "absolute left-1 right-1 z-[2] overflow-hidden rounded-[16px] border border-border/10 p-2 transition-shadow hover:shadow-md sm:rounded-[20px] sm:p-3",
                          getBookingColor(booking),
                          canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                          isBeingDragged && "opacity-40"
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: "40px",
                        }}
                        onMouseDown={(e) =>
                          handleMouseDown(e, booking, dayIndex)
                        }
                      >
                        <div className="flex h-full flex-col justify-between select-none">
                          <div className="min-w-0">
                            <p className="truncate text-[9px] font-bold uppercase opacity-60">
                              {formatTimeRange(booking)}
                            </p>
                            <p className="mt-0.5 truncate text-[10px] font-black uppercase leading-tight sm:text-xs">
                              {booking.resource_name || "Ressource"}
                            </p>
                          </div>
                          {height >= 60 && (
                            <p className="truncate text-[9px] font-medium opacity-50">
                              {booking.site_name || booking.company_name || ""}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {/* Drag ghost element */}
          {isDragging && dragState && (
            <div
              className="pointer-events-none absolute inset-0 grid grid-cols-5"
              style={{ zIndex: 10 }}
            >
              {weekDays.map((_, dayIndex) => (
                <div key={dayIndex} className="relative h-full">
                  {dayIndex === dragState.currentDayIndex && (
                    <div
                      className={cn(
                        "absolute left-1 right-1 overflow-hidden rounded-[16px] border-2 border-primary p-2 shadow-lg sm:rounded-[20px] sm:p-3",
                        getBookingColor(dragState.booking)
                      )}
                      style={{
                        top: `${snapToGrid(dragState.currentTop)}px`,
                        height: `${dragState.initialHeight}px`,
                        minHeight: "40px",
                      }}
                    >
                      <div className="flex h-full flex-col justify-between select-none">
                        <div className="min-w-0">
                          <p className="truncate text-[9px] font-bold uppercase opacity-60">
                            {formatTimeFromTop(
                              dragState.currentTop,
                              differenceInMinutes(
                                new Date(dragState.booking.end_date),
                                new Date(dragState.booking.start_date)
                              )
                            )}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] font-black uppercase leading-tight sm:text-xs">
                            {dragState.booking.resource_name || "Ressource"}
                          </p>
                        </div>
                        {dragState.initialHeight >= 60 && (
                          <p className="truncate text-[9px] font-medium opacity-50">
                            {dragState.booking.site_name ||
                              dragState.booking.company_name ||
                              ""}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Current time indicator - only in today's column */}
          {currentTimePosition !== null && todayIndex >= 0 && (
            <div
              className="pointer-events-none absolute z-[5] flex items-center"
              style={{
                top: `${currentTimePosition}px`,
                left: `${(todayIndex / 5) * 100}%`,
                width: `${100 / 5}%`
              }}
            >
              <div className="absolute left-0 h-2 w-2 -translate-x-1/2 rounded-full bg-red-400 ring-2 ring-card" />
              <div className="h-[1.5px] w-full bg-red-400" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
