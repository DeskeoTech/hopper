"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Settings, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const { user, credits, plan, sites, selectedSiteId, isDeskeoEmployee, canManageCompany } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [manageCompanyModalOpen, setManageCompanyModalOpen] = useState(false)

  return (
    <div className="relative pt-6">
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

      {/* Logo Hopper */}
      <div className="flex justify-center mb-6">
        <Image
          src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
          alt="Hopper Logo"
          width={200}
          height={80}
          className="h-12 w-auto sm:h-16 md:h-20"
          priority
        />
      </div>

      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="text-center pt-2">
          <h1 className="type-h2 text-foreground">Mon espace</h1>
          <p className="mt-2 type-body text-muted-foreground">
            Bienvenue sur votre espace client Hopper
          </p>
        </div>

        <UserProfileCard user={user} />

        {canManageCompany && (
          <button
            onClick={() => setManageCompanyModalOpen(true)}
            className="w-full rounded-[20px] bg-card p-4 sm:p-6 text-left transition-colors hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-12 sm:w-12">
                <Users className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wide text-foreground sm:text-sm">
                  Gérer mon entreprise
                </h3>
                <p className="type-body-sm text-muted-foreground">
                  {user.companies?.name || "Gérer les utilisateurs et les rôles"}
                </p>
              </div>
            </div>
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
    </div>
  )
}
