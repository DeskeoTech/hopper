"use client"

import { Building2 } from "lucide-react"
import { HomepageSiteSelector } from "./homepage-site-selector"
import { QuickActionCards } from "./dashboard/quick-action-cards"
import { SitesListSection } from "./dashboard/sites-list-section"
import { UserBookingsSection } from "./user-bookings-section"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails, ContractForDisplay } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
  contracts: ContractForDisplay[]
}

export function AccountPage({ bookings, contracts }: AccountPageProps) {
  const { user, selectedSiteWithDetails } = useClientLayout()

  // Get the first image of the selected site
  const siteImageUrl = selectedSiteWithDetails?.imageUrl || selectedSiteWithDetails?.photoUrls?.[0] || null

  return (
    <div className="flex flex-col">
      {/* Hero Image - Full bleed on mobile, contained on desktop */}
      <div className="-mx-4 -mt-4 md:mx-0 md:mt-0">
        {/* Mobile: full bleed hero */}
        <div className="md:hidden">
          <div className="relative h-52 w-full overflow-hidden sm:h-60">
            {siteImageUrl ? (
              <img
                src={siteImageUrl}
                alt={selectedSiteWithDetails?.name ? `Espace ${selectedSiteWithDetails.name}` : "Espace Hopper"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Building2 className="h-16 w-16 text-muted-foreground/30" />
              </div>
            )}
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent sm:via-background/40" />
            <div className="absolute inset-x-0 bottom-0 h-12 backdrop-blur-[1px] bg-gradient-to-t from-background to-transparent sm:h-16 sm:backdrop-blur-[2px]" />
          </div>
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
                <Building2 className="h-16 w-16 text-muted-foreground/30" />
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
      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-6 px-4 md:px-0 -mt-8 md:-mt-12 pb-12">
        {/* Site Selector */}
        <HomepageSiteSelector />

        {/* Quick Actions (includes site info button) */}
        <QuickActionCards />

        {/* Upcoming Reservations */}
        <UserBookingsSection
          bookings={bookings}
          contracts={contracts}
          userId={user.id}
        />

        {/* Sites List */}
        <SitesListSection />
      </div>
    </div>
  )
}
