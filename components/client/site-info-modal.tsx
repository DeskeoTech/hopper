"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  MapPin,
  Clock,
  Wifi,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  Coins,
  DoorOpen,
  Loader2,
  ExternalLink,
  ImageIcon,
  Train,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { EquipmentBadge } from "@/components/admin/equipment-badge"
import { ResourceEquipmentBadge } from "@/components/admin/resource-equipment-badge"
import { useClientLayout, type SiteWithDetails } from "./client-layout-provider"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { cn } from "@/lib/utils"
import { getMeetingRoomsBySite } from "@/lib/actions/bookings"
import type { MeetingRoomResource } from "@/lib/types/database"

interface SiteInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: SiteWithDetails | null
}

export function SiteInfoModal({ open, onOpenChange, site: siteProp }: SiteInfoModalProps) {
  const { selectedSiteWithDetails, user, credits, sites, selectedSiteId, plan, isDeskeoEmployee } = useClientLayout()

  // Check if expired contract banner is visible
  const showBanner = !isDeskeoEmployee && !plan
  const site = siteProp ?? selectedSiteWithDetails
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [meetingRooms, setMeetingRooms] = useState<MeetingRoomResource[]>([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  // Reset photo index when site changes
  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [site?.id])

  // Fetch meeting rooms when modal opens
  useEffect(() => {
    if (open && site?.id) {
      setLoadingRooms(true)
      getMeetingRoomsBySite(site.id).then((result) => {
        setLoadingRooms(false)
        if (!result.error) {
          setMeetingRooms(result.rooms)
        }
      })
    }
  }, [open, site?.id])

  if (!open || !site) {
    return null
  }

  const hasPhotos = site.photoUrls.length > 0
  const hasMultiplePhotos = site.photoUrls.length > 1

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % site.photoUrls.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + site.photoUrls.length) % site.photoUrls.length
    )
  }

  const handleRoomClick = () => {
    setBookingModalOpen(true)
  }

  // Generate Google Maps URL from address
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`

  return (
    <>
      <div className={cn(
        "fixed inset-0 z-50 bg-background",
        showBanner && "top-[56px] sm:top-[58px]"
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-3">
          <h1 className="font-heading text-base sm:text-lg md:text-xl lg:text-2xl font-bold">
            {site.name}
          </h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-9 w-9"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className={cn(
          "overflow-y-auto overscroll-contain",
          showBanner ? "h-[calc(100vh-57px-56px)] sm:h-[calc(100vh-57px-58px)]" : "h-[calc(100vh-57px)]"
        )}>
          {/* Photo gallery */}
          <div className="relative aspect-[16/9] bg-muted">
            {hasPhotos ? (
              <>
                <img
                  src={site.photoUrls[currentPhotoIndex]}
                  alt={`${site.name} - Photo ${currentPhotoIndex + 1}`}
                  className="h-full w-full object-cover"
                />
                {hasMultiplePhotos && (
                  <>
                    <button
                      type="button"
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 shadow-md hover:bg-background"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {site.photoUrls.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={cn(
                            "h-2 w-2 rounded-full transition-colors",
                            idx === currentPhotoIndex
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
                <Building2 className="h-16 w-16 text-foreground/20" />
              </div>
            )}
          </div>

          <div className="space-y-4 p-4 pb-12">
            {/* Address - Clickable to Google Maps */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3 transition-colors hover:bg-muted"
            >
              <MapPin className="h-5 w-5 shrink-0 text-primary" />
              <span className="flex-1 text-sm">{site.address}</span>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>

            {/* Metro/Access - Right below address */}
            {site.access && (
              <div className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3">
                <Train className="h-5 w-5 shrink-0 text-primary" />
                <span className="text-sm">{site.access}</span>
              </div>
            )}

            {/* Practical Info */}
            <div className="space-y-2">
              {/* Opening Hours - One line per day */}
              {(site.openingHours || (site.openingDays && site.openingDays.length > 0)) && (
                <div className="flex items-start gap-3 rounded-[12px] bg-muted/50 p-3">
                  <Clock className="h-5 w-5 shrink-0 text-primary mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    {site.openingDays && site.openingDays.length > 0 ? (
                      site.openingDays.map((day) => (
                        <div key={day} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">{day}</span>
                          <span className="font-medium">{site.openingHours || "—"}</span>
                        </div>
                      ))
                    ) : site.openingHours ? (
                      <p className="text-sm font-medium">{site.openingHours}</p>
                    ) : null}
                  </div>
                </div>
              )}

              {/* WiFi */}
              {site.wifiSsid && (
                <div className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3">
                  <Wifi className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium font-mono">{site.wifiSsid}</p>
                    {site.wifiPassword && (
                      <p className="text-xs text-muted-foreground font-mono">{site.wifiPassword}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {site.instructions && (
                <div className="rounded-[12px] bg-muted/50 p-3">
                  <p className="text-sm whitespace-pre-wrap">{site.instructions}</p>
                </div>
              )}
            </div>

            {/* Equipments with title */}
            {site.equipments && site.equipments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground/70">Equipements et services sur place</h3>
                <div className="flex flex-wrap gap-2">
                  {site.equipments.map((equipment) => (
                    <EquipmentBadge key={equipment} equipment={equipment} />
                  ))}
                </div>
              </div>
            )}

            {/* Meeting Rooms Section - At the bottom, horizontal scroll cards */}
            <div className="pt-2">
              <h2 className="mb-3 flex items-center gap-2 font-heading text-xl font-bold">
                <DoorOpen className="h-5 w-5 text-primary" />
                Salles de réunion
              </h2>

              {loadingRooms ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : meetingRooms.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  Aucune salle disponible
                </p>
              ) : (
                <div className="-mx-4 px-4">
                  <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                    {meetingRooms.map((room) => (
                      <button
                        key={room.id}
                        type="button"
                        onClick={handleRoomClick}
                        className="w-[180px] shrink-0 overflow-hidden rounded-[16px] border bg-card text-left transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.98]"
                      >
                        {/* Room photo placeholder */}
                        <div className="relative aspect-[4/3] bg-muted">
                          <div className="flex h-full w-full items-center justify-center">
                            <ImageIcon className="h-10 w-10 text-foreground/20" />
                          </div>
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
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
