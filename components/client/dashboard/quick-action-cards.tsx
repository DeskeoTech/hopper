"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useClientLayout } from "../client-layout-provider"
import { BookMeetingRoomModal } from "../book-meeting-room-modal"
import { AdminContactDialog } from "../admin-contact-dialog"

interface ActionCardProps {
  title: string
  description?: string
  buttonText: string
  onClick: () => void
}

function ActionCard({ title, description, buttonText, onClick }: ActionCardProps) {
  return (
    <div className="rounded-[16px] bg-card p-5 sm:p-6 flex items-center gap-3 sm:flex-col sm:items-stretch sm:gap-0">
      <div className="flex-1 min-w-0 sm:flex-initial">
        <h3 className="font-header text-base sm:text-lg font-bold uppercase tracking-tight">{title}</h3>
        {description && (
          <p className="mt-1 sm:mt-1.5 text-xs sm:text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="hidden sm:block flex-1 min-h-4" />
      <Button
        onClick={onClick}
        size="sm"
        className="shrink-0 w-[120px] sm:w-auto sm:mx-auto rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 uppercase text-xs sm:text-sm font-semibold tracking-wide h-10 sm:h-11 px-4 sm:px-8"
      >
        {buttonText}
      </Button>
    </div>
  )
}

export function QuickActionCards() {
  const { user, credits, allSites, plan, mainSiteId, isAdmin, companyAdmin } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)
  const [adminDialogAction, setAdminDialogAction] = useState<"credits" | "desk">("credits")

  const handleBookDesk = () => {
    if (!isAdmin) {
      setAdminDialogAction("desk")
      setAdminDialogOpen(true)
      return
    }
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  const handleBuyCredits = () => {
    if (!isAdmin) {
      setAdminDialogAction("credits")
      setAdminDialogOpen(true)
      return
    }
    const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
    window.open(stripeUrl, "_blank")
  }

  return (
    <>
      {/* Action cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ActionCard
          title="Acheter des crédits"
          description="Rechargez votre compte"
          buttonText="Acheter"
          onClick={handleBuyCredits}
        />
        <ActionCard
          title="Réserver une salle"
          description="Réservez une salle de réunion"
          buttonText="Réserver"
          onClick={() => setBookingModalOpen(true)}
        />
        <ActionCard
          title="Réserver un poste"
          description="À la journée, à la semaine ou au mois"
          buttonText="Réserver"
          onClick={handleBookDesk}
        />
      </div>

      {/* Booking Modal */}
      <BookMeetingRoomModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        userId={user.id}
        companyId={user.company_id || ""}
        mainSiteId={mainSiteId}
        remainingCredits={credits?.remaining || 0}
        sites={allSites}
        userEmail={user.email || ""}
        hasActivePlan={!!plan}
      />

      {/* Admin Contact Dialog for non-admin users */}
      <AdminContactDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        admin={companyAdmin}
        actionType={adminDialogAction}
      />
    </>
  )
}
