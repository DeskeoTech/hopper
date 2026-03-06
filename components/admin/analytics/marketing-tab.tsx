"use client"

import { Megaphone } from "lucide-react"

export function MarketingTab() {
  return (
    <div className="rounded-[20px] bg-card p-8 sm:p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto mb-4">
        <Megaphone className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-header text-xl uppercase tracking-wide mb-2">Vue Marketing</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Réservations par source de provenance, taux d&apos;annulation détaillé et analyse des conversions.
      </p>
      <span className="inline-block mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted px-3 py-1 rounded-full">
        Bientôt disponible
      </span>
    </div>
  )
}
