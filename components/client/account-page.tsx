"use client"

import { useState } from "react"
import { Building2, ChevronLeft, ChevronRight, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { QuickActionCards } from "./dashboard/quick-action-cards"
import { SitesListSection } from "./dashboard/sites-list-section"
import { UserBookingsSection } from "./user-bookings-section"
import { ContractsListSection } from "./contracts-list-section"
import { NewsCard } from "./news-card"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails, ContractForDisplay, NewsPostWithSite } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
  contracts: ContractForDisplay[]
  posts: NewsPostWithSite[]
  isAdmin: boolean
}

export function AccountPage({ bookings, contracts, posts, isAdmin }: AccountPageProps) {
  const { user, selectedSiteWithDetails } = useClientLayout()
  const [activeTab, setActiveTab] = useState<"reservations" | "actualites">("reservations")
  const [newsPage, setNewsPage] = useState(0)
  const NEWS_PER_PAGE = 4
  const totalNewsPages = Math.ceil(posts.length / NEWS_PER_PAGE)
  const visiblePosts = posts.slice(newsPage * NEWS_PER_PAGE, (newsPage + 1) * NEWS_PER_PAGE)

  // Fixed banner image - always the same coworking panoramic
  const siteImageUrl = "https://res.cloudinary.com/dhzxgl5eb/image/upload/v1769636196/DESKEO_VICTOIRE_-_LA_CASA_DESKEO_-_RDC_front_-_8_hg0jrt.jpg"

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
            {/* Top gradient + blur effect (header transition) */}
            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background via-background/40 to-transparent" />
            <div className="absolute inset-x-0 top-0 h-12 backdrop-blur-[2px] bg-gradient-to-b from-background/60 to-transparent" />
            {/* Bottom gradient overlay */}
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

      {/* Content */}
      <div className="relative z-10 mx-auto w-full max-w-3xl space-y-6 px-4 md:px-0 mt-4 pb-12">
        {/* Quick Actions (includes site info button) */}
        <QuickActionCards />

        {/* Reservations & News - tabs */}
        <section className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("reservations")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
                activeTab === "reservations"
                  ? "bg-[#1B1918] text-white"
                  : "bg-foreground/5 text-foreground"
              )}
            >
              Réservations
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("actualites")}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-colors",
                activeTab === "actualites"
                  ? "bg-[#1B1918] text-white"
                  : "bg-foreground/5 text-foreground"
              )}
            >
              Actualités
            </button>
          </div>

          {activeTab === "reservations" && (
            <UserBookingsSection bookings={bookings} userId={user.id} />
          )}

          {activeTab === "actualites" && (
            posts.length > 0 ? (
              <div className="space-y-3">
                {visiblePosts.map((post) => (
                  <NewsCard key={post.id} post={post} variant="full" />
                ))}

                {totalNewsPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setNewsPage((p) => Math.max(0, p - 1))}
                      disabled={newsPage === 0}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10 disabled:opacity-30 disabled:hover:bg-foreground/5"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {newsPage + 1} / {totalNewsPages}
                    </span>
                    <button
                      type="button"
                      onClick={() => setNewsPage((p) => Math.min(totalNewsPages - 1, p + 1))}
                      disabled={newsPage >= totalNewsPages - 1}
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10 disabled:opacity-30 disabled:hover:bg-foreground/5"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-[16px] bg-card p-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
                  <Newspaper className="h-7 w-7 text-foreground/40" />
                </div>
                <p className="mt-4 text-base text-muted-foreground">Aucune actualité pour le moment</p>
              </div>
            )
          )}
        </section>

        {/* Contracts list - only visible for admins */}
        {isAdmin && (
          <ContractsListSection contracts={contracts} />
        )}

        {/* Sites List */}
        <SitesListSection />
      </div>
    </div>
  )
}
