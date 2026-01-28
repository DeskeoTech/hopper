"use client"

import { useState } from "react"
import { UserProfileCard } from "./user-profile-card"
import { UserBookingsSection } from "./user-bookings-section"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
}

export function AccountPage({ bookings }: AccountPageProps) {
  const { user, credits, sites, selectedSiteId } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pt-6">
      <UserProfileCard />

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
  )
}
