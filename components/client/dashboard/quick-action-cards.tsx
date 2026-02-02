"use client"

import { useState } from "react"
import { Users, Wifi, Copy, Check, ChevronDown, MapPin, Clock, Train, ExternalLink, Building2, Paintbrush } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClientLayout } from "../client-layout-provider"
import { BookMeetingRoomModal } from "../book-meeting-room-modal"
import { cn } from "@/lib/utils"
import type { Equipment } from "@/lib/types/database"

// Action card images
const ROOM_IMAGE = "https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&h=300&fit=crop"
const CREDITS_IMAGE = "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop"

// Equipment labels in French
const equipmentLabels: Record<Equipment, string> = {
  barista: "Barista",
  stationnement_velo: "Local vélo",
  impression: "Imprimante",
  douches: "Douches",
  salle_sport: "Salle de sport",
  terrasse: "Terrasse",
  rooftop: "Rooftop",
}

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
    <div className="relative overflow-hidden rounded-[16px] flex flex-col">
      {/* Image - background */}
      <div className="aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Content - overlapping the image */}
      <div className="relative -mt-[50%] mx-3 mb-3 rounded-[12px] bg-card p-4 flex flex-col flex-1">
        <h3 className="font-header text-base font-bold uppercase tracking-tight">{title}</h3>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="flex-1 min-h-2" />
        <Button
          onClick={onClick}
          size="sm"
          className="mt-4 rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 uppercase text-xs font-semibold tracking-wide h-9 px-5"
        >
          {buttonText}
        </Button>
      </div>
    </div>
  )
}

