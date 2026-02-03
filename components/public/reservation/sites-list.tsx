"use client"

import { useMemo } from "react"
import { SiteCard } from "./site-card"
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

function filterByCity(sites: SiteWithPhotos[], city: "paris" | "lyon" | null): SiteWithPhotos[] {
  if (!city) return sites

  return sites.filter((site) => {
    const address = site.address.toLowerCase()

    if (city === "paris") {
      const parisRegex = /\b75\d{3}\b/
      const idfRegex = /\b(77|78|91|92|93|94|95)\d{3}\b/
      const idfCities = ["neuilly", "boulogne", "levallois", "issy", "puteaux", "courbevoie", "vincennes", "montreuil", "saint-denis", "nanterre"]
      const isInIdf = idfCities.some((c) => address.includes(c))
      return parisRegex.test(address) || idfRegex.test(address) || address.includes("paris") || isInIdf
    }

    if (city === "lyon") {
      const lyonRegex = /\b69\d{3}\b/
      return lyonRegex.test(address) || address.includes("lyon")
    }

    return true
  })
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
    <div className="grid gap-4 md:gap-5 grid-cols-1 md:grid-cols-2">
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
