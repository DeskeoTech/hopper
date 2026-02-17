"use client"

import { useMemo } from "react"
import { SiteCard } from "./site-card"
import { filterByCity } from "@/lib/utils/site-filters"
import type { Site } from "@/lib/types/database"

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
}

interface SitesListProps {
  sites: SiteWithPhotos[]
  hoveredSiteId: string | null
  onHover: (siteId: string | null) => void
  onBook: (site: SiteWithPhotos) => void
  onViewDetails: (site: SiteWithPhotos) => void
  selectedCity: "paris" | "lyon" | null
}

export function SitesList({ sites, hoveredSiteId, onHover, onBook, onViewDetails, selectedCity }: SitesListProps) {
  const filteredSites = useMemo(() => {
    const filtered = filterByCity(sites, selectedCity)
    return [...filtered].sort((a, b) => a.name.localeCompare(b.name))
  }, [sites, selectedCity])

  if (filteredSites.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-muted-foreground">
        <p>Aucun espace disponible dans cette zone.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {filteredSites.map((site) => (
        <SiteCard
          key={site.id}
          site={site}
          isHovered={hoveredSiteId === site.id}
          onHover={onHover}
          onBook={onBook}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  )
}
