import Link from "next/link"
import { Building2 } from "lucide-react"
import type { Site } from "@/lib/types/database"
import { SiteInstructionsEditor } from "@/components/admin/sites/site-instructions-editor"
import { SiteContactEditor, type DeskeoUser } from "@/components/admin/sites/site-contact-editor"

function DeskIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Desk surface */}
      <rect x="2" y="7" width="20" height="2" rx="0.5" />
      {/* Desk legs */}
      <line x1="5" y1="9" x2="5" y2="17" />
      <line x1="19" y1="9" x2="19" y2="17" />
      {/* Chair back */}
      <path d="M9 4 L15 4 L15 7 L9 7 Z" />
      {/* Chair seat */}
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="9" y1="13" x2="15" y2="13" />
    </svg>
  )
}

interface SiteCardProps {
  site: Site
  imageUrl?: string | null
  flexAvailability?: { available: number; total: number } | null
  deskeoUsers?: DeskeoUser[]
}

export function SiteCard({ site, imageUrl, flexAvailability, deskeoUsers = [] }: SiteCardProps) {
  const availabilityDisplay = flexAvailability ? `${flexAvailability.available}/${flexAvailability.total}` : null

  return (
    <Link href={`/admin/sites/${site.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl bg-background border border-foreground/10">
        {/* Header with image and capacity badge */}
        <div className="relative">
          {/* Status badge */}
          <div className={`absolute left-3 top-3 z-10 flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            site.status === "open"
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-700"
          }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${
              site.status === "open" ? "bg-emerald-500" : "bg-red-500"
            }`} />
            {site.status === "open" ? "Ouvert" : "Fermé"}
          </div>

          {/* Flex desk availability badge */}
          {availabilityDisplay && (
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 rounded-full border border-foreground/80 bg-background px-3 py-1.5">
              <DeskIcon className="h-5 w-5" />
              <span className="font-semibold text-sm tracking-wide">{availabilityDisplay}</span>
            </div>
          )}

          {/* Full-width image */}
          <div className="relative aspect-[4/3] overflow-hidden bg-muted">
            {imageUrl ? (
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={site.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <Building2 className="h-12 w-12 text-foreground/20" />
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="p-4 pt-3">
          <div className="mb-3">
            <span className="inline-block rounded-sm bg-muted px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-foreground/70">
              Bureaux privatifs
            </span>
          </div>

          <h3 className="font-bold text-xl text-foreground leading-tight tracking-tight">{site.name}</h3>

          <p className="mt-2 text-sm text-foreground/60">{site.address}</p>

          {/* Instructions edit */}
          <div className="mt-3 flex items-center justify-between border-t border-foreground/5 pt-3">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {site.instructions ? site.instructions : "Aucune instruction"}
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <SiteInstructionsEditor
                siteId={site.id}
                siteName={site.name}
                initialInstructions={site.instructions}
                initialAccess={site.access}
              />
            </div>
          </div>

          {/* Contact edit */}
          <div className="flex items-center justify-between border-t border-foreground/5 pt-3">
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {site.contact_first_name || site.contact_last_name
                ? `${site.contact_first_name || ""} ${site.contact_last_name || ""}`.trim()
                : "Aucun contact"}
            </span>
            <div onClick={(e) => e.stopPropagation()}>
              <SiteContactEditor
                siteId={site.id}
                siteName={site.name}
                currentContactEmail={site.contact_email}
                deskeoUsers={deskeoUsers}
              />
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}
