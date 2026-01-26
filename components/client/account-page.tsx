"use client"

import { useState } from "react"
import Link from "next/link"
import { Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserProfileCard } from "./user-profile-card"
import { UserBookingsSection } from "./user-bookings-section"
import { UserCreditsCard } from "./user-credits-card"
import { UserPlanCard } from "./user-plan-card"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
}

export function AccountPage({ bookings }: AccountPageProps) {
  const { user, credits, plan, sites, selectedSiteId, isDeskeoEmployee } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  return (
    <div className="relative">
      {isDeskeoEmployee && (
        <div className="absolute right-0 top-0">
          <Button asChild size="sm">
            <Link href="/admin">
              <Settings className="mr-2 size-4" />
              Dashboard Deskeo
            </Link>
          </Button>
        </div>
      )}

      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="text-center pt-2">
          <h1 className="font-header text-4xl font-bold uppercase tracking-tight text-foreground">
            Mon espace
          </h1>
          <p className="mt-2 type-body text-muted-foreground">
            Bienvenue sur votre espace client Hopper
          </p>
        </div>

        <UserProfileCard user={user} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UserPlanCard plan={plan} />
          <UserCreditsCard credits={credits} />
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
      </div>
    </div>
  )
}
