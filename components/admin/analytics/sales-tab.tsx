"use client"

import { useMemo, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, ChevronLeft, ChevronRight, Download, ExternalLink, Info, Search, TrendingUp } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Input } from "@/components/ui/input"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { convertToCSV } from "@/lib/utils/csv"

// === Types ===

export interface StripePayment {
  id: string
  date: string
  amount: number
  status: "succeeded" | "pending" | "failed"
  description: string
  companyId: string
  companyName: string
  customerEmail: string | null
  refunded: boolean
  amountRefunded: number
  productId: string
  productName: string
  originalProductName: string
  companySiteId: string
  receiptUrl: string | null
  quantity: number
}

export interface AccountKpis {
  totalRevenue: number
  totalRefunded: number
  netRevenue: number
  transactionCount: number
  avgTransaction: number
}

export interface ProductKpisEntry {
  productId: string
  productName: string
  unitPrice: number | null
  kpis: AccountKpis
  totalSeats?: number
}

export interface BookingBySite {
  siteId: string
  siteName: string
  bookingCount: number
  dailyAvg: number
  dailyCapacity: number
}

export interface SalesTabProps {
  totalKpis: AccountKpis
  productKpis: ProductKpisEntry[]
  payments: StripePayment[]
  companies: { value: string; label: string }[]
  period: string
  periodMode: string
  periodStartDate: string
  periodEndDate: string
  bookings: { total: number; bySite: BookingBySite[] }
  revenueEvolution: number | null
}

// === Constants ===

const PAGE_SIZE = 20

const statusLabels: Record<string, string> = {
  succeeded: "Réussi",
  pending: "En attente",
  failed: "Échoué",
}

const statusColors: Record<string, string> = {
  succeeded: "bg-green-100 text-green-700",
  pending: "bg-amber-100 text-amber-700",
  failed: "bg-red-100 text-red-700",
}

const PRODUCT_CARD_COLORS = [
  { bg: "bg-amber-50", accent: "text-amber-700", badge: "bg-amber-100 text-amber-700", border: "border-amber-200", chart: "#f59e0b", chartLight: "#fcd34d" },
  { bg: "bg-blue-50", accent: "text-blue-700", badge: "bg-blue-100 text-blue-700", border: "border-blue-200", chart: "#2563eb", chartLight: "#93c5fd" },
  { bg: "bg-emerald-50", accent: "text-emerald-700", badge: "bg-emerald-100 text-emerald-700", border: "border-emerald-200", chart: "#059669", chartLight: "#6ee7b7" },
  { bg: "bg-purple-50", accent: "text-purple-700", badge: "bg-purple-100 text-purple-700", border: "border-purple-200", chart: "#7c3aed", chartLight: "#c4b5fd" },
  { bg: "bg-orange-50", accent: "text-orange-700", badge: "bg-orange-100 text-orange-700", border: "border-orange-200", chart: "#ea580c", chartLight: "#fdba74" },
  { bg: "bg-pink-50", accent: "text-pink-700", badge: "bg-pink-100 text-pink-700", border: "border-pink-200", chart: "#db2777", chartLight: "#f9a8d4" },
  { bg: "bg-cyan-50", accent: "text-cyan-700", badge: "bg-cyan-100 text-cyan-700", border: "border-cyan-200", chart: "#0891b2", chartLight: "#67e8f9" },
  { bg: "bg-red-50", accent: "text-red-700", badge: "bg-red-100 text-red-700", border: "border-red-200", chart: "#dc2626", chartLight: "#fca5a5" },
  { bg: "bg-indigo-50", accent: "text-indigo-700", badge: "bg-indigo-100 text-indigo-700", border: "border-indigo-200", chart: "#4f46e5", chartLight: "#a5b4fc" },
  { bg: "bg-gray-50", accent: "text-gray-700", badge: "bg-gray-100 text-gray-700", border: "border-gray-200", chart: "#6b7280", chartLight: "#d1d5db" },
]

const statusFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "succeeded", label: "Réussi" },
  { value: "pending", label: "En attente" },
  { value: "failed", label: "Échoué" },
]

const periodOptions = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "3months", label: "3 mois" },
  { value: "6months", label: "6 mois" },
  { value: "year", label: "1 an" },
]

type SortField = "date" | "companyName" | "amount" | "status"
type SortOrder = "asc" | "desc"

// === Helpers ===

