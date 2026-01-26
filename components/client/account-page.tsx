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
    <div className="mx-auto w-full max-w-3xl space-y-6">
      {isDeskeoEmployee && (
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link href="/admin">
              <Settings className="mr-2 size-4" />
              Dashboard Deskeo
            </Link>
          </Button>
        </div>
      )}

      <div className="text-center">
        <h2 className="type-h2 text-foreground">Mon espace</h2>
        <p className="mt-2 type-body text-muted-foreground">
          Bienvenue sur votre espace client Hopper
        </p>
      </div>

      <UserProfileCard user={user} />

      <UserPlanCard plan={plan} />

      <UserCreditsCard
        credits={credits}
        onBookClick={() => setBookingModalOpen(true)}
      />

      <UserBookingsSection bookings={bookings} userId={user.id} />

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
  )
}
