"use client"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserProfileCard } from "./user-profile-card"
import { UserBookingsSection } from "./user-bookings-section"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { useClientLayout } from "./client-layout-provider"
import type { BookingWithDetails } from "@/lib/types/database"

interface AccountPageProps {
  bookings: BookingWithDetails[]
}

export function AccountPage({ bookings }: AccountPageProps) {
  const { user, credits, sites, selectedSiteId, plan } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  const isUserDisabled = user.status === "disabled"
  const hasActiveContract = plan !== null
  const canBook = !isUserDisabled && hasActiveContract

  const handleBookCoworking = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 pt-6">
      <UserProfileCard />

      {/* CTA for users without active contract */}
      {!hasActiveContract && !isUserDisabled && (
        <div className="rounded-[16px] bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="font-header text-lg font-bold text-foreground">
                Découvrez Hopper Coworking
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Votre entreprise n&apos;a pas de contrat actif. Réservez un espace de
                coworking dès maintenant.
              </p>
            </div>
            <Button size="lg" onClick={handleBookCoworking}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Réserver de nouveau
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
  )
}
