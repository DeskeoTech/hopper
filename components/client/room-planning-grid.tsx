"use client"

import { useMemo, useState } from "react"
import { Users, Coins, DoorOpen, ChevronLeft, ChevronRight, X, Tv, Video, PenTool, Layers } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MeetingRoomResource, ResourceEquipment } from "@/lib/types/database"
import type { RoomBooking } from "@/lib/actions/bookings"

// Equipment labels and icons
const equipmentConfig: Record<ResourceEquipment, { label: string; icon: typeof Tv }> = {
  ecran: { label: "Écran", icon: Tv },
  visio: { label: "Visio", icon: Video },
  tableau: { label: "Tableau", icon: PenTool },
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8) // 8:00 to 19:00
const SLOT_HEIGHT = 52 // pixels per hour
const MOBILE_SLOT_HEIGHT = 40 // smaller on mobile

interface RoomPlanningGridProps {
  rooms: MeetingRoomResource[]
  bookings: RoomBooking[]
  onSlotClick: (room: MeetingRoomResource, hour: number) => void
  selectedDate: Date
  currentUserId?: string
}

// Fullscreen photo viewer
export function PhotoViewer({
  photos,
  initialIndex,
  onClose,
}: {
  photos: string[]
  initialIndex: number
  onClose: () => void
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="h-6 w-6 text-white" />
      </button>

      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="h-8 w-8 text-white" />
      </button>

      <img
        src={photos[currentIndex]}
        alt={`Photo ${currentIndex + 1}`}
        className="max-w-[90vw] max-h-[90vh] object-contain"
      />

      <button
        type="button"
        onClick={handleNext}
        className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      >
        <ChevronRight className="h-8 w-8 text-white" />
      </button>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {photos.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentIndex(idx)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-colors",
              idx === currentIndex ? "bg-white" : "bg-white/40 hover:bg-white/60"
            )}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================
// ROOM CARD COMPONENT
// ============================================
interface RoomCardProps {
  room: MeetingRoomResource
  onClick: (room: MeetingRoomResource) => void
  onPhotoClick?: (photos: string[], index: number) => void
}

function RoomCard({ room, onClick, onPhotoClick }: RoomCardProps) {
  const handlePhotoClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (room.photoUrls && room.photoUrls.length > 0 && onPhotoClick) {
      onPhotoClick(room.photoUrls, 0)
    }
  }

  return (
    <button
      type="button"
      onClick={() => onClick(room)}
      className="w-full h-full overflow-hidden rounded-[20px] bg-background text-left border border-foreground/10 hover:border-foreground/30 transition-colors flex flex-col cursor-pointer"
    >
      {/* Photo */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-t-[18px]">
        {room.photoUrls && room.photoUrls.length > 0 ? (
          <img
            src={room.photoUrls[0]}
            alt={room.name}
            className="w-full h-full object-cover transition-transform hover:scale-105"
            onClick={handlePhotoClick}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <DoorOpen className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Credits badge */}
        {room.hourly_credit_rate && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2 py-1">
            <Coins className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium">{room.hourly_credit_rate}/h</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-header text-base font-bold uppercase tracking-tight truncate">
          {room.name}
        </h4>

        {/* Info row */}
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          {room.capacity && (
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {room.capacity} pers.
            </span>
          )}
          {room.floor && (
            <span className="flex items-center gap-1">
              <Layers className="h-3.5 w-3.5" />
              {room.floor}
            </span>
          )}
        </div>

        {/* Equipments */}
        {room.equipments && room.equipments.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {room.equipments.map((equipment) => {
              const config = equipmentConfig[equipment]
              if (!config) return null
              const Icon = config.icon
              return (
                <span
                  key={equipment}
                  className="flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs"
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </span>
              )
            })}
          </div>
        )}
      </div>
    </button>
  )
}

// ============================================
// ROOM CARDS GRID COMPONENT
// Exported for use on the /compte/reserver page (non-modal view)
// ============================================
interface RoomCardsGridProps {
  rooms: MeetingRoomResource[]
  onRoomSelect: (room: MeetingRoomResource) => void
  onPhotoClick?: (photos: string[], index: number) => void
}

export function RoomCardsGrid({ rooms, onRoomSelect, onPhotoClick }: RoomCardsGridProps) {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          onClick={onRoomSelect}
          onPhotoClick={onPhotoClick}
        />
      ))}
    </div>
  )
}

