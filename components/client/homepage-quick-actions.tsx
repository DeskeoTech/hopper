"use client"

import { useState } from "react"
import { CalendarPlus, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { SiteInfoModal } from "./site-info-modal"

export function HomepageQuickActions() {
  const { user, credits, sites, selectedSiteId, selectedSiteWithDetails, plan } = useClientLayout()

  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [siteInfoModalOpen, setSiteInfoModalOpen] = useState(false)

  const siteName = selectedSiteWithDetails?.name || "ce site"

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Réserver une salle */}
        <button
          type="button"
          onClick={() => setBookingModalOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1.5 sm:gap-2 rounded-[16px] bg-[#1B1918] p-3 sm:p-4 transition-all",
            "hover:bg-[#1B1918]/90 active:scale-[0.98]"
          )}
        >
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#F0E8DC]/10 text-[#F0E8DC]">
            <CalendarPlus className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <span className="text-center text-[11px] sm:text-xs font-medium text-[#F0E8DC] leading-tight uppercase font-sans">
            Réserver une salle
          </span>
        </button>

        {/* À propos de HOPPER (site name) */}
        <button
          type="button"
          onClick={() => setSiteInfoModalOpen(true)}
          className={cn(
            "flex flex-col items-center gap-1.5 sm:gap-2 rounded-[16px] bg-card p-3 sm:p-4 transition-all",
            "hover:bg-card/80 active:scale-[0.98]"
          )}
        >
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#1B1918]/10 text-[#1B1918]">
            <Info className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <span className="text-center text-[11px] sm:text-xs font-medium text-foreground/70 leading-tight line-clamp-2">
            À propos de {siteName}
          </span>
        </button>
      </div>

      {/* Booking Modal */}
      <BookMeetingRoomModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        userId={user.id}
        companyId={user.company_id || ""}
        mainSiteId={selectedSiteId}
        remainingCredits={credits?.remaining || 0}
        sites={sites}
        userEmail={user.email || ""}
        hasActivePlan={!!plan}
      />

      {/* Site Info Modal */}
      <SiteInfoModal
        open={siteInfoModalOpen}
        onOpenChange={setSiteInfoModalOpen}
      />
    </>
  )
}
