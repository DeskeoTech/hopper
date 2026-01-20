"use client"

import { Building2 } from "lucide-react"
import type { SiteWithDetails } from "./client-layout-provider"
import { cn } from "@/lib/utils"

function DeskIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Desk surface */}
      <rect x="2" y="7" width="20" height="2" rx="0.5" />
      {/* Desk legs */}
      <line x1="5" y1="9" x2="5" y2="17" />
      <line x1="19" y1="9" x2="19" y2="17" />
      {/* Chair back */}
      <path d="M9 4 L15 4 L15 7 L9 7 Z" />
      {/* Chair seat */}
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  )
}

interface ClientSiteCardProps {
  site: SiteWithDetails
  isCurrentSite: boolean
  isMainSite: boolean
  onClick: () => void
}

export function ClientSiteCard({
  site,
  isCurrentSite,
  isMainSite,
  onClick,
}: ClientSiteCardProps) {
  const capacityDisplay = site.capacityRange
    ? site.capacityRange.min === site.capacityRange.max
      ? `${site.capacityRange.min}`
      : `${site.capacityRange.min} - ${site.capacityRange.max}`
    : null

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group block w-full text-left transition-all rounded-2xl",
        isCurrentSite && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <article className="overflow-hidden rounded-2xl bg-background border border-foreground/10">
        {/* Header with image and badges */}
        <div className="relative p-3 pb-0">
          {/* Capacity badge */}
          {capacityDisplay && (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-foreground/80 bg-background px-3 py-1.5">
              <DeskIcon className="h-5 w-5" />
              <span className="text-sm font-semibold tracking-wide">
                {capacityDisplay}
              </span>
            </div>
          )}

          {/* Status badge (current or main site) */}
          {(isCurrentSite || isMainSite) && (
            <div
              className={cn(
                "absolute left-3 top-3 z-10 rounded-full px-3 py-1.5 text-xs font-semibold",
                isCurrentSite
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isCurrentSite ? "Site actuel" : "Votre site"}
            </div>
          )}

          {/* Image */}
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            {site.imageUrl ? (
              <img
                src={site.imageUrl}
                alt={site.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Building2 className="h-12 w-12 text-foreground/20" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-3">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground">
            {site.name}
          </h3>
          <p className="mt-2 text-sm text-foreground/60">{site.address}</p>
        </div>
      </article>
    </button>
  )
}
