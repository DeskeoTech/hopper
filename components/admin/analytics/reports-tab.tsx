"use client"

import { FileDown } from "lucide-react"

export function ReportsTab() {
  return (
    <div className="rounded-[20px] bg-card p-8 sm:p-12 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mx-auto mb-4">
        <FileDown className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="font-header text-xl uppercase tracking-wide mb-2">Rapports</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Export CSV des données clients, entreprises et réservations. Sélectionnez le type de rapport et la période.
      </p>
      <span className="inline-block mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground bg-muted px-3 py-1 rounded-full">
        Bientôt disponible
      </span>
    </div>
  )
}