export function QuickActionCards() {
  const { user, credits, sites, selectedSiteId, selectedSiteWithDetails, plan } = useClientLayout()
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [siteInfoExpanded, setSiteInfoExpanded] = useState(false)
  const [copiedWifi, setCopiedWifi] = useState(false)

  const handleBookDesk = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  const handleBuyCredits = () => {
    const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
    window.open(stripeUrl, "_blank")
  }

  const copyWifiPassword = () => {
    if (selectedSiteWithDetails?.wifiPassword) {
      navigator.clipboard.writeText(selectedSiteWithDetails.wifiPassword)
      setCopiedWifi(true)
      setTimeout(() => setCopiedWifi(false), 2000)
    }
  }

  // Get site image for the desk card
  const siteImage = selectedSiteWithDetails?.imageUrl || selectedSiteWithDetails?.photoUrls?.[0] || ROOM_IMAGE

  // Google Maps URL
  const googleMapsUrl = selectedSiteWithDetails?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedSiteWithDetails.address)}`
    : null

  // Check if there's additional info to show in dropdown
  const hasAdditionalInfo = selectedSiteWithDetails && (
    selectedSiteWithDetails.address ||
    selectedSiteWithDetails.access ||
    selectedSiteWithDetails.openingHours ||
    (selectedSiteWithDetails.openingDays && selectedSiteWithDetails.openingDays.length > 0) ||
    selectedSiteWithDetails.instructions ||
    (selectedSiteWithDetails.equipments && selectedSiteWithDetails.equipments.length > 0)
  )

  return (
    <>
      {/* Action cards grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
        <ActionCard
          image={CREDITS_IMAGE}
          title="Acheter des crédits"
          description="Rechargez votre compte pour vos prochaines réservations"
          buttonText="Acheter"
          onClick={handleBuyCredits}
        />
      </div>

      {/* Deskeo services */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => window.open("https://www.deskeo.com/fr/work-spaces/", "_blank")}
          className="flex items-center gap-3 rounded-[16px] bg-card p-4 text-left transition-colors hover:bg-card/80"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Building2 className="h-5 w-5 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-header text-sm font-semibold uppercase tracking-tight">
              Réserver un bureau opéré
            </h4>
            <p className="text-xs text-muted-foreground">
              Espaces de travail clé en main
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
        <button
          type="button"
          onClick={() => window.open("https://www.deskeo.com/fr/design-build/", "_blank")}
          className="flex items-center gap-3 rounded-[16px] bg-card p-4 text-left transition-colors hover:bg-card/80"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Paintbrush className="h-5 w-5 text-foreground/70" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-header text-sm font-semibold uppercase tracking-tight">
              Aménager vos bureaux
            </h4>
            <p className="text-xs text-muted-foreground">
              Design & Build sur mesure
            </p>
          </div>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      {/* Site info section */}
      <div className="space-y-3">
        <h3 className="font-header text-sm font-semibold uppercase tracking-tight text-muted-foreground">
          Infos utiles
        </h3>
        <div className="rounded-[16px] bg-card overflow-hidden">
        {/* WiFi info row with "Voir toutes les infos" button */}
        <div className="flex items-center gap-3 p-4">
          {/* WiFi icon */}
          {selectedSiteWithDetails?.wifiSsid && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
              <Wifi className="h-5 w-5 text-foreground/70" />
            </div>
          )}

          {/* WiFi info + copy button */}
          {selectedSiteWithDetails?.wifiSsid && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{selectedSiteWithDetails.wifiSsid}</p>
              {selectedSiteWithDetails.wifiPassword && (
                <div className="flex items-center gap-1.5">
                  <p className="text-xs text-muted-foreground font-mono">{selectedSiteWithDetails.wifiPassword}</p>
                  <button
                    type="button"
                    onClick={copyWifiPassword}
                    className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-foreground/10 transition-colors"
                  >
                    {copiedWifi ? (
                      <Check className="h-3 w-3 text-green-500" />
                    ) : (
                      <Copy className="h-3 w-3 text-muted-foreground" />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Voir toutes les infos button - aligned right */}
          {hasAdditionalInfo && (
            <button
              type="button"
              onClick={() => setSiteInfoExpanded(!siteInfoExpanded)}
              className="flex items-center gap-1 text-xs font-medium text-foreground/70 hover:text-foreground transition-colors shrink-0"
            >
              <span>Voir toutes les infos</span>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 transition-transform duration-200",
                siteInfoExpanded && "rotate-180"
              )} />
            </button>
          )}
        </div>

        {/* Expanded content */}
        {hasAdditionalInfo && (
          <div className={cn(
              "overflow-hidden transition-all duration-200",
              siteInfoExpanded ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="space-y-4 px-4 pb-4">
                {/* Address */}
                {selectedSiteWithDetails.address && googleMapsUrl && (
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 group"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                      <MapPin className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium group-hover:underline">{selectedSiteWithDetails.address}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </a>
                )}

                {/* Metro/Access */}
                {selectedSiteWithDetails.access && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                      <Train className="h-5 w-5 text-foreground/70" />
                    </div>
                    <p className="text-sm">{selectedSiteWithDetails.access}</p>
                  </div>
                )}

                {/* Opening Hours */}
                {(selectedSiteWithDetails.openingHours || (selectedSiteWithDetails.openingDays && selectedSiteWithDetails.openingDays.length > 0)) && (
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                      <Clock className="h-5 w-5 text-foreground/70" />
                    </div>
                    <div className="flex-1 min-w-0 pt-2">
                      {selectedSiteWithDetails.openingDays && selectedSiteWithDetails.openingDays.length > 0 ? (
                        <div className="space-y-1">
                          {selectedSiteWithDetails.openingDays.map((day) => (
                            <div key={day} className="flex items-center justify-between text-sm">
                              <span className="capitalize text-muted-foreground">{day}</span>
                              <span className="font-medium">{selectedSiteWithDetails.openingHours || "—"}</span>
                            </div>
                          ))}
                        </div>
                      ) : selectedSiteWithDetails.openingHours ? (
                        <p className="text-sm font-medium">{selectedSiteWithDetails.openingHours}</p>
                      ) : null}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selectedSiteWithDetails.instructions && (
                  <div className="rounded-[12px] bg-foreground/5 p-3">
                    <p className="text-sm whitespace-pre-wrap">{selectedSiteWithDetails.instructions}</p>
                  </div>
                )}

                {/* Equipments */}
                {selectedSiteWithDetails.equipments && selectedSiteWithDetails.equipments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Services
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSiteWithDetails.equipments.map((equipment) => (
                        <span
                          key={equipment}
                          className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium"
                        >
                          {equipmentLabels[equipment] || equipment}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
        )}
        </div>
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
    </>
  )
}
