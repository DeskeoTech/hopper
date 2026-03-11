import Link from "next/link"
import Image from "next/image"
import { Building2, MapPin, ChevronRight, Star, User } from "lucide-react"
import type { Site } from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface SiteCardProps {
  site: Site
  imageUrl?: string | null
  flexAvailability?: { available: number; total: number } | null
}

export function SiteCard({ site, imageUrl, flexAvailability }: SiteCardProps) {
  const isClosed = site.status !== "open"
  const availabilityDisplay = flexAvailability
    ? `${flexAvailability.available}/${flexAvailability.total} Postes`
    : null

  const contactName = [site.contact_first_name, site.contact_last_name]
    .filter(Boolean)
    .join(" ")

  return (
    <Link href={`/admin/sites/${site.id}`} className="group block">
      <article className="overflow-hidden rounded-[20px] bg-card transition-shadow hover:shadow-lg">
        {/* Image hero */}
        <div className="relative h-52 w-full overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={site.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
              className={cn(
                "object-cover transition-transform duration-500 group-hover:scale-105",
                isClosed && "grayscale"
              )}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <Building2 className="h-12 w-12 text-muted-foreground/30" />
            </div>
          )}

          {/* Overlaid badges */}
          <div className="absolute left-3 top-3 flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest shadow-sm",
                isClosed
                  ? "bg-red-500 text-white"
                  : "bg-emerald-500 text-white"
              )}
            >
              {isClosed ? "Fermé" : "Ouvert"}
            </span>
            {availabilityDisplay && (
              <span className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-foreground shadow-sm backdrop-blur">
                {availabilityDisplay}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="font-bold text-foreground leading-tight">{site.name}</h3>

          {site.address && (
            <div className="mt-2 flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-2">{site.address}</span>
            </div>
          )}

          {/* Contact + arrow */}
          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            {contactName ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-0.5">
                  <User className="h-3.5 w-3.5" />
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                </div>
                <span className="truncate">{contactName}</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground/50">Aucun responsable</span>
            )}
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40" />
          </div>
        </div>
      </article>
    </Link>
  )
}
