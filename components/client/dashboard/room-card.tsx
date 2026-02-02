"use client"

import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Coins,
  ImageIcon,
} from "lucide-react"
import { ResourceEquipmentBadge } from "@/components/admin/resource-equipment-badge"
import { cn } from "@/lib/utils"
import type { MeetingRoomResource } from "@/lib/types/database"

interface RoomCardProps {
  room: MeetingRoomResource
  onClick: () => void
}

export function RoomCard({ room, onClick }: RoomCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const hasPhotos = room.photoUrls && room.photoUrls.length > 0
  const hasMultiplePhotos = room.photoUrls && room.photoUrls.length > 1

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (room.photoUrls) {
      setCurrentIndex((prev) => (prev - 1 + room.photoUrls!.length) % room.photoUrls!.length)
    }
  }

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (room.photoUrls) {
      setCurrentIndex((prev) => (prev + 1) % room.photoUrls!.length)
    }
  }

  const handleDotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation()
    setCurrentIndex(index)
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onClick()
        }
      }}
      className="w-[180px] shrink-0 overflow-hidden rounded-[16px] border bg-card text-left transition-all  hover:border-primary/20 active:scale-[0.98] cursor-pointer"
    >
      {/* Room photo slider */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {hasPhotos ? (
          <>
            <img
              src={room.photoUrls![currentIndex]}
              alt={`${room.name} - Photo ${currentIndex + 1}`}
              className="h-full w-full object-cover"
            />
            {hasMultiplePhotos && (
              <>
                {/* Navigation arrows */}
                <button
                  type="button"
                  onClick={handlePrevPhoto}
                  className="absolute left-1 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1  hover:bg-background transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPhoto}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full bg-background/70 p-1  hover:bg-background transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                {/* Dots indicator */}
                <div className="absolute bottom-1.5 left-1/2 flex -translate-x-1/2 gap-1">
                  {room.photoUrls!.map((_, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={(e) => handleDotClick(e, idx)}
                      className={cn(
                        "h-1.5 w-1.5 rounded-full transition-colors",
                        idx === currentIndex
                          ? "bg-white"
                          : "bg-white/50 hover:bg-white/75"
                      )}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-foreground/20" />
          </div>
        )}
      </div>
      {/* Room info */}
      <div className="p-3">
        <p className="font-medium text-sm truncate">{room.name}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          {room.capacity && (
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {room.capacity}
            </span>
          )}
          {room.hourly_credit_rate && (
            <span className="flex items-center gap-1">
              <Coins className="h-3 w-3" />
              {room.hourly_credit_rate}/h
            </span>
          )}
        </div>
        {room.equipments && room.equipments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {room.equipments.map((eq) => (
              <ResourceEquipmentBadge key={eq} equipment={eq} size="sm" />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
