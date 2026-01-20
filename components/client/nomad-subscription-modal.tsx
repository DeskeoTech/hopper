"use client"

import { useEffect, useState } from "react"
import { Building2, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getFlexPasses } from "@/lib/actions/workspaces"
import type { SiteWithDetails } from "./client-layout-provider"
import type { FlexPassOffer } from "@/lib/types/database"
import { cn } from "@/lib/utils"

interface NomadSubscriptionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  site: SiteWithDetails
}

export function NomadSubscriptionModal({
  open,
  onOpenChange,
  site,
}: NomadSubscriptionModalProps) {
  const [passes, setPasses] = useState<FlexPassOffer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPassId, setSelectedPassId] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setLoading(true)
      setError(null)
      getFlexPasses()
        .then(({ passes, error }) => {
          if (error) {
            setError(error)
          } else {
            // Filter to only weekly and monthly passes
            const filteredPasses = passes.filter(
              (p) => p.recurrence === "weekly" || p.recurrence === "monthly"
            )
            setPasses(filteredPasses)
            // Select the first pass by default
            if (filteredPasses.length > 0) {
              setSelectedPassId(filteredPasses[0].id)
            }
          }
        })
        .finally(() => setLoading(false))
    }
  }, [open])

  const formatPrice = (price: number | null) => {
    if (price === null) return "Prix sur demande"
    return `${price.toLocaleString("fr-FR")} \u20ac`
  }

  const formatRecurrence = (recurrence: string | null) => {
    switch (recurrence) {
      case "weekly":
        return "/ semaine"
      case "monthly":
        return "/ mois"
      default:
        return ""
    }
  }

  const formatPassName = (name: string) => {
    // Remove " NOMAD" suffix for cleaner display
    return name.replace(/ NOMAD$/i, "")
  }

  const handleSubscribe = () => {
    // Placeholder for Stripe integration
    alert(
      "La fonctionnalite de paiement sera bientot disponible. Contactez-nous pour reserver."
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">
            Acceder a {site.name}
          </DialogTitle>
          <DialogDescription>
            Pour acceder a ce site, vous devez souscrire a un pass nomad.
          </DialogDescription>
        </DialogHeader>

        {/* Site preview */}
        <div className="overflow-hidden rounded-xl border border-foreground/10">
          <div className="relative aspect-[3/1] bg-muted">
            {site.imageUrl ? (
              <img
                src={site.imageUrl}
                alt={site.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Building2 className="h-8 w-8 text-foreground/20" />
              </div>
            )}
          </div>
          <div className="p-3">
            <h4 className="font-semibold">{site.name}</h4>
            <p className="text-sm text-muted-foreground">{site.address}</p>
          </div>
        </div>

        {/* Pass options */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Choisissez votre pass</h4>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg bg-destructive/10 p-4 text-center text-sm text-destructive">
              {error}
            </div>
          ) : passes.length === 0 ? (
            <div className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
              Aucun pass disponible pour le moment.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {passes.map((pass) => (
                <button
                  key={pass.id}
                  type="button"
                  onClick={() => setSelectedPassId(pass.id)}
                  className={cn(
                    "rounded-xl border-2 p-4 text-left transition-all",
                    selectedPassId === pass.id
                      ? "border-primary bg-primary/5"
                      : "border-foreground/10 hover:border-foreground/20"
                  )}
                >
                  <div className="text-sm font-medium text-muted-foreground">
                    Pass {formatPassName(pass.name)}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold">
                      {formatPrice(pass.pricePerSeatMonth)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatRecurrence(pass.recurrence)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => onOpenChange(false)}
          >
            Annuler
          </Button>
          <Button
            className="flex-1"
            onClick={handleSubscribe}
            disabled={!selectedPassId || loading}
          >
            Souscrire
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