function formatEuro(value: number): string {
  return Math.round(value).toLocaleString("fr-FR") + " €"
}

// === Component ===

export function SalesTab({ totalKpis, productKpis, payments, companies, period, periodMode, periodStartDate, periodEndDate, bookings, revenueEvolution }: SalesTabProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handlePeriodChange(newPeriod: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "sales")
    params.set("period", newPeriod)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleModeChange(newMode: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "sales")
    params.set("mode", newMode)
    router.push(`${pathname}?${params.toString()}`)
  }

  const showModeToggle = period === "week" || period === "month" || period === "3months" || period === "6months" || period === "year"

  const [search, setSearch] = useState("")
  const [companyFilter, setCompanyFilter] = useState("all")
  const [productFilter, setProductFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [page, setPage] = useState(1)
  const [detailModal, setDetailModal] = useState<string | null>(null)

  const productFilterOptions = useMemo(() => [
    { value: "all", label: "Tous les produits" },
    ...productKpis.map((p) => ({ value: p.productId, label: p.productName })),
  ], [productKpis])

  const companyFilterOptions = [
    { value: "all", label: "Toutes les entreprises" },
    ...companies,
  ]

  // Build a color map for consistent badge colors in the table
  const productColorMap = useMemo(() => {
    const map = new Map<string, number>()
    productKpis.forEach((p, i) => map.set(p.productId, i))
    return map
  }, [productKpis])

  // Revenue by site (using company's main_site_id), broken down by product
  const revenueByProductBySiteId = useMemo(() => {
    // siteId → { total, products: { productId → amount } }
    const map = new Map<string, { total: number; products: Map<string, number> }>()
    for (const p of payments) {
      if (p.status !== "succeeded" || !p.companySiteId) continue
      const amount = p.amount / 100
      const existing = map.get(p.companySiteId)
      if (existing) {
        existing.total += amount
        existing.products.set(p.productId, (existing.products.get(p.productId) || 0) + amount)
      } else {
        const products = new Map<string, number>()
        products.set(p.productId, amount)
        map.set(p.companySiteId, { total: amount, products })
      }
    }
    return map
  }, [payments])

  const filtered = useMemo(() => {
    let result = payments
    if (productFilter !== "all") {
      result = result.filter((p) => p.productId === productFilter)
    }
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter)
    }
    if (companyFilter !== "all") {
      result = result.filter((p) => p.companyId === companyFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim()
      result = result.filter(
        (p) =>
          p.companyName.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.productName.toLowerCase().includes(q) ||
          (p.customerEmail && p.customerEmail.toLowerCase().includes(q))
      )
    }
    return result
  }, [payments, productFilter, statusFilter, companyFilter, search])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      let cmp = 0
      switch (sortField) {
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "companyName":
          cmp = a.companyName.localeCompare(b.companyName)
          break
        case "amount":
          cmp = a.amount - b.amount
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
      }
      return sortOrder === "asc" ? cmp : -cmp
    })
    return copy
  }, [filtered, sortField, sortOrder])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder(field === "date" ? "desc" : "asc")
    }
    setPage(1)
  }

  function SortIcon({ field }: { field: SortField }) {
    if (sortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return sortOrder === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />
  }

  function handleExportCSV() {
    const csv = convertToCSV(sorted as unknown as Record<string, unknown>[], [
      { key: "date", header: "Date", getValue: (row) => new Date((row as unknown as StripePayment).date).toLocaleDateString("fr-FR") },
      { key: "productName", header: "Produit" },
      { key: "companyName", header: "Client" },
      { key: "description", header: "Description" },
      { key: "amount", header: "Montant (€)", getValue: (row) => ((row as unknown as StripePayment).amount / 100).toFixed(2) },
      { key: "amountRefunded", header: "Remboursé (€)", getValue: (row) => {
        const p = row as unknown as StripePayment
        return p.amountRefunded > 0 ? (p.amountRefunded / 100).toFixed(2) : ""
      }},
      { key: "status", header: "Statut", getValue: (row) => statusLabels[(row as unknown as StripePayment).status] || "" },
      { key: "customerEmail", header: "Email" },
    ])
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `ventes-hopper-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              period === opt.value
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
        {showModeToggle && (
          <>
            <span className="mx-1 h-4 w-px bg-border" />
            <button
              onClick={() => handleModeChange(periodMode === "calendar" ? "rolling" : "calendar")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {periodMode === "calendar" ? "Calendaire" : "Glissant"}
            </button>
            <span className="text-xs text-muted-foreground tabular-nums ml-1">
              {periodStartDate === periodEndDate ? periodStartDate : `${periodStartDate} — ${periodEndDate}`}
            </span>
          </>
        )}
      </div>

      {/* Combined total */}
      <div className="rounded-[20px] bg-card p-5 sm:p-6">
        <div className="flex items-center gap-3 mb-1">
          <TrendingUp className="h-5 w-5 text-emerald-600" />
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Chiffre d&apos;affaires Hopper</p>
        </div>
        <div className="flex items-baseline gap-3">
          <p className="font-header text-3xl sm:text-4xl text-emerald-600 tabular-nums">{Math.round(totalKpis.totalRevenue).toLocaleString("fr-FR")} €</p>
          {revenueEvolution !== null && (
            <span className={cn(
              "text-sm font-medium tabular-nums",
              revenueEvolution >= 0 ? "text-emerald-600" : "text-red-500"
            )}>
              {revenueEvolution >= 0 ? "+" : ""}{Math.round(revenueEvolution)} %
            </span>
          )}
        </div>
        {totalKpis.netRevenue !== totalKpis.totalRevenue && (
          <p className="text-sm text-muted-foreground mt-1">Net (après remboursements) : {formatEuro(totalKpis.netRevenue)}</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          {totalKpis.transactionCount} paiement{totalKpis.transactionCount > 1 ? "s" : ""} — Moy./paiement {formatEuro(totalKpis.avgTransaction)}
          {(() => {
            const succeeded = payments.filter((p) => p.status === "succeeded")
            const totalPersons = succeeded.reduce((s, p) => s + p.quantity, 0)
            const avgPerPerson = totalPersons > 0 ? totalKpis.totalRevenue / totalPersons : 0
            return <> — {totalPersons} desks — Moy./desk {formatEuro(avgPerPerson)}</>
          })()}
        </p>
      </div>

      {/* Product cards */}
      {productKpis.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {productKpis.map((product, index) => (
            <ProductCard
              key={product.productId}
              product={product}
              colorIndex={index}
              onClick={() => setDetailModal(product.productId)}
            />
          ))}
        </div>
      )}

      {/* Product detail modals */}
      {productKpis.map((product, index) => (
        <ProductDetailModal
          key={product.productId}
          open={detailModal === product.productId}
          onOpenChange={(open) => !open && setDetailModal(null)}
          product={product}
          colorIndex={index}
          payments={payments.filter((p) => p.productId === product.productId)}
          period={period}
        />
      ))}

      {/* CA par site */}
      {bookings.bySite.length > 0 && (() => {
        // Collect all product IDs that appear across sites
        const allProductIds = new Set<string>()
        bookings.bySite.forEach((site) => {
          const data = revenueByProductBySiteId.get(site.siteId)
          if (data) data.products.forEach((_, pid) => allProductIds.add(pid))
        })
        // Sort products by total revenue descending (largest at bottom of stack)
        const productIds = Array.from(allProductIds).sort((a, b) => {
          const totalA = bookings.bySite.reduce((s, site) => s + (revenueByProductBySiteId.get(site.siteId)?.products.get(a) || 0), 0)
          const totalB = bookings.bySite.reduce((s, site) => s + (revenueByProductBySiteId.get(site.siteId)?.products.get(b) || 0), 0)
          return totalB - totalA
        })

        // Build chart data: each site has a key per product
        const siteChartData = bookings.bySite
          .map((site) => {
            const data = revenueByProductBySiteId.get(site.siteId)
            const row: Record<string, string | number> = { name: site.siteName }
            for (const pid of productIds) {
              row[pid] = data?.products.get(pid) || 0
            }
            row._total = data?.total || 0
            return row
          })
          .sort((a, b) => (b._total as number) - (a._total as number))

        const totalSiteRevenue = siteChartData.reduce((s, d) => s + (d._total as number), 0)

        // Product name lookup for tooltip
        const productNameMap = new Map<string, string>()
        productKpis.forEach((p) => productNameMap.set(p.productId, p.productName))

        // Build per-site pie data
        const sitePies = siteChartData.map((site) => {
          const slices = productIds
            .map((pid) => ({
              name: productNameMap.get(pid) || pid,
              value: (site[pid] as number) || 0,
              colorIdx: productColorMap.get(pid) ?? (PRODUCT_CARD_COLORS.length - 1),
            }))
            .filter((s) => s.value > 0)
          return { name: site.name as string, total: site._total as number, slices }
        })

        return (
          <div className="rounded-[20px] bg-card p-4 sm:p-5">
            <div className="flex items-center gap-3 mb-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-header text-lg uppercase tracking-wide">CA par site</h3>
              <span className="font-header text-2xl tabular-nums ml-auto text-emerald-600">
                {formatEuro(totalSiteRevenue)}
              </span>
            </div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
              {sitePies.map((site) => (
                <div key={site.name} className="flex flex-col items-center gap-1">
                  <div className="relative h-[120px] w-[120px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={site.slices}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={32}
                          outerRadius={55}
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {site.slices.map((s, i) => (
                            <Cell key={i} fill={PRODUCT_CARD_COLORS[s.colorIdx % PRODUCT_CARD_COLORS.length].chart} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number, name: string) => [formatEuro(value), name]}
                          contentStyle={{ borderRadius: 12, fontSize: 12 }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-xs font-bold tabular-nums leading-tight text-center">
                        {site.total >= 1000 ? `${Math.round(site.total / 1000)}k€` : `${Math.round(site.total)}€`}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-center leading-tight">{site.name}</span>
                </div>
              ))}
            </div>
            {/* Legend */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 pt-4">
              {productKpis.map((p, i) => (
                <div key={p.productId} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: PRODUCT_CARD_COLORS[i % PRODUCT_CARD_COLORS.length].chart }}
                  />
                  <span className="truncate">{p.productName}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Filters + Table */}
      <div className="rounded-[20px] bg-card p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="relative flex-1 sm:max-w-[280px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          <SearchableSelect
            options={companyFilterOptions}
            value={companyFilter}
            onValueChange={(v) => { setCompanyFilter(v); setPage(1) }}
            placeholder="Client"
            searchPlaceholder="Rechercher un client..."
            triggerClassName="w-full sm:w-[220px]"
          />
          <SearchableSelect
            options={productFilterOptions}
            value={productFilter}
            onValueChange={(v) => { setProductFilter(v); setPage(1) }}
            placeholder="Produit"
            searchPlaceholder="Rechercher..."
            triggerClassName="w-full sm:w-[200px]"
          />
          <SearchableSelect
            options={statusFilterOptions}
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1) }}
            placeholder="Statut"
            searchPlaceholder="Rechercher..."
            triggerClassName="w-full sm:w-[160px]"
          />
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-2 rounded-sm border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted shrink-0"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <button onClick={() => toggleSort("date")} className="inline-flex items-center text-xs font-bold uppercase tracking-wide">
                    Date <SortIcon field="date" />
                  </button>
                </TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("companyName")} className="inline-flex items-center text-xs font-bold uppercase tracking-wide">
                    Client <SortIcon field="companyName" />
                  </button>
                </TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead className="text-right">
                  <button onClick={() => toggleSort("amount")} className="inline-flex items-center text-xs font-bold uppercase tracking-wide ml-auto">
                    Montant <SortIcon field="amount" />
                  </button>
                </TableHead>
                <TableHead className="hidden md:table-cell text-right">Remboursé</TableHead>
                <TableHead>
                  <button onClick={() => toggleSort("status")} className="inline-flex items-center text-xs font-bold uppercase tracking-wide">
                    Statut <SortIcon field="status" />
                  </button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun paiement trouvé
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((p) => {
                  const colorIdx = productColorMap.get(p.productId) ?? (PRODUCT_CARD_COLORS.length - 1)
                  const badgeStyle = PRODUCT_CARD_COLORS[colorIdx % PRODUCT_CARD_COLORS.length]
                  return (
                    <TableRow
                      key={p.id}
                      className={cn(p.receiptUrl && "cursor-pointer hover:bg-muted/50 transition-colors")}
                      onClick={() => p.receiptUrl && window.open(p.receiptUrl, "_blank")}
                    >
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(p.date).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <span className={cn(
                          "inline-flex rounded-sm px-1.5 py-0.5 text-[10px] font-medium uppercase whitespace-nowrap max-w-[140px] truncate",
                          badgeStyle.badge
                        )}>
                          {p.productName}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-medium max-w-[180px] truncate">
                        {p.companyName}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-[250px] truncate">
                        {p.description}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium tabular-nums">
                        {formatEuro(p.amount / 100)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-right text-sm tabular-nums">
                        {p.amountRefunded > 0 ? (
                          <span className="text-orange-500">-{formatEuro(p.amountRefunded / 100)}</span>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={cn("inline-flex rounded-sm px-2 py-0.5 text-xs font-medium", statusColors[p.status] || "bg-gray-100 text-gray-600")}>
                            {statusLabels[p.status] || p.status}
                          </span>
                          {p.receiptUrl && <ExternalLink className="h-3 w-3 text-muted-foreground/50" />}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-sm">
            <span className="text-muted-foreground">
              {sorted.length} paiement{sorted.length > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-muted-foreground">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// === Product KPI Card ===

function ProductCard({ product, colorIndex, onClick }: { product: ProductKpisEntry; colorIndex: number; onClick: () => void }) {
  const style = PRODUCT_CARD_COLORS[colorIndex % PRODUCT_CARD_COLORS.length]
  const { kpis } = product

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-[20px] p-4 sm:p-5 border transition-all cursor-pointer hover:shadow-md hover:scale-[1.01]",
        style.bg, style.border,
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <span className={cn("rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase truncate max-w-[180px]", style.badge)}>
          {product.productName}
        </span>
        <span className="text-xs text-muted-foreground shrink-0 ml-2">
          {kpis.transactionCount} paiement{kpis.transactionCount > 1 ? "s" : ""}
        </span>
      </div>
      <p className={cn("font-header text-xl sm:text-2xl tabular-nums", style.accent)}>{formatEuro(kpis.totalRevenue)}</p>
      <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          {kpis.transactionCount > 0 && <span>Moy. {formatEuro(Math.round(kpis.totalRevenue / kpis.transactionCount))}/transaction</span>}
          {kpis.totalRefunded > 0 && <span className="text-orange-500">-{formatEuro(kpis.totalRefunded)} remb.</span>}
        </div>
        {product.totalSeats != null && product.totalSeats > 0 && (
          <div className="flex items-center gap-3">
            <span>{product.totalSeats} seats — Moy. {formatEuro(Math.round(kpis.totalRevenue / product.totalSeats))}/seat</span>
          </div>
        )}
      </div>
    </div>
  )
}

// === Product Detail Modal ===

const PIE_COLORS: Record<string, string> = {
  succeeded: "#22c55e",
  pending: "#f59e0b",
  failed: "#ef4444",
}


function getTopClients(payments: StripePayment[], limit = 8) {
  const byClient: Record<string, number> = {}
  for (const p of payments) {
    if (p.status !== "succeeded") continue
    byClient[p.companyName] = (byClient[p.companyName] || 0) + p.amount / 100
  }
  return Object.entries(byClient)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([name, montant]) => ({ name: name.length > 20 ? name.slice(0, 18) + "…" : name, montant: Math.round(montant * 100) / 100 }))
}

const SITE_PIE_COLORS = ["#10b981", "#f59e0b", "#3b82f6", "#ef4444", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#84cc16", "#6366f1"]

function extractSiteName(originalProductName: string): string {
  // "Hopper Pass Day (1 Jour) - La Défense" → "La Défense"
  const dashIndex = originalProductName.lastIndexOf(" - ")
  if (dashIndex >= 0) return originalProductName.slice(dashIndex + 3).trim()
  return originalProductName
}

function getSiteBreakdown(payments: StripePayment[]) {
  const bySite: Record<string, { revenue: number; count: number }> = {}
  for (const p of payments) {
    if (p.status !== "succeeded") continue
    const site = extractSiteName(p.originalProductName)
    const existing = bySite[site]
    if (existing) {
      existing.revenue += p.amount / 100
      existing.count++
    } else {
      bySite[site] = { revenue: p.amount / 100, count: 1 }
    }
  }
  return Object.entries(bySite)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, data]) => ({
      name: name.length > 25 ? name.slice(0, 23) + "…" : name,
      value: Math.round(data.revenue * 100) / 100,
      count: data.count,
    }))
}

function getStatusBreakdown(payments: StripePayment[]) {
  const counts: Record<string, number> = { succeeded: 0, pending: 0, failed: 0 }
  for (const p of payments) {
    counts[p.status] = (counts[p.status] || 0) + 1
  }
  return Object.entries(counts)
    .filter(([, v]) => v > 0)
    .map(([status, value]) => ({ name: statusLabels[status] || status, value, status }))
}

function ProductDetailModal({
  open,
  onOpenChange,
  product,
  colorIndex,
  payments,
  period,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductKpisEntry
  colorIndex: number
  payments: StripePayment[]
  period: string
}) {
  const style = PRODUCT_CARD_COLORS[colorIndex % PRODUCT_CARD_COLORS.length]
  const siteBreakdown = useMemo(() => getSiteBreakdown(payments), [payments])
  const topClients = useMemo(() => getTopClients(payments), [payments])
  const statusBreakdown = useMemo(() => getStatusBreakdown(payments), [payments])
  const isGroupedProduct = product.productId.startsWith("__group_")
  const isCafeGroup = product.productId === "__group_cafe"
  const hasSiteData = siteBreakdown.length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn("rounded-sm px-2 py-0.5 text-[10px] font-bold uppercase", style.badge)}>{product.productName}</span>
            Détails
          </DialogTitle>
          <DialogDescription>
            {product.kpis.transactionCount} paiement{product.kpis.transactionCount > 1 ? "s" : ""} — CA net : {formatEuro(product.kpis.netRevenue)}
            {product.kpis.transactionCount > 0 && <> — Moy. {formatEuro(Math.round(product.kpis.totalRevenue / product.kpis.transactionCount))}/transaction</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* Site breakdown pie chart (only for grouped products with multiple sites, except café) */}
          {isGroupedProduct && !isCafeGroup && hasSiteData && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Répartition par site
              </h4>
              <div className="flex items-center gap-4">
                <div className="relative shrink-0 h-[200px] w-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={siteBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {siteBreakdown.map((_, i) => (
                          <Cell key={i} fill={SITE_PIE_COLORS[i % SITE_PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [formatEuro(value), "CA"]}
                        contentStyle={{ borderRadius: 12, fontSize: 13 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="font-header text-xl">{siteBreakdown.length}</span>
                      <p className="text-[10px] text-muted-foreground">sites</p>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                  {siteBreakdown.map((d, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: SITE_PIE_COLORS[i % SITE_PIE_COLORS.length] }} />
                      <span className="truncate text-muted-foreground">{d.name}</span>
                      <span className="flex-1 border-b border-dotted border-border/40 min-w-[12px] mx-1" />
                      <span className="font-bold tabular-nums shrink-0">{formatEuro(d.value)}</span>
                      <span className="text-muted-foreground shrink-0">({d.count})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top clients */}
            {topClients.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Top clients
                </h4>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topClients} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={(v) => `${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}€`} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip
                        formatter={(value: number) => [formatEuro(value), "CA"]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="montant" fill={style.chartLight} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Status breakdown */}
            {statusBreakdown.length > 0 && (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Statut des paiements
                </h4>
                <div className="h-[220px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        paddingAngle={2}
                        label={({ name, value }) => `${name} (${value})`}
                      >
                        {statusBreakdown.map((entry) => (
                          <Cell key={entry.status} fill={PIE_COLORS[entry.status] || "#9ca3af"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>

          {/* Client list */}
          {(() => {
            const clientMap: Record<string, { companyName: string; site: string; count: number; total: number }> = {}
            for (const p of payments) {
              if (p.status !== "succeeded") continue
              const key = p.companyName
              const site = extractSiteName(p.originalProductName)
              if (clientMap[key]) {
                clientMap[key].count++
                clientMap[key].total += p.amount / 100
              } else {
                clientMap[key] = { companyName: p.companyName, site, count: 1, total: p.amount / 100 }
              }
            }
            const clients = Object.values(clientMap).sort((a, b) => b.total - a.total)
            if (clients.length === 0) return null
            return (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Liste des clients ({clients.length})
                </h4>
                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Entreprise</TableHead>
                        <TableHead className="text-xs">Site</TableHead>
                        <TableHead className="text-xs text-right">Achats</TableHead>
                        <TableHead className="text-xs text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((c, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-sm font-medium truncate max-w-[200px]">{c.companyName}</TableCell>
                          <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">{c.site}</TableCell>
                          <TableCell className="text-sm tabular-nums text-right">{c.count}</TableCell>
                          <TableCell className="text-sm font-medium tabular-nums text-right">{formatEuro(c.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          })()}
        </div>
      </DialogContent>
    </Dialog>
  )
}
