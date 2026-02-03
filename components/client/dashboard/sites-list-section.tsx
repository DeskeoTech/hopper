"use client"

import { useState } from "react"
import { ImageIcon, ChevronRight, MapPin } from "lucide-react"
import { useClientLayout, type SiteWithDetails } from "../client-layout-provider"
import { SiteInfoModal } from "../site-info-modal"
import { AllSitesModal } from "../all-sites-modal"
import type { Equipment } from "@/lib/types/database"

interface SiteCardProps {
  site: SiteWithDetails
  onClick: () => void
}

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

const MAX_VISIBLE_EQUIPMENTS = 4

function SiteCard({ site, onClick }: SiteCardProps) {
  const hasPhoto = site.photoUrls && site.photoUrls.length > 0
  const equipments = site.equipments || []
  const visibleEquipments = equipments.slice(0, MAX_VISIBLE_EQUIPMENTS)
  const remainingCount = equipments.length - MAX_VISIBLE_EQUIPMENTS

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-full overflow-hidden rounded-[20px] bg-background text-left border border-foreground/10 hover:border-foreground/30 transition-colors flex flex-col cursor-pointer"
    >
      {/* Image with location badge */}
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-t-[18px]">
        {hasPhoto ? (
          <img
            src={site.photoUrls[0]}
            alt={site.name}
            className="h-full w-full object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-10 w-10 text-foreground/20" />
          </div>
        )}
        {/* Address badge - bottom left */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full bg-background/90 backdrop-blur-sm px-2.5 py-1 text-xs font-medium max-w-[calc(100%-24px)]">
          <MapPin className="h-3 w-3 shrink-0" />
          <span className="truncate">{site.address}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-header text-base font-bold uppercase tracking-tight">{site.name}</h4>

        {/* Equipment tags */}
        <div className="mt-3 flex flex-wrap gap-1.5 min-h-[52px]">
          {visibleEquipments.map((equipment) => (
            <span
              key={equipment}
              className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs h-fit"
            >
              {equipmentLabels[equipment] || equipment}
            </span>
          ))}
          {remainingCount > 0 && (
            <span className="rounded-full bg-foreground/5 px-2.5 py-1 text-xs h-fit">
              +{remainingCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

export function SitesListSection() {
  const { sitesWithDetails } = useClientLayout()
  const [selectedSite, setSelectedSite] = useState<SiteWithDetails | null>(null)
  const [siteInfoModalOpen, setSiteInfoModalOpen] = useState(false)
  const [allSitesModalOpen, setAllSitesModalOpen] = useState(false)

  const handleSiteClick = (site: SiteWithDetails) => {
    setSelectedSite(site)
    setSiteInfoModalOpen(true)
  }

  const handleViewAllClick = () => {
    setAllSitesModalOpen(true)
  }

  const handleSiteSelectFromModal = (site: SiteWithDetails) => {
    setAllSitesModalOpen(false)
    setSelectedSite(site)
    setSiteInfoModalOpen(true)
  }

  // Don't render if no sites
  if (!sitesWithDetails || sitesWithDetails.length === 0) {
    return null
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-header text-xl text-foreground">Tous les sites Hopper</h2>
          {sitesWithDetails.length > 3 && (
            <button
              type="button"
              onClick={handleViewAllClick}
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Voir tous
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Sites grid */}
        <div className="-mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide md:grid md:grid-cols-2 lg:grid-cols-3 md:overflow-visible md:pb-0">
            {sitesWithDetails.slice(0, 3).map((site) => (
              <div key={site.id} className="w-[220px] shrink-0 md:w-auto">
                <SiteCard
                  site={site}
                  onClick={() => handleSiteClick(site)}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Site Info Modal */}
      <SiteInfoModal
        open={siteInfoModalOpen}
        onOpenChange={setSiteInfoModalOpen}
        site={selectedSite}
      />

      {/* All Sites Modal */}
      <AllSitesModal
        open={allSitesModalOpen}
        onOpenChange={setAllSitesModalOpen}
        sites={sitesWithDetails}
        onSiteSelect={handleSiteSelectFromModal}
      />
    </>
  )
}
