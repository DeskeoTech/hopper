"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, ImageIcon, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookMeetingRoomModal } from "../book-meeting-room-modal"
import { useClientLayout } from "../client-layout-provider"
import { getCurrentlyAvailableMeetingRooms } from "@/lib/actions/rooms"
import type { MeetingRoomResource } from "@/lib/types/database"

interface RoomCardProps {
  room: MeetingRoomResource
  onClick: () => void
}

function RoomCard({ room, onClick }: RoomCardProps) {
  const hasPhoto = room.photoUrls && room.photoUrls.length > 0

  return (
    <div className="overflow-hidden rounded-[20px] bg-card ">
      {/* Image with badges */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {hasPhoto ? (
          <img
            src={room.photoUrls![0]}
            alt={room.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-foreground/20" />
          </div>
        )}
        {/* Capacity badge - top right */}
        {room.capacity && (
          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-medium">
            <Users className="h-3 w-3" />
            {room.capacity}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h4 className="font-header text-base font-bold uppercase tracking-tight">{room.name}</h4>
        {room.hourly_credit_rate && (
          <p className="mt-1 text-sm text-muted-foreground">
            {room.hourly_credit_rate} crédit{room.hourly_credit_rate > 1 ? "s" : ""}/h
          </p>
        )}
        <Button
          onClick={onClick}
          className="mt-3 w-full rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 uppercase text-xs font-semibold tracking-wide"
        >
          Réserver
        </Button>
      </div>
    </div>
  )
}

export function AvailableRoomsSection() {
  const { user, credits, sites, selectedSiteId, selectedSiteWithDetails, plan } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [rooms, setRooms] = useState<MeetingRoomResource[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch available rooms when site changes
  useEffect(() => {
    if (!selectedSiteId) {
      setRooms([])
      setLoading(false)
      return
    }

    setLoading(true)
    getCurrentlyAvailableMeetingRooms(selectedSiteId).then((result) => {
      setLoading(false)
      if (!result.error) {
        setRooms(result.rooms)
      } else {
        setRooms([])
      }
    })
  }, [selectedSiteId])

  const handleRoomClick = () => {
    setBookingModalOpen(true)
  }

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="font-header text-xl text-foreground">Salles disponibles</h2>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  // Don't render if no rooms available
  if (rooms.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-header text-xl text-foreground">Salles disponibles</h2>
          <button
            type="button"
            onClick={handleRoomClick}
            className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Voir tout
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Rooms grid */}
        <div className="-mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
            {rooms.slice(0, 3).map((room) => (
              <div key={room.id} className="w-[220px] shrink-0 md:w-auto">
                <RoomCard
                  room={room}
                  onClick={handleRoomClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      <BookMeetingRoomModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        userId={user.id}
        companyId={user.company_id || ""}
        mainSiteId={selectedSiteId}
        remainingCredits={credits?.remaining || 0}
        sites={sites}
        userEmail={user.email || ""}
        hasActivePlan={!!plan}
      />
    </>
  )
}
