"use client"

import { useEffect, useState } from "react"
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
        <DialogHeader className="shrink-0">
          <DialogTitle>Réserver une salle</DialogTitle>
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
