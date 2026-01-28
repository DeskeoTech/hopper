"use client"

import { useState } from "react"
import { UserBar } from "@/components/user-bar"
import { UserProfileCard } from "./user-profile-card"
import { UserBookingsSection } from "./user-bookings-section"
import { AdminAccessButton } from "./admin-access-button"
import { UserCreditsCard } from "./user-credits-card"
import { UserPlanCard } from "./user-plan-card"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { WorkspaceBookingSection } from "./workspace-booking-section"
import type { User, BookingWithDetails, UserCredits, UserPlan } from "@/lib/types/database"

interface ClientHomePageProps {
  user: User & { companies: { id: string; name: string | null; main_site_id: string | null } | null }
  bookings: BookingWithDetails[]
  isAdmin: boolean
  credits: UserCredits | null
  plan: UserPlan | null
  sites: Array<{ id: string; name: string }>
  mainSiteId: string | null
}

export function ClientHomePage({
  user,
  bookings,
  isAdmin,
  credits,
  plan,
  sites,
  mainSiteId,
}: ClientHomePageProps) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserBar userEmail={user.email} />

      <main className="flex flex-1 flex-col items-center p-4 md:p-6">
        <div className="w-full max-w-3xl space-y-6">
          <div className="text-center">
            <h1 className="type-h2 text-foreground">Mon espace</h1>
            <p className="mt-2 type-body text-muted-foreground">
              Bienvenue sur votre espace client Hopper
            </p>
          </div>

          {isAdmin && <AdminAccessButton />}

          <UserProfileCard user={user} />

          <UserPlanCard plan={plan} />

          <UserCreditsCard />

          <WorkspaceBookingSection
            userId={user.id}
            companyId={user.company_id || ""}
            mainSiteId={mainSiteId}
            sites={sites}
          />

          <UserBookingsSection bookings={bookings} userId={user.id} />

          <BookMeetingRoomModal
            open={bookingModalOpen}
            onOpenChange={setBookingModalOpen}
            userId={user.id}
            companyId={user.company_id || ""}
            mainSiteId={mainSiteId}
            remainingCredits={credits?.remaining || 0}
            sites={sites}
          />
        </div>
      </main>
    </div>
  )
}
