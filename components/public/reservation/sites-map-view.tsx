"use client"

import { useEffect, useRef, useState, useMemo } from "react"
import type { Site } from "@/lib/types/database"

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

const mapStyles = [
  {
    featureType: "all",
    elementType: "geometry.fill",
    stylers: [{ color: "#E5E0DA" }],
  },
  {
    featureType: "all",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d8d6cc" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry.fill",
    stylers: [{ visibility: "on" }, { color: "#E0DACD" }],
  },
  {
    featureType: "poi.attraction",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.business",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "poi.medical",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d8d6cc" }],
  },
  {
    featureType: "transit",
    elementType: "all",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry.fill",
    stylers: [{ color: "#D3C9BE" }],
  },
]

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

function filterByCity(sites: SiteWithPhotos[], city: "paris" | "lyon" | null): SiteWithPhotos[] {
  if (!city) return sites

  return sites.filter((site) => {
    const address = site.address.toLowerCase()

    if (city === "paris") {
      const parisRegex = /\b75\d{3}\b/
      const idfRegex = /\b(77|78|91|92|93|94|95)\d{3}\b/
      return parisRegex.test(address) || idfRegex.test(address) || address.includes("paris")
    }

    if (city === "lyon") {
      const lyonRegex = /\b69\d{3}\b/
      return lyonRegex.test(address) || address.includes("lyon")
    }

    return true
  })
}

// Load Google Maps script dynamically
function loadGoogleMapsScript(apiKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof google !== "undefined" && google.maps) {
      resolve()
      return
    }

    const existingScript = document.getElementById("google-maps-script")
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve())
      return
    }

    const script = document.createElement("script")
    script.id = "google-maps-script"
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker&v=weekly`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Failed to load Google Maps"))
    document.head.appendChild(script)
  })
}

export function SitesMapView({
  sites,
  hoveredSiteId,
  onHover,
  onSiteClick,
  selectedCity,
}: SitesMapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
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
          mapId: "hopper-reservation-map",
        })

        googleMapRef.current = map
        setIsLoaded(true)
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error)
      })

    return () => {
      markersRef.current.forEach((marker) => (marker.map = null))
      markersRef.current.clear()
    }
  }, [])

  // Update markers when sites or hover state changes
  useEffect(() => {
    if (!isLoaded || !googleMapRef.current) return

    const map = googleMapRef.current

    // Remove old markers
    markersRef.current.forEach((marker) => (marker.map = null))
    markersRef.current.clear()

    // Add new markers
    const bounds = new google.maps.LatLngBounds()

    filteredSites.forEach((site) => {
      if (!site.latitude || !site.longitude) return

      const position = { lat: site.latitude, lng: site.longitude }
      const isHovered = site.id === hoveredSiteId

      const img = document.createElement("img")
      img.src = createMarkerSvg(isHovered)
      img.style.cursor = "pointer"
      img.style.transition = "transform 0.2s ease"
      if (isHovered) {
        img.style.transform = "scale(1.2)"
      }

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position,
        map,
        content: img,
        title: site.name,
      })

      marker.addListener("click", () => {
        onSiteClick(site)
      })

      const element = marker.element
      if (element) {
        element.addEventListener("mouseenter", () => onHover(site.id))
        element.addEventListener("mouseleave", () => onHover(null))
      }

      markersRef.current.set(site.id, marker)
      bounds.extend(position)
    })

    // Fit bounds if we have sites
    if (filteredSites.length > 0) {
      map.fitBounds(bounds)

      // Don't zoom in too much
      const listener = google.maps.event.addListener(map, "idle", () => {
        const zoom = map.getZoom()
        if (zoom && zoom > 15) {
          map.setZoom(15)
        }
        google.maps.event.removeListener(listener)
      })
    }
  }, [isLoaded, filteredSites, hoveredSiteId, onHover, onSiteClick])

  // Update marker appearance on hover
  useEffect(() => {
    if (!isLoaded) return

    markersRef.current.forEach((marker, siteId) => {
      const img = marker.content as HTMLImageElement
      if (img) {
        const isHovered = siteId === hoveredSiteId
        img.src = createMarkerSvg(isHovered)
        img.style.transform = isHovered ? "scale(1.2)" : "scale(1)"
      }
    })
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
