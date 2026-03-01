"use client"

import { useEffect, useRef, useMemo, useState, useCallback } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useLocale } from "next-intl"
import type { Site } from "@/lib/types/database"
import { filterByCity } from "@/lib/utils/site-filters"
import { getDeskeoMapStyle } from "@/lib/map-style"

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

function createMarkerEl(isHovered: boolean): HTMLDivElement {
  const size = isHovered ? 32 : 24
  const color = isHovered ? "#f97316" : "#000000"
  const strokeWidth = isHovered ? 3 : 2
  const radius = size / 2 - strokeWidth

  const el = document.createElement("div")
  el.style.width = `${size}px`
  el.style.height = `${size}px`
  el.style.cursor = "pointer"
  el.innerHTML = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="${color}" stroke="white" stroke-width="${strokeWidth}"/>
  </svg>`
  return el
}

export function SitesMapView({
  sites,
  hoveredSiteId,
  onHover,
  onSiteClick,
  selectedCity,
}: SitesMapViewProps) {
  const locale = useLocale()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const prevHoveredRef = useRef<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  const filteredSites = useMemo(() => {
    return filterByCity(sites, selectedCity).filter(
      (site) => site.latitude && site.longitude
    )
  }, [sites, selectedCity])

  // Stable callback refs to avoid marker re-creation
  const onSiteClickRef = useRef(onSiteClick)
  onSiteClickRef.current = onSiteClick
  const onHoverRef = useRef(onHover)
  onHoverRef.current = onHover

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current) return

    let cancelled = false

    getDeskeoMapStyle(locale).then((style) => {
      if (cancelled || !mapContainerRef.current) return

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: [2.3522, 48.8566], // Paris
        zoom: 11,
        attributionControl: false,
      })

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }))

      map.on("load", () => {
        if (!cancelled) {
          mapRef.current = map
          setIsLoaded(true)
        }
      })
    })

    return () => {
      cancelled = true
      markersRef.current.forEach((m) => m.remove())
      markersRef.current.clear()
      mapRef.current?.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
  }, [locale])

  // Update markers when sites change
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return

    // Remove old markers
    markersRef.current.forEach((m) => m.remove())
    markersRef.current.clear()

    // Add new markers
    filteredSites.forEach((site) => {
      if (!site.latitude || !site.longitude) return

      const el = createMarkerEl(false)

      el.addEventListener("click", () => onSiteClickRef.current(site))
      el.addEventListener("mouseenter", () => onHoverRef.current(site.id))
      el.addEventListener("mouseleave", () => onHoverRef.current(null))

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([site.longitude, site.latitude])
        .addTo(mapRef.current!)

      markersRef.current.set(site.id, marker)
    })
  }, [isLoaded, filteredSites])

  // Fit bounds when filtered sites change
  useEffect(() => {
    if (!isLoaded || !mapRef.current || filteredSites.length === 0) return

    const bounds = new maplibregl.LngLatBounds()
    filteredSites.forEach((site) => {
      if (site.latitude && site.longitude) {
        bounds.extend([site.longitude, site.latitude])
      }
    })

    mapRef.current.fitBounds(bounds, { padding: 40, maxZoom: 15 })
  }, [isLoaded, filteredSites])

  // Update marker appearance on hover
  useEffect(() => {
    if (!isLoaded) return

    // Reset previous
    if (prevHoveredRef.current) {
      const prev = markersRef.current.get(prevHoveredRef.current)
      if (prev) {
        prev.getElement().replaceWith(createMarkerEl(false))
        // Re-create marker with updated element
        const site = filteredSites.find((s) => s.id === prevHoveredRef.current)
        if (site && site.longitude && site.latitude && mapRef.current) {
          prev.remove()
          const el = createMarkerEl(false)
          el.addEventListener("click", () => onSiteClickRef.current(site))
          el.addEventListener("mouseenter", () =>
            onHoverRef.current(site.id)
          )
          el.addEventListener("mouseleave", () => onHoverRef.current(null))
          const newMarker = new maplibregl.Marker({ element: el })
            .setLngLat([site.longitude, site.latitude])
            .addTo(mapRef.current)
          markersRef.current.set(site.id, newMarker)
        }
      }
    }

    // Set new hovered
    if (hoveredSiteId) {
      const curr = markersRef.current.get(hoveredSiteId)
      if (curr) {
        const site = filteredSites.find((s) => s.id === hoveredSiteId)
        if (site && site.longitude && site.latitude && mapRef.current) {
          curr.remove()
          const el = createMarkerEl(true)
          el.addEventListener("click", () => onSiteClickRef.current(site))
          el.addEventListener("mouseenter", () =>
            onHoverRef.current(site.id)
          )
          el.addEventListener("mouseleave", () => onHoverRef.current(null))
          const newMarker = new maplibregl.Marker({ element: el })
            .setLngLat([site.longitude, site.latitude])
            .addTo(mapRef.current)
          markersRef.current.set(site.id, newMarker)
        }
      }
    }

    prevHoveredRef.current = hoveredSiteId
  }, [hoveredSiteId, isLoaded, filteredSites])

  return <div ref={mapContainerRef} className="h-full w-full rounded-2xl" />
}
