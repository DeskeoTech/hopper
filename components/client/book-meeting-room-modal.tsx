"use client"

import { useEffect, useState } from "react"
import { Coins, ChevronLeft } from "lucide-react"
import { Dialog, DialogContentFullscreen, DialogTitle } from "@/components/ui/dialog"
import { RoomBookingContent } from "./room-booking-content"

interface BookMeetingRoomModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  companyId: string
  mainSiteId: string | null
  remainingCredits: number
  sites: Array<{ id: string; name: string }>
  userEmail?: string
  hasActivePlan?: boolean
}

function ExpiredPassBanner({ userEmail }: { userEmail: string }) {
  const handleClick = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(userEmail)}`
    window.open(url, "_blank")
  }

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer bg-[#1B1918] py-3 text-center transition-opacity hover:opacity-90 shrink-0"
    >
      <p className="whitespace-nowrap px-4 text-[10px] font-semibold text-white uppercase tracking-wide sm:text-xs">
        Votre pass Hopper a expiré, souscrivez-en un nouveau ici →
      </p>
    </div>
  )
}

export function BookMeetingRoomModal({
  open,
  onOpenChange,
  userId,
  companyId,
  mainSiteId,
  remainingCredits,
  sites,
  userEmail = "",
  hasActivePlan = true,
}: BookMeetingRoomModalProps) {
  // Key to force remount of content when modal opens
  const [contentKey, setContentKey] = useState(0)

  // Reset content when modal opens
  useEffect(() => {
    if (open) {
      setContentKey((k) => k + 1)
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContentFullscreen>
        {/* Expired pass banner */}
        {!hasActivePlan && <ExpiredPassBanner userEmail={userEmail} />}

        {/* Header */}
        <div className="shrink-0 relative flex items-center justify-between px-4 py-4 border-b border-foreground/10">
          {/* Back button - left */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1 px-3 py-2 -ml-3 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
            <span>Retour</span>
          </button>

          {/* Title - centered */}
          <DialogTitle className="absolute left-1/2 -translate-x-1/2">
            Réserver une salle
          </DialogTitle>

          {/* Credits badge - right */}
          <div className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden px-4 py-4">
          {open && (
            <RoomBookingContent
              key={contentKey}
              userId={userId}
              companyId={companyId}
              mainSiteId={mainSiteId}
              remainingCredits={remainingCredits}
              sites={sites}
              userEmail={userEmail}
              hasActivePlan={hasActivePlan}
              isModal={true}
              onClose={() => onOpenChange(false)}
              onSuccess={() => {
                // Could trigger a refresh here if needed
              }}
            />
          )}
        </div>
      </DialogContentFullscreen>
    </Dialog>
  )
}
