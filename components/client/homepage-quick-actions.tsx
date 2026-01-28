"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CalendarPlus, DoorOpen, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"
import { BookMeetingRoomModal } from "./book-meeting-room-modal"
import { SiteInfoModal } from "./site-info-modal"

interface QuickAction {
  id: string
  label: string
  icon: typeof CalendarPlus
  color: string
}

const quickActions: QuickAction[] = [
  {
    id: "book",
    label: "Réserver une salle",
    icon: CalendarPlus,
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "rooms",
    label: "Les salles",
    icon: DoorOpen,
    color: "bg-green-100 text-green-600",
  },
  {
    id: "info",
    label: "Informations pratiques",
    icon: Info,
    color: "bg-orange-100 text-orange-600",
  },
]

export function HomepageQuickActions() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, credits, sites, selectedSiteId } = useClientLayout()

  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [siteInfoModalOpen, setSiteInfoModalOpen] = useState(false)

  const handleActionClick = (actionId: string) => {
    switch (actionId) {
      case "book":
        setBookingModalOpen(true)
        break
      case "rooms":
        const siteParam = searchParams.get("site")
        router.push(siteParam ? `/salles?site=${siteParam}` : "/salles")
        break
      case "info":
        setSiteInfoModalOpen(true)
        break
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {quickActions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleActionClick(action.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 sm:gap-2 rounded-[16px] border border-border bg-card p-3 sm:p-4 shadow-sm transition-all",
              "hover:shadow-md hover:border-primary/20 active:scale-[0.98]"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full",
              action.color
            )}>
              <action.icon className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <span className="text-center text-[11px] sm:text-xs font-medium text-foreground leading-tight">
              {action.label}
            </span>
          </button>
        ))}
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
      />

      {/* Site Info Modal */}
      <SiteInfoModal
        open={siteInfoModalOpen}
        onOpenChange={setSiteInfoModalOpen}
      />
    </>
  )
}
