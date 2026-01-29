"use client"

import { RoomBookingContent } from "./room-booking-content"
import { useClientLayout } from "./client-layout-provider"

export function RoomBookingPage() {
  const { user, credits, sites, selectedSiteId, plan } = useClientLayout()

  return (
    <div className="px-4 pt-4 md:px-0 md:pt-6">
      <RoomBookingContent
        userId={user.id}
        companyId={user.company_id || ""}
        mainSiteId={selectedSiteId}
        remainingCredits={credits?.remaining || 0}
        allocatedCredits={credits?.allocated}
        sites={sites}
        userEmail={user.email || ""}
        hasActivePlan={!!plan}
        isModal={false}
      />
    </div>
  )
}
