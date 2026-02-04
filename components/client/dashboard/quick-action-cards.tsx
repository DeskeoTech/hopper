"use client"

import { useState } from "react"
import { ExternalLink, Building2, Paintbrush } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClientLayout } from "../client-layout-provider"
import { BookMeetingRoomModal } from "../book-meeting-room-modal"
import { AdminContactDialog } from "../admin-contact-dialog"
// Action card images
const ROOM_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop"
const CREDITS_IMAGE = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"

interface ActionCardProps {
  image: string
  title: string
  description?: string
  capacity?: number
  buttonText: string
  onClick: () => void
}

function ActionCard({ image, title, description, capacity, buttonText, onClick }: ActionCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[16px] h-[320px]">
      {/* Image - full height background */}
      <img
        src={image}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Content - positioned at bottom with fixed height */}
      <div className="absolute bottom-3 left-3 right-3 rounded-[12px] bg-card p-5 flex flex-col h-[190px]">
        <h3 className="font-header text-lg font-bold uppercase tracking-tight">{title}</h3>
        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        )}
        <div className="flex-1" />
        <Button
          onClick={onClick}
          size="sm"
          className="rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 uppercase text-sm font-semibold tracking-wide h-10 px-6"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  )
}

export function QuickActionCards() {
  const { user, credits, allSites, selectedSiteId, selectedSiteWithDetails, plan, mainSiteId, isAdmin, companyAdmin } = useClientLayout()
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

  // Get site image for the desk card
  const siteImage = selectedSiteWithDetails?.imageUrl || selectedSiteWithDetails?.photoUrls?.[0] || ROOM_IMAGE

  return (
    <>
      {/* Action cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <ActionCard
          image={CREDITS_IMAGE}
          title="Acheter des crédits"
          description="Rechargez votre compte"
          buttonText="Acheter"
          onClick={handleBuyCredits}
        />
        <ActionCard
          image={ROOM_IMAGE}
          title="Réserver une salle"
          description="Réservez une salle de réunion"
          buttonText="Réserver"
          onClick={() => setBookingModalOpen(true)}
        />
        <ActionCard
          image={siteImage}
          title="Réserver un poste"
          description="À la journée, à la semaine ou au mois"
          buttonText="Réserver"
          onClick={handleBookDesk}
        />
      </div>

      {/* Deskeo services */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => window.open("https://www.deskeo.com/fr/work-spaces/#contact_form-42134d31-70fc-48e7-8ebb-f13eb270014f", "_blank")}
          className="flex items-center gap-4 rounded-[16px] bg-card p-5 text-left transition-colors hover:bg-card/80"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Building2 className="h-6 w-6 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-header text-base font-semibold uppercase tracking-tight">
              Réserver un bureau opéré
            </h4>
            <p className="text-sm text-muted-foreground">
              Espaces de travail clé en main
            </p>
          </div>
          <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => window.open("https://www.deskeo.com/fr/design-build/", "_blank")}
          className="flex items-center gap-4 rounded-[16px] bg-card p-5 text-left transition-colors hover:bg-card/80"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Paintbrush className="h-6 w-6 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-header text-base font-semibold uppercase tracking-tight">
              Aménager vos bureaux
            </h4>
            <p className="text-sm text-muted-foreground">
              Design & Build sur mesure
            </p>
          </div>
          <ExternalLink className="h-5 w-5 shrink-0 text-muted-foreground" />
        </button>
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
