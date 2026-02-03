import { TrendingUp, TrendingDown, FileText } from "lucide-react"
import { cn } from "@/lib/utils"

interface OfferGrowth {
  name: string
  currentCount: number
  previousCount: number
  growthRate: number
}

interface GrowthCardProps {
  globalGrowthRate: number
  newContractsThisMonth: number
  offerGrowths: OfferGrowth[]
}

function OfferGrowthItem({ offer }: { offer: OfferGrowth }) {
  const isPositive = offer.growthRate > 0
  const isNegative = offer.growthRate < 0

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <span className="text-sm font-medium">{offer.name}</span>
          <p className="text-xs text-muted-foreground">
            {offer.currentCount} actif{offer.currentCount !== 1 ? "s" : ""} ce mois
          </p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={cn(
            "text-base font-bold flex items-center justify-end gap-1",
            isPositive && "text-green-600",
            isNegative && "text-red-500",
            !isPositive && !isNegative && "text-muted-foreground"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-3.5 w-3.5" />
          ) : isNegative ? (
            <TrendingDown className="h-3.5 w-3.5" />
          ) : null}
          {offer.growthRate > 0 ? "+" : ""}
          {offer.growthRate}%
        </span>
        <p className="text-xs text-muted-foreground">
          vs {offer.previousCount} le mois dernier
        </p>
      </div>
    </div>
  )
}

export function GrowthCard({
  globalGrowthRate,
  newContractsThisMonth,
  offerGrowths,
}: GrowthCardProps) {
  const isPositive = globalGrowthRate > 0
  const isNegative = globalGrowthRate < 0

  return (
    <div className="rounded-[20px] bg-card p-5 h-full">
      <h2 className="font-header text-lg uppercase tracking-wide mb-1">Croissance</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Évolution des contrats actifs ce mois vs le mois dernier
      </p>

      {/* Liste des offres */}
      <div className="space-y-1">
        {offerGrowths.length > 0 ? (
          offerGrowths.map((offer) => (
            <OfferGrowthItem key={offer.name} offer={offer} />
          ))
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Aucune donnée de croissance disponible
          </p>
        )}
      </div>

      {/* Total */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            Croissance globale
          </span>
          <span
            className={cn(
              "font-header text-xl flex items-center gap-1",
              isPositive && "text-green-600",
              isNegative && "text-red-500"
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-4 w-4" />
            ) : isNegative ? (
              <TrendingDown className="h-4 w-4" />
            ) : null}
            {globalGrowthRate > 0 ? "+" : ""}
            {globalGrowthRate}%
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {newContractsThisMonth} nouveau{newContractsThisMonth !== 1 ? "x" : ""} contrat{newContractsThisMonth !== 1 ? "s" : ""} ce mois
        </p>
      </div>
    </div>
  )
}
