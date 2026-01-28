"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserProfileCard } from "./user-profile-card"
import { UserBookingsSection } from "./user-bookings-section"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { HomepageHero } from "./homepage-hero"
import { HomepageSiteSelector } from "./homepage-site-selector"
import { HomepageQuickActions } from "./homepage-quick-actions"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
}

export function AccountPage({ bookings }: AccountPageProps) {
  const { user, credits, sites, selectedSiteId, selectedSiteWithDetails, plan } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  const isUserDisabled = user.status === "disabled"
  const hasActiveContract = plan !== null
  const canBook = !isUserDisabled && hasActiveContract

  const handleBookCoworking = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  // Get the first image of the selected site
  const siteImageUrl = selectedSiteWithDetails?.imageUrl || selectedSiteWithDetails?.photoUrls?.[0] || null

  return (
    <div className="flex flex-col">
      {/* Hero Section - Full bleed on mobile */}
      <div className="-mx-4 -mt-4 md:mx-0 md:mt-0 md:hidden">
        <HomepageHero
          imageUrl={siteImageUrl}
          siteName={selectedSiteWithDetails?.name}
        />
      </div>

      {/* Content - overlaps hero slightly for smooth transition */}
      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-5 px-4 md:px-0 md:pt-6 -mt-8 md:mt-0">
        {/* Site Selector - Mobile only */}
        <div className="md:hidden">
          <HomepageSiteSelector />
        </div>

        {/* Quick Actions - Mobile only */}
        <div className="md:hidden">
          <h2 className="mb-3 font-header text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Actions rapides
          </h2>
          <HomepageQuickActions />
        </div>

        {/* User Profile Card - Desktop */}
        <div className="hidden md:block">
          <UserProfileCard />
        </div>

        {/* CTA for users without active contract */}
        {!hasActiveContract && !isUserDisabled && (
          <div className="rounded-[16px] bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <h2 className="font-header text-base sm:text-lg font-bold text-foreground">
                  Découvrez Hopper Coworking
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Votre entreprise n&apos;a pas de contrat actif. Réservez un espace de
                  coworking dès maintenant.
                </p>
              </div>
              <Button size="default" className="w-full sm:w-auto" onClick={handleBookCoworking}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Réserver
              </Button>
            </div>
          </div>
        )}

        <UserBookingsSection
          bookings={bookings}
          userId={user.id}
          onBookClick={canBook ? () => setBookingModalOpen(true) : undefined}
        />

        <BookMeetingRoomModal
          open={bookingModalOpen}
          onOpenChange={setBookingModalOpen}
          userId={user.id}
          companyId={user.company_id || ""}
          mainSiteId={selectedSiteId}
          remainingCredits={credits?.remaining || 0}
          sites={sites}
        />
      </div>
    </div>
  )
}
