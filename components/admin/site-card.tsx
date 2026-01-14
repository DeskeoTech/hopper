import Link from "next/link"
import { MapPin, Wifi, Clock, Building2 } from "lucide-react"
import { StatusBadge } from "@/components/admin/status-badge"
import type { Site } from "@/lib/types/database"

interface SiteCardProps {
  site: Site
  imageUrl?: string | null
}

export function SiteCard({ site, imageUrl }: SiteCardProps) {
  return (
    <Link href={`/admin/sites/${site.id}`} className="group block">
      <article className="overflow-hidden rounded-lg bg-card transition-all">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={site.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <Building2 className="h-12 w-12 text-foreground/20" />
            </div>
          )}
          <div className="absolute right-3 top-3">
            <StatusBadge status={site.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-header text-lg text-foreground transition-colors">
            {site.name}
          </h3>

          <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="line-clamp-2">{site.address}</span>
          </div>

          {/* Meta info */}
          <div className="mt-4 flex items-center gap-4 pt-4 text-xs text-muted-foreground">
            {site.wifi_ssid && (
              <div className="flex items-center gap-1.5">
                <Wifi className="h-3.5 w-3.5" />
                <span>WiFi</span>
              </div>
            )}
            {site.opening_hours && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{site.opening_hours}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  )
}
