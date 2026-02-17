"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { PublicHeader } from "@/components/public/public-header"
import { SitesList } from "./sites-list"
import { SitesMapView } from "./sites-map-view"
import { BookingDialog, BOOKING_STATE_KEY, type SavedBookingState } from "./booking-dialog"
import { SiteDetailsDialog } from "./site-details-dialog"
import { PaymentSuccessModal } from "./payment-success-modal"
import { MobileToggle } from "./mobile-toggle"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useTranslations } from "next-intl"
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
  const t = useTranslations("reservation")
  const [selectedCity, setSelectedCity] = useState<"paris" | "lyon" | null>("paris")
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null)
  const [selectedSite, setSelectedSite] = useState<SiteWithPhotos | null>(null)
  const [bookingDialogOpen, setBookingDialogOpen] = useState(false)
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
  const [mobileView, setMobileView] = useState<"list" | "map">("list")
  const [paymentSuccessOpen, setPaymentSuccessOpen] = useState(false)
  const [restoredBookingState, setRestoredBookingState] = useState<SavedBookingState | null>(null)

  const customerEmail = searchParams.get("email_user") || undefined

  // Handle success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

    // Preserve email_user when cleaning URL params
    const emailParam = customerEmail ? `?email_user=${encodeURIComponent(customerEmail)}` : ""
    const cleanUrl = `/reservation${emailParam}`

    if (success === "true") {
      setPaymentSuccessOpen(true)
      localStorage.removeItem(BOOKING_STATE_KEY)
      window.history.replaceState({}, "", cleanUrl)
    } else if (canceled === "true") {
      // Restore booking state from localStorage
      try {
        const saved = localStorage.getItem(BOOKING_STATE_KEY)
        if (saved) {
          const state: SavedBookingState = JSON.parse(saved)
          const site = initialSites.find((s) => s.id === state.siteId)
          if (site) {
            setSelectedSite(site)
            setRestoredBookingState(state)
            setBookingDialogOpen(true)
          }
          localStorage.removeItem(BOOKING_STATE_KEY)
        }
      } catch {
        // Ignore parse errors
      }
      toast.info(t("toast.paymentCanceled"))
      window.history.replaceState({}, "", cleanUrl)
    }
  }, [searchParams, initialSites, customerEmail])

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
        customerEmail={customerEmail}
        initialState={restoredBookingState}
      />

      {/* Payment Success Modal */}
      <PaymentSuccessModal
        open={paymentSuccessOpen}
        onOpenChange={setPaymentSuccessOpen}
        userEmail={customerEmail}
      />
    </div>
  )
}
