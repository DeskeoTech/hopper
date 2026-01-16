import Link from "next/link"
import { Building2 } from "lucide-react"
import type { Site } from "@/lib/types/database"

function DeskIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="2" y="6" width="20" height="2" rx="0.5" />
      <line x1="4" y1="8" x2="4" y2="18" />
      <line x1="20" y1="8" x2="20" y2="18" />
      <line x1="8" y1="8" x2="8" y2="14" />
      <line x1="16" y1="8" x2="16" y2="14" />
    </svg>
  )
}

interface SiteCardProps {
  site: Site
  imageUrl?: string | null
  capacityRange?: { min: number; max: number } | null
}

export function SiteCard({ site, imageUrl, capacityRange }: SiteCardProps) {
  const capacityDisplay = capacityRange
    ? capacityRange.min === capacityRange.max
      ? `${capacityRange.min}`
      : `${capacityRange.min} - ${capacityRange.max}`
    : null

  return (
    <Link href={`/admin/sites/${site.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl bg-[#f5f0e8] transition-all">
        {/* Image container */}
        <div className="relative">
          {capacityDisplay && (
            <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-full border border-foreground/20 bg-white px-3 py-1.5">
              <DeskIcon className="h-5 w-5" />
              <span className="font-medium text-sm">{capacityDisplay}</span>
            </div>
          )}

          {/* Image */}
          <div className="relative h-56 overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={site.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#e8e3db]">
                <Building2 className="h-12 w-12 text-foreground/20" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="mb-3">
            <span className="inline-block rounded-full bg-[#e8e3db] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-foreground/80">
              Bureaux privatifs
            </span>
          </div>

          <h3 className="font-bold text-xl text-foreground leading-tight">{site.name}</h3>

          <p className="mt-2 text-base text-muted-foreground">{site.address}</p>
        </div>
      </article>
    </Link>
  )
}
