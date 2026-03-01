"use client"

import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibre-gl/dist/maplibre-gl.css"
import { useLocale } from "next-intl"
import { getDeskeoMapStyle } from "@/lib/map-style"

function createMarkerEl(): HTMLDivElement {
  const el = document.createElement("div")
  el.style.width = "24px"
  el.style.height = "24px"
  el.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" fill="#000000" stroke="white" stroke-width="2"/>
  </svg>`
  return el
}

export function SiteLocationMap({ lat, lng }: { lat: number; lng: number }) {
  const locale = useLocale()
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    let cancelled = false

    getDeskeoMapStyle(locale).then((style) => {
      if (cancelled || !mapContainerRef.current) return

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style,
        center: [lng, lat],
        zoom: 15,
        attributionControl: false,
        scrollZoom: false,
      })

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }))

      new maplibregl.Marker({ element: createMarkerEl() })
        .setLngLat([lng, lat])
        .addTo(map)

      mapRef.current = map
    })

    return () => {
      cancelled = true
      mapRef.current?.remove()
      mapRef.current = null
    }
  }, [lat, lng, locale])

  return <div ref={mapContainerRef} className="h-full w-full rounded-2xl" />
}
