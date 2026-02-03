"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PublicHeader } from "@/components/public/public-header"
import { SitesList } from "./sites-list"
import { SitesMapView } from "./sites-map-view"
import { BookingDialog } from "./booking-dialog"
import { SiteDetailsDialog } from "./site-details-dialog"
import { MobileToggle } from "./mobile-toggle"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Site } from "@/lib/types/database"

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
}

interface ReservationPageClientProps {
  initialSites: SiteWithPhotos[]
}

export function ReservationPageClient({ initialSites }: ReservationPageClientProps) {
  const searchParams = useSearchParams()
  const [selectedCity, setSelectedCity] = useState<"paris" | "lyon" | null>("paris")
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<SiteWithPhotos | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [mobileView, setMobileView] = useState<"list" | "map">("list")

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

    if (success === "true") {
      toast.success("Paiement réussi ! Vous recevrez un email de confirmation.")
      window.history.replaceState({}, "", "/reservation")
    } else if (canceled === "true") {
      toast.info("Paiement annulé")
      window.history.replaceState({}, "", "/reservation")
    }
  }, [searchParams])

  const handleHover = useCallback((siteId: string | null) => {
    setHoveredSiteId(siteId)
  }, [])

  const handleBook = useCallback((site: SiteWithPhotos) => {
    setSelectedSite(site)
    setDetailsDialogOpen(false)
    setBookingDialogOpen(true)
  }, [])

  const handleViewDetails = useCallback((site: SiteWithPhotos) => {
    setSelectedSite(site)
    setDetailsDialogOpen(true)
  }, [])

  const handleSiteClickOnMap = useCallback((site: SiteWithPhotos) => {
    setSelectedSite(site)
    setDetailsDialogOpen(true)
  }, [])

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <PublicHeader selectedCity={selectedCity} onCityChange={setSelectedCity} />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sites List */}
        <div
          className={cn(
            "w-full lg:w-1/2 overflow-y-auto bg-background",
            mobileView === "map" && "hidden lg:block"
          )}
        >
          <div className="p-4 md:p-5">
            <SitesList
              sites={initialSites}
              hoveredSiteId={hoveredSiteId}
              onHover={handleHover}
              onBook={handleBook}
              onViewDetails={handleViewDetails}
              selectedCity={selectedCity}
            />
          </div>
        </div>

        {/* Map View */}
        <div
          className={cn(
            "w-full lg:w-1/2 lg:block",
            mobileView === "list" && "hidden"
          )}
        >
          <SitesMapView
            sites={initialSites}
            hoveredSiteId={hoveredSiteId}
            onHover={handleHover}
            onSiteClick={handleSiteClickOnMap}
            selectedCity={selectedCity}
          />
        </div>
      </div>

      {/* Mobile Toggle */}
      <MobileToggle view={mobileView} onViewChange={setMobileView} />

      {/* Site Details Dialog */}
      <SiteDetailsDialog
        site={selectedSite}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        onBook={handleBook}
      />

      {/* Booking Dialog */}
      <BookingDialog
        site={selectedSite}
        open={bookingDialogOpen}
        onOpenChange={setBookingDialogOpen}
      />
    </div>
  )
}