// ============================================
// SINGLE ROOM TIMELINE COMPONENT
// Exported for use on the /compte/reserver page (non-modal view)
// ============================================
interface SingleRoomTimelineProps {
  room: MeetingRoomResource
  bookings: RoomBooking[]
  onSlotClick: (room: MeetingRoomResource, hour: number) => void
  selectedDate: Date
}

export function SingleRoomTimeline({ room, bookings, onSlotClick, selectedDate }: SingleRoomTimelineProps) {
  // Get current hour for the "now" indicator
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const isWithinRange = currentHour >= 8 && currentHour < 20

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === now.toDateString()

  // Calculate now indicator position
  const nowPosition = isWithinRange
    ? ((currentHour - 8) * 60 + currentMinutes) / (12 * 60) * 100
    : null

  // Filter bookings for this room
  const roomBookings = bookings.filter((b) => b.resourceId === room.id)

  // Check if a slot is available
  const isSlotAvailable = (hour: number) => {
    return !roomBookings.some((b) => hour >= b.startHour && hour < b.endHour)
  }

  return (
    <div className="relative" style={{ height: HOURS.length * SLOT_HEIGHT }}>
      {/* Horizontal grid lines */}
      {HOURS.map((hour, index) => (
        <div
          key={`line-${hour}`}
          className="absolute left-[48px] right-0 border-t border-foreground/10"
          style={{ top: index * SLOT_HEIGHT }}
        />
      ))}
      <div
        className="absolute left-[48px] right-0 border-t border-foreground/10"
        style={{ top: HOURS.length * SLOT_HEIGHT }}
      />

      {/* Now indicator */}
      {nowPosition !== null && isToday && (
        <div
          className="absolute z-20 pointer-events-none flex items-center"
          style={{
            top: `${nowPosition}%`,
            left: "48px",
            right: 0,
          }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
          <div className="h-[2px] bg-destructive flex-1" />
        </div>
      )}

      {/* Grid with time column and single room column */}
      <div className="flex h-full">
        {/* Time column */}
        <div className="w-12 shrink-0 relative">
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground"
              style={{ top: (hour - 8) * SLOT_HEIGHT }}
            >
              {hour}h
            </div>
          ))}
        </div>

        {/* Room column */}
        <div className="flex-1 relative">
          {/* Hour slots (clickable areas) */}
          {HOURS.map((hour) => {
            const available = isSlotAvailable(hour)
            const isPast = isToday && currentHour > hour

            return (
              <button
                key={hour}
                type="button"
                onClick={() => available && !isPast && onSlotClick(room, hour)}
                disabled={!available || isPast}
                className={cn(
                  "absolute left-0 right-0 transition-colors",
                  available && !isPast
                    ? "hover:bg-primary/10 cursor-pointer"
                    : "cursor-not-allowed",
                  isPast && "bg-foreground/[0.03]"
                )}
                style={{
                  top: (hour - 8) * SLOT_HEIGHT,
                  height: SLOT_HEIGHT,
                }}
              />
            )
          })}

          {/* Booking blocks */}
          {roomBookings.map((booking) => {
            const top = (booking.startHour - 8) * SLOT_HEIGHT
            const height = (booking.endHour - booking.startHour) * SLOT_HEIGHT

            return (
              <div
                key={booking.id}
                className="absolute left-1 right-1 rounded-md bg-foreground/10 p-1.5 overflow-hidden pointer-events-none z-10"
                style={{ top: top + 1, height: height - 2 }}
              >
                <p className="text-xs font-medium text-foreground truncate">
                  {booking.title || "Réservé"}
                </p>
                {booking.userName && height > 50 && (
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                    {booking.userName}
                  </p>
                )}
                {height > 70 && (
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                    {booking.startHour}h - {booking.endHour}h
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ============================================
// ROOM HEADERS COMPONENT (Fixed, outside scroll)
// ============================================
interface RoomHeadersProps {
  rooms: MeetingRoomResource[]
  onPhotoClick?: (photos: string[], index: number) => void
}

export function RoomHeaders({ rooms, onPhotoClick }: RoomHeadersProps) {
  const handlePhotoClick = (photos: string[], index: number) => {
    onPhotoClick?.(photos, index)
  }

  return (
    <>
      {/* Mobile headers */}
      <div className="sm:hidden">
        <div className="flex pb-2 -mx-3 px-3">
          {/* Time column header */}
          <div className="w-10 shrink-0" />

          {/* Room headers */}
          <div className="flex flex-1 gap-1 overflow-x-auto">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="flex-1 min-w-[60px] text-center"
              >
                {/* Room photo */}
                {room.photoUrls && room.photoUrls.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => handlePhotoClick(room.photoUrls || [], 0)}
                    className="mx-auto w-10 h-8 rounded overflow-hidden mb-1"
                  >
                    <img
                      src={room.photoUrls[0]}
                      alt={room.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <div className="mx-auto w-10 h-8 rounded bg-muted/60 flex items-center justify-center mb-1">
                    <DoorOpen className="h-4 w-4 text-muted-foreground/60" />
                  </div>
                )}

                {/* Room name */}
                <p className="text-[10px] font-medium text-foreground truncate px-0.5 leading-tight">
                  {room.name}
                </p>

                {/* Room info */}
                <div className="flex items-center justify-center gap-1 mt-0.5 text-[9px] text-muted-foreground/80">
                  {room.capacity && (
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {room.capacity}
                    </span>
                  )}
                  {room.hourly_credit_rate && (
                    <span className="flex items-center gap-0.5">
                      <Coins className="h-2.5 w-2.5" />
                      {room.hourly_credit_rate}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop headers */}
      <div className="hidden sm:block -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `48px repeat(${rooms.length}, minmax(90px, 1fr))`,
            gap: "8px",
          }}
        >
          {/* Time column header */}
          <div className="shrink-0" />

          {/* Room headers */}
          {rooms.map((room) => (
            <div
              key={`header-${room.id}`}
              className="text-center pt-2 pb-3"
            >
              {/* Room photo - click to open fullscreen carousel */}
              {room.photoUrls && room.photoUrls.length > 0 ? (
                <button
                  type="button"
                  onClick={() => handlePhotoClick(room.photoUrls || [], 0)}
                  className="mx-auto w-full max-w-[80px] aspect-[4/3] rounded-lg overflow-hidden mb-2 group"
                >
                  <img
                    src={room.photoUrls[0]}
                    alt={room.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                </button>
              ) : (
                <div className="mx-auto w-full max-w-[80px] aspect-[4/3] rounded-lg bg-muted/60 flex items-center justify-center mb-2">
                  <DoorOpen className="h-6 w-6 text-muted-foreground/60" />
                </div>
              )}

              {/* Room name */}
              <p className="text-sm font-medium text-foreground truncate px-1">
                {room.name}
              </p>

              {/* Room info */}
              <div className="flex items-center justify-center gap-2 mt-0.5 text-xs text-muted-foreground/80">
                {room.capacity && (
                  <span className="flex items-center gap-0.5">
                    <Users className="h-3 w-3" />
                    {room.capacity}
                  </span>
                )}
                {room.hourly_credit_rate && (
                  <span className="flex items-center gap-0.5">
                    <Coins className="h-3 w-3" />
                    {room.hourly_credit_rate}/h
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

// ============================================
// ROOM TIMELINE COMPONENT (Scrollable)
// ============================================
interface RoomTimelineProps {
  rooms: MeetingRoomResource[]
  bookings: RoomBooking[]
  onSlotClick: (room: MeetingRoomResource, hour: number) => void
  selectedDate: Date
  currentUserId?: string
}

export function RoomTimeline({ rooms, bookings, onSlotClick, selectedDate, currentUserId }: RoomTimelineProps) {
  // Group bookings by room
  const bookingsByRoom = useMemo(() => {
    const map = new Map<string, RoomBooking[]>()
    bookings.forEach((booking) => {
      const existing = map.get(booking.resourceId) || []
      existing.push(booking)
      map.set(booking.resourceId, existing)
    })
    return map
  }, [bookings])

  // Get current hour for the "now" indicator
  const now = new Date()
  const currentHour = now.getHours()
  const currentMinutes = now.getMinutes()
  const isWithinRange = currentHour >= 8 && currentHour < 20

  // Check if selected date is today
  const isToday = selectedDate.toDateString() === now.toDateString()

  // Calculate now indicator position (percentage from top of grid)
  const nowPosition = isWithinRange
    ? ((currentHour - 8) * 60 + currentMinutes) / (12 * 60) * 100
    : null

  // Check if a slot is available
  const isSlotAvailable = (roomId: string, hour: number) => {
    const roomBookings = bookingsByRoom.get(roomId) || []
    return !roomBookings.some(
      (b) => hour >= b.startHour && hour < b.endHour
    )
  }

  return (
    <>
      {/* Mobile timeline */}
      <div className="sm:hidden -mx-3 px-3 pt-2">
        <div
          className="relative"
          style={{ height: HOURS.length * MOBILE_SLOT_HEIGHT }}
        >
          {/* Horizontal grid lines - start after time column (40px) */}
          {HOURS.map((hour, index) => (
            <div
              key={`line-${hour}`}
              className="absolute left-10 right-0 border-t border-foreground/10"
              style={{ top: index * MOBILE_SLOT_HEIGHT }}
            />
          ))}
          <div
            className="absolute left-10 right-0 border-t border-foreground/10"
            style={{ top: HOURS.length * MOBILE_SLOT_HEIGHT }}
          />

          {/* Now indicator */}
          {nowPosition !== null && isToday && (
            <div
              className="absolute left-10 right-0 z-20 pointer-events-none flex items-center"
              style={{ top: `${nowPosition}%` }}
            >
              <div className="w-2 h-2 rounded-full bg-destructive -ml-0.5" />
              <div className="h-[2px] bg-destructive flex-1" />
            </div>
          )}

          {/* Grid layout */}
          <div className="flex h-full">
            {/* Time column */}
            <div className="w-10 shrink-0 relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-1.5 -translate-y-1/2 text-[10px] text-muted-foreground"
                  style={{ top: (hour - 8) * MOBILE_SLOT_HEIGHT }}
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Room columns */}
            <div className="flex flex-1 overflow-x-auto">
              {rooms.map((room, roomIndex) => {
                const roomBookings = bookingsByRoom.get(room.id) || []

                return (
                  <div
                    key={room.id}
                    className={cn(
                      "flex-1 min-w-[60px] relative",
                      roomIndex > 0 && "border-l border-foreground/10"
                    )}
                  >
                    {/* Hour slots (clickable areas) */}
                    {HOURS.map((hour) => {
                      const available = isSlotAvailable(room.id, hour)
                      const isPast = isToday && currentHour > hour

                      return (
                        <button
                          key={hour}
                          type="button"
                          onClick={() => available && !isPast && onSlotClick(room, hour)}
                          disabled={!available || isPast}
                          className={cn(
                            "absolute left-0 right-0 transition-colors",
                            available && !isPast
                              ? "hover:bg-primary/10 active:bg-primary/20 cursor-pointer"
                              : "cursor-not-allowed",
                            isPast && "bg-foreground/[0.03]"
                          )}
                          style={{
                            top: (hour - 8) * MOBILE_SLOT_HEIGHT,
                            height: MOBILE_SLOT_HEIGHT,
                          }}
                        />
                      )
                    })}

                    {/* Booking blocks */}
                    {roomBookings.map((booking) => {
                      const top = (booking.startHour - 8) * MOBILE_SLOT_HEIGHT
                      const height = (booking.endHour - booking.startHour) * MOBILE_SLOT_HEIGHT
                      const isOwnBooking = currentUserId && booking.userId === currentUserId

                      return (
                        <div
                          key={booking.id}
                          className={cn(
                            "absolute left-0.5 right-0.5 rounded p-1 overflow-hidden pointer-events-none z-10",
                            isOwnBooking ? "bg-primary/20" : "bg-foreground/10"
                          )}
                          style={{ top: top + 1, height: height - 2 }}
                        >
                          <p className="text-[9px] font-medium text-foreground truncate leading-tight">
                            {isOwnBooking ? (booking.title || "Ma réservation") : "Indisponible"}
                          </p>
                          {height > 35 && (
                            <p className="text-[8px] text-muted-foreground/70 mt-0.5">
                              {booking.startHour}h-{booking.endHour}h
                            </p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop timeline */}
      <div className="hidden sm:block -mx-4 sm:-mx-6 px-4 sm:px-6 pt-3">
        <div
          className="relative"
          style={{ height: HOURS.length * SLOT_HEIGHT }}
        >
          {/* Horizontal grid lines - start after time column (48px) */}
          {HOURS.map((hour, index) => (
            <div
              key={`line-${hour}`}
              className="absolute left-[48px] right-0 border-t border-foreground/10"
              style={{ top: index * SLOT_HEIGHT }}
            />
          ))}
          {/* Bottom line */}
          <div
            className="absolute left-[48px] right-0 border-t border-foreground/10"
            style={{ top: HOURS.length * SLOT_HEIGHT }}
          />

          {/* Now indicator */}
          {nowPosition !== null && isToday && (
            <div
              className="absolute z-20 pointer-events-none flex items-center"
              style={{
                top: `${nowPosition}%`,
                left: "48px",
                right: 0,
              }}
            >
              <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1" />
              <div className="h-[2px] bg-destructive flex-1" />
            </div>
          )}

          {/* Grid with time column and room columns */}
          <div
            className="grid h-full"
            style={{
              gridTemplateColumns: `48px repeat(${rooms.length}, minmax(90px, 1fr))`,
            }}
          >
            {/* Time column */}
            <div className="relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-2 -translate-y-1/2 text-xs text-muted-foreground"
                  style={{ top: (hour - 8) * SLOT_HEIGHT }}
                >
                  {hour}h
                </div>
              ))}
            </div>

            {/* Room columns */}
            {rooms.map((room, roomIndex) => {
              const roomBookings = bookingsByRoom.get(room.id) || []

              return (
                <div
                  key={`grid-${room.id}`}
                  className={cn(
                    "relative",
                    roomIndex > 0 && "border-l border-foreground/10"
                  )}
                >
                  {/* Hour slots (clickable areas) */}
                  {HOURS.map((hour) => {
                    const available = isSlotAvailable(room.id, hour)
                    const isPast = isToday && currentHour > hour

                    return (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => available && !isPast && onSlotClick(room, hour)}
                        disabled={!available || isPast}
                        className={cn(
                          "absolute left-0 right-0 transition-colors",
                          available && !isPast
                            ? "hover:bg-primary/10 cursor-pointer"
                            : "cursor-not-allowed",
                          isPast && "bg-foreground/[0.03]"
                        )}
                        style={{
                          top: (hour - 8) * SLOT_HEIGHT,
                          height: SLOT_HEIGHT,
                        }}
                      />
                    )
                  })}

                  {/* Booking blocks */}
                  {roomBookings.map((booking) => {
                    const top = (booking.startHour - 8) * SLOT_HEIGHT
                    const height = (booking.endHour - booking.startHour) * SLOT_HEIGHT
                    const isOwnBooking = currentUserId && booking.userId === currentUserId

                    return (
                      <div
                        key={booking.id}
                        className={cn(
                          "absolute left-1 right-1 rounded-md p-1.5 overflow-hidden pointer-events-none z-10",
                          isOwnBooking ? "bg-primary/20" : "bg-foreground/10"
                        )}
                        style={{ top: top + 1, height: height - 2 }}
                      >
                        <p className="text-xs font-medium text-foreground truncate">
                          {isOwnBooking ? (booking.title || "Ma réservation") : "Indisponible"}
                        </p>
                        {isOwnBooking && height > 50 && (
                          <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {booking.startHour}h - {booking.endHour}h
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}

// ============================================
// COMBINED COMPONENT (for backwards compatibility)
// ============================================
export function RoomPlanningGrid({
  rooms,
  bookings,
  onSlotClick,
  selectedDate,
  currentUserId,
}: RoomPlanningGridProps) {
  const [viewerPhotos, setViewerPhotos] = useState<string[] | null>(null)
  const [viewerIndex, setViewerIndex] = useState(0)

  const handlePhotoClick = (photos: string[], index: number) => {
    setViewerPhotos(photos)
    setViewerIndex(index)
  }

  const closeViewer = () => {
    setViewerPhotos(null)
  }

  return (
    <>
      {/* Fullscreen photo viewer */}
      {viewerPhotos && (
        <PhotoViewer
          photos={viewerPhotos}
          initialIndex={viewerIndex}
          onClose={closeViewer}
        />
      )}

      <RoomHeaders rooms={rooms} onPhotoClick={handlePhotoClick} />
      <RoomTimeline
        rooms={rooms}
        bookings={bookings}
        onSlotClick={onSlotClick}
        selectedDate={selectedDate}
        currentUserId={currentUserId}
      />
    </>
  )
}
