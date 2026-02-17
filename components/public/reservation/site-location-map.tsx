"use client"

import { useRef, useEffect } from "react"
import { mapStyles, loadGoogleMapsScript } from "@/lib/google-maps"

export function SiteLocationMap({ lat, lng }: { lat: number; lng: number }) {
  const mapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey || !mapRef.current) return

    loadGoogleMapsScript(apiKey)
      .then(() => {
        if (!mapRef.current) return

        const position = { lat, lng }
        const map = new google.maps.Map(mapRef.current, {
          center: position,
          zoom: 15,
          styles: mapStyles,
          disableDefaultUI: true,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
        })

        new google.maps.Marker({
          position,
          map,
          icon: {
            url: `data:image/svg+xml,${encodeURIComponent(`
              <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" fill="#000000" stroke="white" stroke-width="2"/>
              </svg>
            `)}`,
            scaledSize: new google.maps.Size(24, 24),
            anchor: new google.maps.Point(12, 12),
          },
        })
      })
      .catch((error) => {
        console.error("Error loading Google Maps:", error)
      })
  }, [lat, lng])

  return <div ref={mapRef} className="h-full w-full rounded-2xl" />
}
