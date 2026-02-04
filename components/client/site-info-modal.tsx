"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  MapPin,
  Clock,
  Wifi,
  ChevronLeft,
  ChevronRight,
  X,
  ExternalLink,
  Train,
  Copy,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClientLayout, type SiteWithDetails } from "./client-layout-provider"
import { cn } from "@/lib/utils"
import type { Equipment, TransportationStop } from "@/lib/types/database"
import { MetroLineBadge } from "@/components/ui/metro-line-badge"
import { groupTransportByStation } from "@/lib/utils/transportation"

interface SiteInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site?: SiteWithDetails | null
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

export function SiteInfoModal({ open, onOpenChange, site: siteProp }: SiteInfoModalProps) {
  const { selectedSiteWithDetails, isDeskeoEmployee, plan } = useClientLayout()

  // Check if expired contract banner is visible
  const showBanner = !isDeskeoEmployee && !plan
  const site = siteProp ?? selectedSiteWithDetails
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [copiedWifi, setCopiedWifi] = useState(false)

  // Reset photo index when site changes
  useEffect(() => {
    setCurrentPhotoIndex(0)
  }, [site?.id])

  // Reset copied state
  useEffect(() => {
    if (copiedWifi) {
      const timeout = setTimeout(() => setCopiedWifi(false), 2000)
      return () => clearTimeout(timeout)
    }
  }, [copiedWifi])

  if (!open || !site) {
    return null
  }

  const hasPhotos = site.photoUrls.length > 0
  const hasMultiplePhotos = site.photoUrls.length > 1

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % site.photoUrls.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex(
      (prev) => (prev - 1 + site.photoUrls.length) % site.photoUrls.length
    )
  }

  const copyWifiPassword = () => {
    if (site.wifiPassword) {
      navigator.clipboard.writeText(site.wifiPassword)
      setCopiedWifi(true)
    }
  }

  // Generate Google Maps URL from address
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`

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
        "md:w-full md:max-w-lg md:max-h-[85vh] md:rounded-[20px]"
      )}>
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-4 md:rounded-t-[20px]">
          <h1 className="font-header text-xl font-bold uppercase tracking-tight">
            {site.name}
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
          "overflow-y-auto overscroll-contain",
          // Mobile heights
          showBanner ? "h-[calc(100vh-57px-56px)] sm:h-[calc(100vh-57px-58px)]" : "h-[calc(100vh-57px)]",
          // Desktop: auto height within max-height
          "md:h-auto md:max-h-[calc(85vh-64px)]"
        )}>
          {/* Photo gallery */}
          <div className="relative aspect-[16/9] bg-muted mx-4 rounded-[16px] overflow-hidden">
            {hasPhotos ? (
              <>
                <img
                  src={site.photoUrls[currentPhotoIndex]}
                  alt={`${site.name} - Photo ${currentPhotoIndex + 1}`}
                  className="h-full w-full object-cover"
                />
                {hasMultiplePhotos && (
                  <>
                    <button
                      type="button"
                      onClick={prevPhoto}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-1.5  hover:bg-white transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={nextPhoto}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 backdrop-blur-sm p-1.5  hover:bg-white transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                      {site.photoUrls.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={cn(
                            "h-1.5 w-1.5 rounded-full transition-colors",
                            idx === currentPhotoIndex
                              ? "bg-white"
                              : "bg-white/50 hover:bg-white/75"
                          )}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-16 w-16 text-foreground/20" />
              </div>
            )}
          </div>

          <div className="space-y-6 p-4 pb-8">
            {/* Address */}
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <MapPin className="h-5 w-5 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium group-hover:underline">{site.address}</p>
              </div>
              <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
            </a>

            {/* Transportation */}
            {site.transportationLines && site.transportationLines.length > 0 && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                  <Train className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0 pt-2 space-y-1.5">
                  {groupTransportByStation(site.transportationLines as TransportationStop[]).map(({ station, lines }) => (
                    <div key={station} className="flex items-center gap-2">
                      <div className="flex gap-1">
                        {lines.map((line) => (
                          <MetroLineBadge key={line} line={line} size="sm" />
                        ))}
                      </div>
                      <span className="text-sm">{station}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opening Hours */}
            {(site.openingHours || (site.openingDays && site.openingDays.length > 0)) && (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                  <Clock className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0 pt-2">
                  {site.openingDays && site.openingDays.length > 0 ? (
                    <div className="space-y-1">
                      {site.openingDays.map((day) => (
                        <div key={day} className="flex items-center justify-between text-sm">
                          <span className="capitalize text-muted-foreground">{day}</span>
                          <span className="font-medium">{site.openingHours || "—"}</span>
                        </div>
                      ))}
                    </div>
                  ) : site.openingHours ? (
                    <p className="text-sm font-medium">{site.openingHours}</p>
                  ) : null}
                </div>
              </div>
            )}

            {/* WiFi */}
            {site.wifiSsid && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                  <Wifi className="h-5 w-5 text-foreground/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{site.wifiSsid}</p>
                  {site.wifiPassword && (
                    <p className="text-xs text-muted-foreground font-mono">{site.wifiPassword}</p>
                  )}
                </div>
                {site.wifiPassword && (
                  <button
                    type="button"
                    onClick={copyWifiPassword}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
                  >
                    {copiedWifi ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Instructions */}
            {site.instructions && (
              <div className="rounded-[16px] bg-foreground/5 p-4">
                <p className="text-sm whitespace-pre-wrap">{site.instructions}</p>
              </div>
            )}

            {/* Equipments */}
            {site.equipments && site.equipments.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Services
                </h3>
                <div className="flex flex-wrap gap-2">
                  {site.equipments.map((equipment) => (
                    <span
                      key={equipment}
                      className="rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium"
                    >
                      {equipmentLabels[equipment] || equipment}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
