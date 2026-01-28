"use client"

import { useState } from "react"
import { Users, ChevronRight } from "lucide-react"
import { UserProfileCard } from "./user-profile-card"
import { UserBookingsSection } from "./user-bookings-section"
import { UserCreditsCard } from "./user-credits-card"
import { UserPlanCard } from "./user-plan-card"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { ManageCompanyModal } from "./manage-company-modal"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
}

export function AccountPage({ bookings }: AccountPageProps) {
  const { user, credits, plan, sites, selectedSiteId, canManageCompany } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [manageCompanyModalOpen, setManageCompanyModalOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pt-6">
        <UserProfileCard user={user} />

        {canManageCompany && (
          <button
            onClick={() => setManageCompanyModalOpen(true)}
            className="group relative w-full rounded-[16px] bg-card p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="mb-3">
              <Users className="h-6 w-6 text-foreground/30" />
            </div>
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
              Gérer mon entreprise
            </p>
            <p className="mt-1 font-medium text-foreground">
              {user.companies?.name || "Gérer les utilisateurs et les rôles"}
            </p>
            <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/30 transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UserPlanCard plan={plan} />
          <UserCreditsCard />
        </div>

        <UserBookingsSection
          bookings={bookings}
          userId={user.id}
          onBookClick={() => setBookingModalOpen(true)}
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

        {canManageCompany && user.company_id && (
          <ManageCompanyModal
            open={manageCompanyModalOpen}
            onOpenChange={setManageCompanyModalOpen}
            companyId={user.company_id}
            companyName={user.companies?.name || null}
            currentUserId={user.id}
          />
        )}
    </div>
  )
}
