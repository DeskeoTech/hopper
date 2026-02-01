"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface SiteForecast {
  siteId: string
  siteName: string
  occupancyRate: number
  bookedCount: number
  totalCapacity: number
}

interface ForecastPeriod {
  label: string
  shortLabel: string
  sites: SiteForecast[]
  globalOccupancy: number
}

interface ForecastCardProps {
  periods: ForecastPeriod[]
}

function PaginationDots({
  total,
  current,
  onChange,
}: {
  total: number
  current: number
  onChange: (index: number) => void
}) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          onClick={() => onChange(index)}
          className={cn(
            "w-2.5 h-2.5 rounded-full transition-all",
            index === current
              ? "bg-brand w-6"
              : "bg-muted hover:bg-muted-foreground/30"
          )}
          aria-label={`Page ${index + 1}`}
        />
      ))}
    </div>
  )
}

export function ForecastCard({ periods }: ForecastCardProps) {
  const [currentPeriodIndex, setCurrentPeriodIndex] = useState(0)
  const currentPeriod = periods[currentPeriodIndex]

  if (!currentPeriod || periods.length === 0) {
    return (
      <div className="rounded-[20px] bg-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-header text-lg uppercase tracking-wide">Prévisions</h2>
        </div>
        <p className="text-center text-muted-foreground py-8">
          Aucune donnée prévisionnelle disponible
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-[20px] bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-header text-lg uppercase tracking-wide">Prévisions</h2>
        </div>
        <span className="text-sm font-medium text-muted-foreground">
          {currentPeriod.label}
        </span>
      </div>

      {/* Taux global */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
        <div>
          <p className="text-sm text-muted-foreground">Taux de remplissage global</p>
          <p className="text-xs text-muted-foreground mt-0.5">{currentPeriod.label}</p>
        </div>
        <span
          className={cn(
            "font-header text-3xl",
            currentPeriod.globalOccupancy >= 80 && "text-green-600",
            currentPeriod.globalOccupancy >= 50 && currentPeriod.globalOccupancy < 80 && "text-orange-500",
            currentPeriod.globalOccupancy < 50 && "text-red-500"
          )}
        >
          {currentPeriod.globalOccupancy}%
        </span>
      </div>

      {/* Liste des sites */}
      <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
        {currentPeriod.sites.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-border/50 hover:bg-transparent">
                <TableHead className="text-xs font-bold uppercase tracking-wide">
                  Site
                </TableHead>
                <TableHead className="text-center text-xs font-bold uppercase tracking-wide">
                  Places
                </TableHead>
                <TableHead className="text-right text-xs font-bold uppercase tracking-wide">
                  Occupation
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentPeriod.sites.map((site) => (
                <TableRow key={site.siteId} className="border-b border-border/30 hover:bg-muted/30">
                  <TableCell className="font-semibold uppercase">
                    {site.siteName}
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {site.bookedCount} / {site.totalCapacity}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-bold",
                        site.occupancyRate >= 80 && "text-green-600",
                        site.occupancyRate >= 50 && site.occupancyRate < 80 && "text-orange-500",
                        site.occupancyRate < 50 && "text-red-500"
                      )}
                    >
                      {site.occupancyRate}%
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-4">
            Aucune réservation pour cette période
          </p>
        )}
      </div>

      {/* Pagination dots */}
      {periods.length > 1 && (
        <PaginationDots
          total={periods.length}
          current={currentPeriodIndex}
          onChange={setCurrentPeriodIndex}
        />
      )}

      {/* Labels sous les dots */}
      {periods.length > 1 && (
        <div className="flex items-center justify-center gap-4 mt-2">
          {periods.map((period, index) => (
            <button
              key={index}
              onClick={() => setCurrentPeriodIndex(index)}
              className={cn(
                "text-xs transition-colors",
                index === currentPeriodIndex
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period.shortLabel}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
