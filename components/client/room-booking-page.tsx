"use client"

import { useState } from "react"
import { RoomBookingContent } from "./room-booking-content"
import { useClientLayout } from "./client-layout-provider"

export function RoomBookingPage() {
  const { user, credits, sites, selectedSiteId, plan } = useClientLayout()
  // Key to reset the content when "Annuler" is clicked
  const [resetKey, setResetKey] = useState(0)

  const handleReset = () => {
    setResetKey((k) => k + 1)
  }

  return (
    <div className="p-4 pb-24">
      <RoomBookingContent
        key={resetKey}
        userId={user.id}
        companyId={user.company_id || ""}
        mainSiteId={selectedSiteId}
        remainingCredits={credits?.remaining || 0}
        sites={sites}
        userEmail={user.email || ""}
        hasActivePlan={!!plan}
        isModal={true}
        onClose={handleReset}
      />
    </div>
  )
}
