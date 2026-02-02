"use client"

import {
  MapPin,
  Clock,
  Wifi,
  Train,
  ExternalLink,
  ChevronDown,
} from "lucide-react"
import { EquipmentBadge } from "@/components/admin/equipment-badge"
import { useClientLayout } from "../client-layout-provider"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function SiteInfoPanel() {
  const { selectedSiteWithDetails: site } = useClientLayout()
  const [isExpanded, setIsExpanded] = useState(false)

  if (!site) {
    return null
  }

  // Generate Google Maps URL from address
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`

  const hasInfo = site.wifiSsid || site.access || site.openingHours || (site.equipments && site.equipments.length > 0)

  if (!hasInfo) {
    return null
  }

  return (
    <div className="rounded-[20px] bg-card">
      {/* Header - clickable on mobile to expand */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between p-4 lg:cursor-default"
      >
        <h3 className="font-header text-lg font-semibold">
          Infos pratiques
        </h3>
        <ChevronDown
          className={cn(
            "h-5 w-5 text-muted-foreground transition-transform lg:hidden",
            isExpanded && "rotate-180"
          )}
        />
      </button>

      {/* Content - always visible on desktop, collapsible on mobile */}
      <div
        className={cn(
          "space-y-3 overflow-hidden px-4 pb-4 transition-all",
          // Mobile: collapsed by default
          !isExpanded && "max-h-0 pb-0 lg:max-h-none lg:pb-4"
        )}
      >
        {/* Address - Clickable to Google Maps */}
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3 transition-colors hover:bg-muted"
        >
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          <span className="flex-1 text-sm">{site.address}</span>
          <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
        </a>

        {/* Metro/Access */}
        {site.access && (
          <div className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3">
            <Train className="h-5 w-5 shrink-0 text-primary" />
            <span className="text-sm">{site.access}</span>
          </div>
        )}

        {/* Opening Hours */}
        {(site.openingHours || (site.openingDays && site.openingDays.length > 0)) && (
          <div className="flex items-start gap-3 rounded-[12px] bg-muted/50 p-3">
            <Clock className="h-5 w-5 shrink-0 text-primary mt-0.5" />
            <div className="min-w-0 flex-1 space-y-1">
              {site.openingDays && site.openingDays.length > 0 ? (
                site.openingDays.map((day) => (
                  <div key={day} className="flex items-center justify-between text-sm">
                    <span className="capitalize text-muted-foreground">{day}</span>
                    <span className="font-medium">{site.openingHours || "—"}</span>
                  </div>
                ))
              ) : site.openingHours ? (
                <p className="text-sm font-medium">{site.openingHours}</p>
              ) : null}
            </div>
          </div>
        )}

        {/* WiFi */}
        {site.wifiSsid && (
          <div className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3">
            <Wifi className="h-5 w-5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium font-mono">{site.wifiSsid}</p>
              {site.wifiPassword && (
                <p className="text-xs text-muted-foreground font-mono">{site.wifiPassword}</p>
              )}
            </div>
          </div>
        )}

        {/* Equipments */}
        {site.equipments && site.equipments.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Services
            </p>
            <div className="flex flex-wrap gap-2">
              {site.equipments.map((equipment) => (
                <EquipmentBadge key={equipment} equipment={equipment} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
