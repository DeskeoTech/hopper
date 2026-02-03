"use client"

import { useEffect, useState } from "react"
import { Coins } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
      className="cursor-pointer bg-[#1B1918] py-3 text-center transition-opacity hover:opacity-90 -mx-6 -mt-6 mb-4 sm:rounded-t-[20px]"
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {!hasActivePlan && <ExpiredPassBanner userEmail={userEmail} />}
        <DialogHeader className="shrink-0">
          <div className="flex items-center justify-between pr-8">
            <DialogTitle>Réserver une salle</DialogTitle>
            <div className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5">
              <Coins className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">
                {remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
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
      </DialogContent>
    </Dialog>
  )
}
