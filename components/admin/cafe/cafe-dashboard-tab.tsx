"use client"

import { useMemo, useState } from "react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { CafeDashboardDay } from "@/lib/actions/cafe"

// Consistent colors for beverages
const BEVERAGE_COLORS: Record<string, string> = {
  "Espresso": "#78350f",
  "Allongé": "#92400e",
  "Americano": "#a16207",
  "Double": "#854d0e",
  "Cappuccino": "#b45309",
  "Latte": "#d97706",
  "Flat white": "#f59e0b",
  "Chocolat": "#7c2d12",
  "Thé": "#15803d",
  "Infusion": "#166534",
  "Thé glacé du jour": "#059669",
  "Chaï Latte": "#be185d",
  "Matcha Latte": "#4ade80",
  "Golden Latte": "#eab308",
  "Ube Latte": "#7c3aed",
  "Jus de fruits": "#ea580c",
  "Jus pressé minute": "#f97316",
  "Jus detox du jour": "#84cc16",
  "Détox Minute": "#65a30d",
  "Sirop": "#ec4899",
  "Lait amande": "#fbbf24",
  "Lait avoine": "#fcd34d",
  "Lait coco": "#fde68a",
  "Lait soja": "#fef3c7",
  "Autre": "#9ca3af",
}

function getBeverageColor(name: string, index: number): string {
  if (BEVERAGE_COLORS[name]) return BEVERAGE_COLORS[name]
  const fallback = ["#6366f1", "#8b5cf6", "#a78bfa", "#c084fc", "#e879f9", "#f472b6", "#fb7185", "#f87171"]
  return fallback[index % fallback.length]
}

type Period = "7" | "14" | "30"

interface CafeDashboardTabProps {
  data: CafeDashboardDay[]
}

export function CafeDashboardTab({ data }: CafeDashboardTabProps) {
  const [period, setPeriod] = useState<Period>("7")

  const days = parseInt(period)

  const filtered = useMemo(() => data.slice(-days), [data, days])

  // All beverage names across the period
  const allBeverages = useMemo(() => {
    const set = new Set<string>()
    filtered.forEach((d) => Object.keys(d.by_beverage).forEach((b) => set.add(b)))
    return Array.from(set).sort()
  }, [filtered])

  // Chart data: one entry per day, with a key per beverage
  const chartData = useMemo(
    () =>
      filtered.map((d) => {
        const entry: Record<string, string | number> = {
          date: formatDateShort(d.date),
          total: d.total,
        }
        allBeverages.forEach((b) => {
          entry[b] = d.by_beverage[b] || 0
        })
        return entry
      }),
    [filtered, allBeverages]
  )

  // Totals by beverage for the table
  const beverageTotals = useMemo(() => {
    const totals: Record<string, number> = {}
    filtered.forEach((d) => {
      Object.entries(d.by_beverage).forEach(([name, count]) => {
        totals[name] = (totals[name] || 0) + count
      })
    })
    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))
  }, [filtered])

  const grandTotal = beverageTotals.reduce((s, b) => s + b.count, 0)
  const avgPerDay = filtered.length > 0 ? (grandTotal / filtered.length).toFixed(1) : "0"

  return (
    <div className="space-y-6">
      {/* Period toggle + KPIs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {(["7", "14", "30"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                period === p
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {p}j
            </button>
          ))}
        </div>
        <div className="flex gap-6">
          <div className="text-right">
            <p className="text-2xl font-bold">{grandTotal}</p>
            <p className="text-xs text-muted-foreground">consommations</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">{avgPerDay}</p>
            <p className="text-xs text-muted-foreground">moy / jour</p>
          </div>
        </div>
      </div>

      {/* Stacked bar chart */}
      <div className="rounded-xl border bg-card p-4">
        <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
          Consommations par jour
        </h3>
        {grandTotal === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Aucune consommation sur cette période
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#a1a1aa" }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e5e5e5",
                  fontSize: 12,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
              />
              {allBeverages.map((bev, i) => (
                <Bar
                  key={bev}
                  dataKey={bev}
                  stackId="a"
                  fill={getBeverageColor(bev, i)}
                  radius={i === allBeverages.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Breakdown table */}
      {beverageTotals.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="px-4 pt-4">
            <h3 className="text-sm font-semibold text-muted-foreground">
              Détail par boisson
            </h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Boisson</TableHead>
                  <TableHead className="text-right">Quantité</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">% du total</TableHead>
                  <TableHead className="hidden sm:table-cell" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {beverageTotals.map((bev, i) => {
                  const pct = grandTotal > 0 ? (bev.count / grandTotal) * 100 : 0
                  return (
                    <TableRow key={bev.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: getBeverageColor(bev.name, i) }}
                          />
                          <span className="text-sm font-medium">{bev.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-medium">
                        {bev.count}
                      </TableCell>
                      <TableCell className="hidden text-right text-sm text-muted-foreground sm:table-cell">
                        {pct.toFixed(1)}%
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: getBeverageColor(bev.name, i),
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDateShort(dateStr: string): string {
  const [, m, d] = dateStr.split("-")
  return `${d}/${m}`
}
