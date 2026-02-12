"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Check, TrendingDown } from "lucide-react"

interface PricingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectPass?: (passType: "day" | "week" | "month") => void
}

const packages = [
  {
    name: "Pass Day",
    priceHT: 30,
    priceTTC: 36,
    period: "jour",
    savings: null,
    features: [
      "Accès illimité à la journée",
      "Crédits salle de réunion inclus",
      "Tous les équipements disponibles",
    ],
    highlight: false,
    passType: "day" as const,
  },
  {
    name: "Pass Week",
    priceHT: 100,
    priceTTC: 120,
    period: "semaine",
    savings: "33%",
    features: [
      "Accès illimité 5 jours",
      "Crédits salle de réunion inclus",
      "Tous les équipements disponibles",
      "Économisez 50€ vs Day Pass",
    ],
    highlight: true,
    passType: "week" as const,
  },
  {
    name: "Pass Month",
    priceHT: 300,
    priceTTC: 360,
    period: "mois",
    savings: "50%",
    features: [
      "Accès illimité 20 jours",
      "Crédits salle de réunion inclus",
      "Tous les équipements disponibles",
      "Économisez 300€ vs Day Pass",
    ],
    highlight: false,
    passType: "month" as const,
  },
]

export function PricingModal({ open, onOpenChange, onSelectPass }: PricingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogTitle className="text-center text-3xl font-bold mb-2">
          Nos Tarifs
        </DialogTitle>
        <p className="text-center text-xl text-primary font-semibold mb-6">
          Restez plus, payez moins
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          {packages.map((pkg) => (
            <div
              key={pkg.name}
              className={`relative rounded-2xl border-2 p-6 cursor-pointer transition-all hover:shadow-lg ${
                pkg.highlight
                  ? "border-primary bg-primary/5 md:scale-105"
                  : "border-border bg-card"
              }`}
              onClick={() => {
                onSelectPass?.(pkg.passType)
                onOpenChange(false)
              }}
            >
              {pkg.savings && (
                <div className="absolute -top-3 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <TrendingDown className="h-3 w-3" />
                  -{pkg.savings}*
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">{pkg.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">
                    {pkg.priceHT}€
                  </span>
                  <span className="text-muted-foreground text-sm">HT</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {pkg.priceTTC}€ TTC
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  /{pkg.period}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {pkg.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          * Économies calculées par rapport au Pass Day. Prix HT, TVA 20% en sus.
        </p>
      </DialogContent>
    </Dialog>
  )
}
