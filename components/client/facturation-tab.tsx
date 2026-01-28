"use client"

import { Receipt, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export function FacturationTab() {
  return (
    <div className="rounded-[16px] bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Receipt className="h-5 w-5 text-foreground/50" />
        <h2 className="text-lg font-semibold">Facturation</h2>
      </div>

      <p className="mb-6 text-muted-foreground">
        Accédez à votre espace de facturation pour consulter vos factures et
        gérer vos informations de paiement.
      </p>

      <Button disabled className="w-full sm:w-auto">
        <ExternalLink className="mr-2 h-4 w-4" />
        Accéder à mon compte facturation
      </Button>

      <p className="mt-3 text-xs text-muted-foreground">
        Cette fonctionnalité sera bientôt disponible.
      </p>
    </div>
  )
}
