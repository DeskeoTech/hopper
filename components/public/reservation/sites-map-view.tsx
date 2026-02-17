"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import type { Site } from "@/lib/types/database"
import { mapStyles, loadGoogleMapsScript } from "@/lib/google-maps"
import { filterByCity } from "@/lib/utils/site-filters"

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
}

interface SitesMapViewProps {
  sites: SiteWithPhotos[]
  hoveredSiteId: string | null
  onHover: (siteId: string | null) => void
  onSiteClick: (site: SiteWithPhotos) => void
  selectedCity: "paris" | "lyon" | null
}

function createMarkerSvg(isHovered: boolean): string {
  const size = isHovered ? 32 : 24
  const color = isHovered ? "#f97316" : "#000000"
  const strokeWidth = isHovered ? 3 : 2
  const radius = size / 2 - strokeWidth

  return `data:image/svg+xml,${encodeURIComponent(`
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
    </svg>
  `)}`
}

// Pre-compute the two possible marker SVGs to avoid recalculating on every hover
const MARKER_SVG_DEFAULT = createMarkerSvg(false)
const MARKER_SVG_HOVERED = createMarkerSvg(true)

export function SitesMapView({
  sites,
  hoveredSiteId,
  onHover,
  onSiteClick,
  selectedCity,
}: SitesMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const prevHoveredRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(true)

  const filteredSites = useMemo(() => {
    return filterByCity(sites, selectedCity).filter(
      (site) => site.latitude && site.longitude
    )
  }, [sites, selectedCity])

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      setHasApiKey(false)
      return
    }
    if (!mapRef.current) return

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current) return

        const map = new google.maps.Map(mapRef.current, {
          center: { lat: 48.8566, lng: 2.3522 }, // Paris
          zoom: 11,
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        })

        googleMapRef.current = map
        setIsLoaded(true)
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error)
      })

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null))
      markersRef.current.clear()
    }
  }, [])

  // Update markers when sites change
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return

    const map = googleMapRef.current

    // Remove old markers
    markersRef.current.forEach((marker) => marker.setMap(null))
    markersRef.current.clear()

    // Add new markers
    filteredSites.forEach((site) => {
      if (!site.latitude || !site.longitude) return

      const position = { lat: site.latitude, lng: site.longitude }

      const marker = new google.maps.Marker({
        position,
        map,
        title: site.name,
        icon: {
          url: MARKER_SVG_DEFAULT,
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        },
      })

      marker.addListener("click", () => {
        onSiteClick(site)
      })

      marker.addListener("mouseover", () => onHover(site.id))
      marker.addListener("mouseout", () => onHover(null))

      markersRef.current.set(site.id, marker)
    })
  }, [isLoaded, filteredSites, onHover, onSiteClick])

  // Center map on filtered sites only when city changes
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return
    if (filteredSites.length === 0) return

    const map = googleMapRef.current
    const bounds = new google.maps.LatLngBounds()

    filteredSites.forEach((site) => {
      if (site.latitude && site.longitude) {
        bounds.extend({ lat: site.latitude, lng: site.longitude })
      }
    })

    map.fitBounds(bounds)

    // Don't zoom in too much
    const listener = google.maps.event.addListener(map, "idle", () => {
      const zoom = map.getZoom()
      if (zoom && zoom > 15) {
        map.setZoom(15)
      }
      google.maps.event.removeListener(listener)
    })
  }, [isLoaded, filteredSites])

  // Update marker appearance on hover (only update the 2 affected markers)
  useEffect(() => {
    if (!isLoaded) return

    // Reset previous hovered marker
    if (prevHoveredRef.current) {
      const prev = markersRef.current.get(prevHoveredRef.current)
      if (prev) {
        prev.setIcon({
          url: MARKER_SVG_DEFAULT,
          scaledSize: new google.maps.Size(24, 24),
          anchor: new google.maps.Point(12, 12),
        })
      }
    }

    // Set new hovered marker
    if (hoveredSiteId) {
      const curr = markersRef.current.get(hoveredSiteId)
      if (curr) {
        curr.setIcon({
          url: MARKER_SVG_HOVERED,
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        })
      }
    }

    prevHoveredRef.current = hoveredSiteId
  }, [hoveredSiteId, isLoaded])

  if (!hasApiKey) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-2xl bg-muted/50">
        <div className="text-center p-6">
          <p className="text-muted-foreground">
            Carte non disponible
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Configurez NEXT_PUBLIC_GOOGLE_MAPS_API_KEY pour afficher la carte
          </p>
        </div>
      </div>
    )
  }

  return (
    <div ref={mapRef} className="h-full w-full rounded-2xl" />
  )
}
