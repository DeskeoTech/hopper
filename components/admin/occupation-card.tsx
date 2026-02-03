"use client"

import { useState } from "react"
import { TrendingUp, ChevronRight, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SiteOccupancy {
  siteId: string
  name: string
  occupancy: number
}

interface OccupationCardProps {
  globalOccupancyRate: number
  totalBookings: number
  totalCapacity: number
  siteOccupancies: SiteOccupancy[]
}

// Composant élément de site dans la modale
function SiteOccupancyItem({
  name,
  occupancy,
  rank,
}: {
  name: string
  occupancy: number
  rank: number
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold",
            rank === 1 && "bg-yellow-100 text-yellow-700",
            rank === 2 && "bg-gray-100 text-gray-600",
            rank === 3 && "bg-orange-100 text-orange-700",
            rank > 3 && "bg-muted text-muted-foreground"
          )}
        >
          {rank}
        </span>
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="text-base font-medium">{name}</span>
        </div>
      </div>
      <span
        className={cn(
          "text-lg font-bold",
          occupancy >= 80 && "text-green-600",
          occupancy >= 50 && occupancy < 80 && "text-orange-500",
          occupancy < 50 && "text-red-500"
        )}
      >
        {occupancy}%
      </span>
    </div>
  )
}

export function OccupationCard({
  globalOccupancyRate,
  totalBookings,
  totalCapacity,
  siteOccupancies,
}: OccupationCardProps) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full h-full text-left rounded-[20px] bg-card p-5 sm:p-6 transition-all hover:shadow-md group">
          <div className="flex items-center gap-2">
            <h2 className="type-h3 text-foreground">Occupation</h2>
            <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Taux de présence cette semaine
          </p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="font-header text-4xl sm:text-5xl">{globalOccupancyRate}%</span>
            {globalOccupancyRate > 0 && (
              <span className="text-green-600 text-base font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-0.5" />
                actif
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {totalBookings} / {totalCapacity} places disponibles
          </p>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-header text-xl">
            Occupation par site
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Taux de présence cette semaine par site
          </p>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {siteOccupancies.length > 0 ? (
            <div className="space-y-1">
              {siteOccupancies.map((site, index) => (
                <SiteOccupancyItem
                  key={site.siteId}
                  name={site.name}
                  occupancy={site.occupancy}
                  rank={index + 1}
                />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée d'occupation disponible
            </p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Taux global
            </span>
            <span className="font-header text-xl">{globalOccupancyRate}%</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
