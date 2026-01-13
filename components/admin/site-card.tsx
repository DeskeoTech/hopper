import Link from "next/link"
import { MapPin, Users, Wifi, Clock } from "lucide-react"
import { StatusBadge } from "@/components/admin/status-badge"
import type { Site } from "@/lib/types/database"

interface SiteCardProps {
  site: Site
  resourceCount: number
}

export function SiteCard({ site, resourceCount }: SiteCardProps) {
  return (
    <Link href={`/admin/sites/${site.id}`} className="group block">
      <article className="overflow-hidden rounded-xl border border-[#1A1A1A]/10 bg-white shadow-sm transition-all hover:shadow-md hover:border-[#C5A572]/50">
        {/* Image */}
        <div className="relative h-44 overflow-hidden bg-[#1A1A1A]/5">
          <img
            src={`/placeholder.svg?height=176&width=400&query=coworking office space ${site.name}`}
            alt={site.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute right-3 top-3">
            <StatusBadge status={site.status} />
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-[#1A1A1A] group-hover:text-[#C5A572] transition-colors">
            {site.name}
          </h3>

          <div className="mt-2 flex items-start gap-2 text-sm text-[#1A1A1A]/60">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="line-clamp-2">{site.address}</span>
          </div>

          {/* Meta info */}
          <div className="mt-4 flex items-center gap-4 border-t border-[#1A1A1A]/10 pt-4 text-xs text-[#1A1A1A]/50">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span>{resourceCount} ressource(s)</span>
            </div>
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
