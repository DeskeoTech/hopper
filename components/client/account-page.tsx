"use client"

import { useState } from "react"
import { UserBookingsSection } from "./user-bookings-section"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { HomepageHero } from "./homepage-hero"
import { HomepageSiteSelector } from "./homepage-site-selector"
import { HomepageQuickActions } from "./homepage-quick-actions"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails, ContractForDisplay } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
  contracts: ContractForDisplay[]
}

export function AccountPage({ bookings, contracts }: AccountPageProps) {
  const { user, credits, sites, selectedSiteId, selectedSiteWithDetails, plan } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  // Only allow booking if user has an active plan
  const canBook = !!plan

  // Get the first image of the selected site
  const siteImageUrl = selectedSiteWithDetails?.imageUrl || selectedSiteWithDetails?.photoUrls?.[0] || null

  return (
    <div className="flex flex-col">
      {/* Hero Section - Full bleed on mobile, contained on desktop */}
      <div className="-mx-4 -mt-4 md:mx-0 md:mt-0">
        {/* Mobile: full bleed hero */}
        <div className="md:hidden">
          <HomepageHero
            imageUrl={siteImageUrl}
            siteName={selectedSiteWithDetails?.name}
          />
        </div>
        {/* Desktop: contained hero with rounded corners and blur effects */}
        <div className="hidden md:block">
          <div className="relative h-48 w-full overflow-hidden rounded-[20px] lg:h-56">
            {siteImageUrl ? (
              <img
                src={siteImageUrl}
                alt={selectedSiteWithDetails?.name ? `Espace ${selectedSiteWithDetails.name}` : "Espace Hopper"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <span className="text-muted-foreground">Aucune image</span>
              </div>
            )}
            {/* Top gradient + blur effect (header transition) */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background via-background/40 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-12 backdrop-blur-[2px] bg-gradient-to-b from-background/60 to-transparent rounded-t-[20px]" />
            {/* Bottom gradient + blur effect (selector transition) */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-background via-background/50 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-16 backdrop-blur-[2px] bg-gradient-to-t from-background to-transparent rounded-b-[20px]" />
          </div>
        </div>
      </div>

      {/* Content - overlaps hero slightly for smooth transition */}
      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-5 px-4 md:px-0 -mt-8 md:-mt-12">
        {/* Site Selector - shown on both mobile and desktop */}
        <HomepageSiteSelector />

        {/* Quick Actions */}
        <div>
          <h2 className="mb-3 font-header text-xl text-foreground">
            Actions rapides
          </h2>
          <HomepageQuickActions />
        </div>

        <UserBookingsSection
          bookings={bookings}
          contracts={contracts}
          userId={user.id}
          onBookClick={canBook ? () => setBookingModalOpen(true) : undefined}
          canBook={canBook}
        />

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
      </div>
    </div>
  )
}
