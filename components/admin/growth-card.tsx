"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, ChevronRight, FileText } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

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
          <span className="text-base font-medium">{offer.name}</span>
          <p className="text-xs text-muted-foreground">
            {offer.currentCount} actif{offer.currentCount !== 1 ? "s" : ""} ce mois
          </p>
        </div>
      </div>
      <div className="text-right">
        <span
          className={cn(
            "text-lg font-bold flex items-center gap-1",
            isPositive && "text-green-600",
            isNegative && "text-red-500",
            !isPositive && !isNegative && "text-muted-foreground"
          )}
        >
          {isPositive ? (
            <TrendingUp className="h-4 w-4" />
          ) : isNegative ? (
            <TrendingDown className="h-4 w-4" />
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
  const [open, setOpen] = useState(false)
  const isPositive = globalGrowthRate > 0
  const isNegative = globalGrowthRate < 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full h-full text-left rounded-[20px] bg-card p-5 transition-all hover:shadow-md group">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-header text-lg uppercase tracking-wide">Croissance</h2>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          </div>
          <p className="text-[14px] text-muted-foreground uppercase font-medium mb-1">
            Contrats actifs
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-header text-[28px]">
              {globalGrowthRate > 0 ? "+" : ""}
              {globalGrowthRate}%
            </span>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : isNegative ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
          <p className="text-[13px] text-muted-foreground mt-2">
            {newContractsThisMonth} nouveau{newContractsThisMonth !== 1 ? "x" : ""} contrat{newContractsThisMonth !== 1 ? "s" : ""} ce mois
          </p>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-header text-xl">
            Croissance par offre
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Évolution des contrats actifs ce mois vs le mois dernier
          </p>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {offerGrowths.length > 0 ? (
            <div className="space-y-1">
              {offerGrowths.map((offer) => (
                <OfferGrowthItem key={offer.name} offer={offer} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée de croissance disponible
            </p>
          )}
        </div>
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
