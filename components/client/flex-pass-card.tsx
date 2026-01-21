"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import type { FlexPassOffer, PlanRecurrence } from "@/lib/types/database"

interface FlexPassCardProps {
  pass: FlexPassOffer
  siteName: string
  photoUrl: string | null
  availability: { available: number; total: number }
  onSelect: () => void
  disabled?: boolean
}

const RECURRENCE_LABELS: Record<PlanRecurrence, string> = {
  daily: "",
  weekly: " / semaine",
  monthly: " / mois",
}

function formatPrice(price: number | null): string {
  if (price === null) return "Prix sur demande"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

function formatPassName(name: string): string {
  // Simplify pass names for display
  return name
    .replace("PASS ", "Pass ")
    .replace(" NOMAD", "")
    .replace("JOURNEE", "Journee")
    .replace("SEMAINE", "Semaine")
    .replace("MENSUEL", "Mensuel")
}

export function FlexPassCard({
  pass,
  siteName,
  photoUrl,
  availability,
  onSelect,
  disabled = false,
}: FlexPassCardProps) {
  const isAvailable = availability.available > 0
  const recurrenceSuffix = pass.recurrence
    ? RECURRENCE_LABELS[pass.recurrence]
    : ""

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled || !isAvailable}
      className={cn(
        "group w-full overflow-hidden rounded-[20px] border bg-card text-left transition-all",
        isAvailable && "hover:border-primary/50 hover:-translate-y-0.5",
        !isAvailable && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Image section */}
      <div className="relative aspect-[16/9] w-full bg-muted">
        {photoUrl ? (
          <Image
            src={photoUrl}
            alt={siteName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <span className="type-body-sm">Image non disponible</span>
          </div>
        )}

      </div>

      {/* Content section */}
      <div className="p-4">
        <h4 className="type-body font-medium text-foreground">
          {formatPassName(pass.name)}
        </h4>

        <p className="mt-1 type-body-sm text-muted-foreground truncate">
          {siteName}
        </p>

        <div className="mt-3 flex items-baseline gap-1">
          <span className="type-h4 font-semibold text-foreground">
            {formatPrice(pass.pricePerSeatMonth)}
          </span>
          {recurrenceSuffix && (
            <span className="type-body-sm text-muted-foreground">
              {recurrenceSuffix}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
