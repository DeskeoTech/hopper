"use client"

import { X, ImageIcon, MapPin } from "lucide-react"
import { useClientLayout, type SiteWithDetails } from "./client-layout-provider"
import { cn } from "@/lib/utils"
import type { Equipment } from "@/lib/types/database"

interface AllSitesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sites: SiteWithDetails[]
  onSiteSelect: (site: SiteWithDetails) => void
}

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

export function AllSitesModal({ open, onOpenChange, sites, onSiteSelect }: AllSitesModalProps) {
  const { isDeskeoEmployee, plan } = useClientLayout()

  // Check if expired contract banner is visible
  const showBanner = !isDeskeoEmployee && !plan

  if (!open) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      <div className={cn(
        "fixed z-50 bg-background",
        // Mobile: full screen
        "inset-0",
        showBanner && "top-[56px] sm:top-[58px]",
        // Desktop: centered modal
        "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
        "md:w-full md:max-w-2xl md:max-h-[85vh] md:rounded-[20px]"
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-4 md:rounded-t-[20px]">
          <h1 className="font-header text-xl font-bold uppercase tracking-tight">
            Tous les sites Hopper
          </h1>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          "overflow-y-auto overscroll-contain p-4",
          // Mobile heights
          showBanner ? "h-[calc(100vh-57px-56px)] sm:h-[calc(100vh-57px-58px)]" : "h-[calc(100vh-57px)]",
          // Desktop: auto height within max-height
          "md:h-auto md:max-h-[calc(85vh-64px)]"
        )}>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                onClick={() => onSiteSelect(site)}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
