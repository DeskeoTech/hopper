"use client"

import { useMemo, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  TrendingUp,
  BarChart3,
  Eye,
  Clock,
  MousePointerClick,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  MapPin,
  LogIn,
  LogOut,
  Zap,
  Users,
  UserPlus,
  UserCheck,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { convertToCSV } from "@/lib/utils/csv"

// === Types ===

interface MarketingKpis {
  newCompaniesCount: number
  newCompanies: { name: string; createdAt: string; utmSource: string | null }[]
}

interface Segmentation {
  selfEmployed: number
  multiEmployee: number
  meetingRoomOnly: number
}

interface MarketingBooking {
  id: string
  date: string
  clientName: string
  clientEmail: string | null
  companyName: string
  siteName: string
  siteId: string
  resourceType: string
  source: string
  status: string
  seatsCount: number
}

interface MarketingCompany {
  id: string
  name: string
  createdAt: string
  companyType: string
  source: string
  meetingRoomOnly: boolean
  bookingsCount: number
  revenue: number
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
}

interface GaMetrics {
  activeUsers: number
  sessions: number
  pageViews: number
  avgSessionDuration: number
  bounceRate: number
  topPages: { path: string; views: number }[]
  newVsReturning: { type: string; users: number }[]
  trafficSources: { source: string; users: number; sessions: number }[]
  devices: { device: string; users: number }[]
  countries: { country: string; users: number }[]
  cities: { city: string; users: number }[]
  landingPages: { path: string; sessions: number }[]
  exitPages: { path: string; views: number }[]
  events: { name: string; count: number }[]
  dailyTraffic: { date: string; users: number; sessions: number; pageViews: number }[]
}

export interface MarketingTabProps {
  kpis: MarketingKpis
  signupsBySite: Record<string, string | number>[]
  signupSiteNames: string[]
  segmentation: Segmentation
  bookings: MarketingBooking[]
  companies: MarketingCompany[]
  sites: { value: string; label: string }[]
  period: string
  periodMode: string
  periodStartDate: string
  periodEndDate: string
  gaData?: { key: string; label: string; metrics: GaMetrics | null }[]
}

// === Constants ===

const PAGE_SIZE = 20

const periodOptions = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "3months", label: "3 mois" },
  { value: "year", label: "1 an" },
  { value: "3years", label: "3 ans" },
  { value: "all", label: "Tout" },
]

const sourceFilterOptions = [
  { value: "all", label: "Toutes les sources" },
  { value: "Direct", label: "Direct" },
  { value: "M&E", label: "M&E" },
]

const companySourceFilterOptions = [
  { value: "all", label: "Toutes les sources" },
  { value: "Direct", label: "Direct" },
]

const resourceTypeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "flex_desk", label: "Flex Desk" },
  { value: "meeting_room", label: "Salle de réunion" },
  { value: "bench", label: "Bench" },
  { value: "fixed_desk", label: "Bureau fixe" },
]

const companyTypeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "self_employed", label: "Indépendant" },
  { value: "multi_employee", label: "Multi-employé" },
]

const statusFilterOptions = [
  { value: "all", label: "Tous les statuts" },
  { value: "confirmed", label: "Confirmé" },
  { value: "cancelled", label: "Annulé" },
  { value: "pending", label: "En attente" },
]

const resourceTypeLabels: Record<string, string> = {
  flex_desk: "Flex Desk",
  meeting_room: "Salle de réunion",
  bench: "Bench",
  fixed_desk: "Bureau fixe",
}

const statusLabels: Record<string, string> = {
  confirmed: "Confirmé",
  cancelled: "Annulé",
  pending: "En attente",
}

const statusColors: Record<string, string> = {
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
}

const SOURCE_COLORS: Record<string, { bg: string; text: string; chart: string }> = {
  Direct: { bg: "bg-green-100", text: "text-green-700", chart: "#22c55e" },
  "M&E": { bg: "bg-purple-100", text: "text-purple-700", chart: "#8b5cf6" },
}

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#8b5cf6"]
const PIE_LABELS = ["Indépendants", "Multi-employés", "Salle uniquement"]

const SITE_CHART_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#ef4444", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#84cc16", "#6366f1"]

type BookingSortField = "date" | "clientName" | "siteName" | "source" | "status"
type CompanySortField = "createdAt" | "name" | "source" | "bookingsCount" | "revenue"
type SortOrder = "asc" | "desc"

// === Helpers ===

function formatEuro(value: number): string {
  return value.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

function SourceBadge({ source }: { source: string }) {
  const colors = SOURCE_COLORS[source] || { bg: "bg-gray-100", text: "text-gray-700" }
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", colors.bg, colors.text)}>
      {source}
    </span>
  )
}

// === Component ===

export function MarketingTab({
  kpis,
  signupsBySite,
  signupSiteNames,
  segmentation,
  bookings,
  companies,
  sites,
  period,
  periodMode,
  periodStartDate,
  periodEndDate,
  gaData,
}: MarketingTabProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [selectedGaAccount, setSelectedGaAccount] = useState(gaData?.[0]?.key || "")
  const gaMetrics = gaData?.find((d) => d.key === selectedGaAccount)?.metrics ?? null

  function handlePeriodChange(newPeriod: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "marketing")
    params.set("period", newPeriod)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleModeChange(newMode: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "marketing")
    params.set("mode", newMode)
    router.push(`${pathname}?${params.toString()}`)
  }

  const showModeToggle = period === "week" || period === "month"


  // New companies card expand
  const [showNewCompanies, setShowNewCompanies] = useState(false)

  // Chart toggle
  const [signupChartView, setSignupChartView] = useState<"source" | "site">("site")

  // Table toggle
  const [tableView, setTableView] = useState<"bookings" | "companies">("bookings")

  // Booking filters & sort
  const [bSearch, setBSearch] = useState("")
  const [bSiteFilter, setBSiteFilter] = useState("all")
  const [bSourceFilter, setBSourceFilter] = useState("all")
  const [bTypeFilter, setBTypeFilter] = useState("all")
  const [bStatusFilter, setBStatusFilter] = useState("all")
  const [bSortField, setBSortField] = useState<BookingSortField>("date")
  const [bSortOrder, setBSortOrder] = useState<SortOrder>("desc")
  const [bPage, setBPage] = useState(1)

  // Company filters & sort
  const [cSearch, setCSearch] = useState("")
  const [cSourceFilter, setCSourceFilter] = useState("all")
  const [cTypeFilter, setCTypeFilter] = useState("all")
  const [cSortField, setCSortField] = useState<CompanySortField>("createdAt")
  const [cSortOrder, setCSortOrder] = useState<SortOrder>("desc")
  const [cPage, setCPage] = useState(1)

  const siteFilterOptions = useMemo(
    () => [{ value: "all", label: "Tous les sites" }, ...sites],
    [sites]
  )

  // Bookings filtering & sorting
  const filteredBookings = useMemo(() => {
    let result = bookings
    if (bSourceFilter !== "all") result = result.filter((b) => b.source === bSourceFilter)
    if (bSiteFilter !== "all") result = result.filter((b) => b.siteId === bSiteFilter)
    if (bTypeFilter !== "all") result = result.filter((b) => b.resourceType === bTypeFilter)
    if (bStatusFilter !== "all") result = result.filter((b) => b.status === bStatusFilter)
    if (bSearch.trim()) {
      const q = bSearch.toLowerCase().trim()
      result = result.filter(
        (b) =>
          b.clientName.toLowerCase().includes(q) ||
          b.companyName.toLowerCase().includes(q) ||
          b.siteName.toLowerCase().includes(q) ||
          (b.clientEmail && b.clientEmail.toLowerCase().includes(q))
      )
    }
    return result
  }, [bookings, bSourceFilter, bSiteFilter, bTypeFilter, bStatusFilter, bSearch])

  const sortedBookings = useMemo(() => {
    const copy = [...filteredBookings]
    copy.sort((a, b) => {
      let cmp = 0
      switch (bSortField) {
        case "date":
          cmp = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case "clientName":
          cmp = a.clientName.localeCompare(b.clientName)
          break
        case "siteName":
          cmp = a.siteName.localeCompare(b.siteName)
          break
        case "source":
          cmp = a.source.localeCompare(b.source)
          break
        case "status":
          cmp = a.status.localeCompare(b.status)
          break
      }
      return bSortOrder === "asc" ? cmp : -cmp
    })
    return copy
  }, [filteredBookings, bSortField, bSortOrder])

  const bTotalPages = Math.max(1, Math.ceil(sortedBookings.length / PAGE_SIZE))
  const bCurrentPage = Math.min(bPage, bTotalPages)
  const paginatedBookings = sortedBookings.slice((bCurrentPage - 1) * PAGE_SIZE, bCurrentPage * PAGE_SIZE)

  // Companies filtering & sorting
  const filteredCompanies = useMemo(() => {
    let result = companies
    if (cSourceFilter !== "all") result = result.filter((c) => c.source === cSourceFilter)
    if (cTypeFilter !== "all") {
      if (cTypeFilter === "meeting_room_only") {
        result = result.filter((c) => c.meetingRoomOnly)
      } else {
        result = result.filter((c) => c.companyType === cTypeFilter && !c.meetingRoomOnly)
      }
    }
    if (cSearch.trim()) {
      const q = cSearch.toLowerCase().trim()
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }
    return result
  }, [companies, cSourceFilter, cTypeFilter, cSearch])

  const sortedCompanies = useMemo(() => {
    const copy = [...filteredCompanies]
    copy.sort((a, b) => {
      let cmp = 0
      switch (cSortField) {
        case "createdAt":
          cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case "name":
          cmp = a.name.localeCompare(b.name)
          break
        case "source":
          cmp = a.source.localeCompare(b.source)
          break
        case "bookingsCount":
          cmp = a.bookingsCount - b.bookingsCount
          break
        case "revenue":
          cmp = a.revenue - b.revenue
          break
      }
      return cSortOrder === "asc" ? cmp : -cmp
    })
    return copy
  }, [filteredCompanies, cSortField, cSortOrder])

  const cTotalPages = Math.max(1, Math.ceil(sortedCompanies.length / PAGE_SIZE))
  const cCurrentPage = Math.min(cPage, cTotalPages)
  const paginatedCompanies = sortedCompanies.slice((cCurrentPage - 1) * PAGE_SIZE, cCurrentPage * PAGE_SIZE)

  // Sort handlers
  function toggleBookingSort(field: BookingSortField) {
    if (bSortField === field) {
      setBSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setBSortField(field)
      setBSortOrder(field === "date" ? "desc" : "asc")
    }
    setBPage(1)
  }

  function toggleCompanySort(field: CompanySortField) {
    if (cSortField === field) {
      setCSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setCSortField(field)
      setCSortOrder(field === "createdAt" || field === "revenue" || field === "bookingsCount" ? "desc" : "asc")
    }
    setCPage(1)
  }

  function BSortIcon({ field }: { field: BookingSortField }) {
    if (bSortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return bSortOrder === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
  }

  function CSortIcon({ field }: { field: CompanySortField }) {
    if (cSortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return cSortOrder === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
  }

  // CSV exports
  function handleExportBookingsCSV() {
    const csv = convertToCSV(sortedBookings as unknown as Record<string, unknown>[], [
      { key: "date", header: "Date", getValue: (row) => new Date((row as unknown as MarketingBooking).date).toLocaleDateString("fr-FR") },
      { key: "clientName", header: "Client" },
      { key: "companyName", header: "Entreprise" },
      { key: "siteName", header: "Site" },
      { key: "resourceType", header: "Type", getValue: (row) => resourceTypeLabels[(row as unknown as MarketingBooking).resourceType] || (row as unknown as MarketingBooking).resourceType },
      { key: "source", header: "Source" },
      { key: "status", header: "Statut", getValue: (row) => statusLabels[(row as unknown as MarketingBooking).status] || (row as unknown as MarketingBooking).status },
    ])
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `marketing-reservations-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleExportCompaniesCSV() {
    const csv = convertToCSV(sortedCompanies as unknown as Record<string, unknown>[], [
      { key: "createdAt", header: "Date inscription", getValue: (row) => new Date((row as unknown as MarketingCompany).createdAt).toLocaleDateString("fr-FR") },
      { key: "name", header: "Nom" },
      { key: "companyType", header: "Type", getValue: (row) => {
        const c = row as unknown as MarketingCompany
        if (c.meetingRoomOnly) return "Salle uniquement"
        return c.companyType === "self_employed" ? "Indépendant" : c.companyType === "multi_employee" ? "Multi-employé" : c.companyType
      }},
      { key: "source", header: "Source" },
      { key: "bookingsCount", header: "Réservations" },
      { key: "revenue", header: "CA (€)", getValue: (row) => (row as unknown as MarketingCompany).revenue.toFixed(2) },
    ])
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `marketing-entreprises-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Pie chart data
  const pieData = [
    { name: "Indépendants", value: segmentation.selfEmployed },
    { name: "Multi-employés", value: segmentation.multiEmployee },
    { name: "Salle uniquement", value: segmentation.meetingRoomOnly },
  ].filter((d) => d.value > 0)

  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0)

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

      {/* KPIs */}
      <div>
        {/* New companies */}
        <button
          onClick={() => setShowNewCompanies(true)}
          className="rounded-[20px] bg-card p-5 text-left hover:ring-2 hover:ring-foreground/10 transition-shadow cursor-pointer"
        >
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nouvelles entreprises</p>
          </div>
          <p className="font-header text-3xl tabular-nums">{kpis.newCompaniesCount}</p>
        </button>
        <Dialog open={showNewCompanies} onOpenChange={setShowNewCompanies}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-header uppercase tracking-wide">
                Nouvelles entreprises ({kpis.newCompaniesCount})
              </DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              {kpis.newCompanies.length > 0 ? (
                <>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 px-1 pb-2 border-b border-border/50">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nom</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Source</span>
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Date</span>
                  </div>
                  <div className="space-y-0">
                    {kpis.newCompanies.map((c, i) => (
                      <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-3 items-center text-sm py-2 px-1 border-b border-border/30 last:border-0">
                        <span className="truncate font-medium">{c.name}</span>
                        <span className="shrink-0 text-xs text-muted-foreground">{c.utmSource || "—"}</span>
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">Aucune nouvelle entreprise sur la période</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Google Analytics */}
      {gaData && gaData.length > 0 ? (
        <>
          {/* GA4 Header + KPIs */}
          <div className="rounded-[20px] bg-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-header text-lg uppercase tracking-wide">Comportement visiteurs</h3>
              {gaData.length > 1 ? (
                <div className="ml-auto flex items-center gap-1">
                  {gaData.map((acc) => (
                    <button
                      key={acc.key}
                      onClick={() => setSelectedGaAccount(acc.key)}
                      className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
                        selectedGaAccount === acc.key
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              ) : (
                <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">GA4</span>
              )}
            </div>
            {!gaMetrics ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm font-medium text-muted-foreground mb-1">Données indisponibles</p>
                <p className="text-xs text-muted-foreground/70 max-w-sm">
                  Aucune donnée GA4 disponible pour ce compte sur cette période.
                </p>
              </div>
            ) : (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Visiteurs</p>
                </div>
                <p className="font-header text-2xl tabular-nums">{gaMetrics.activeUsers.toLocaleString("fr-FR")}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <MousePointerClick className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Sessions</p>
                </div>
                <p className="font-header text-2xl tabular-nums">{gaMetrics.sessions.toLocaleString("fr-FR")}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Pages vues</p>
                </div>
                <p className="font-header text-2xl tabular-nums">{gaMetrics.pageViews.toLocaleString("fr-FR")}</p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Durée moy.</p>
                </div>
                <p className="font-header text-2xl tabular-nums">
                  {Math.floor(gaMetrics.avgSessionDuration / 60)}m{Math.round(gaMetrics.avgSessionDuration % 60).toString().padStart(2, "0")}s
                </p>
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Taux rebond</p>
                </div>
                <p className="font-header text-2xl tabular-nums">{(gaMetrics.bounceRate * 100).toFixed(1)}%</p>
              </div>
            </div>
            )}
          </div>

          {gaMetrics && <>
          {/* Traffic evolution chart */}
          {gaMetrics.dailyTraffic.length > 1 && (
            <div className="rounded-[20px] bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-header text-sm uppercase tracking-wide">Évolution du trafic</h3>
              </div>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={gaMetrics.dailyTraffic.map((d) => ({
                    ...d,
                    label: `${d.date.slice(6, 8)}/${d.date.slice(4, 6)}`,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(var(--border))" }}
                      labelFormatter={(label) => `Date : ${label}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="users" name="Visiteurs" stroke="#1B1918" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#8B7355" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="pageViews" name="Pages vues" stroke="#C4A882" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Row: New vs Returning + Devices + Sources */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {/* New vs Returning */}
            {gaMetrics.newVsReturning.length > 0 && (
              <div className="rounded-[20px] bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-header text-sm uppercase tracking-wide">Nouveaux vs Récurrents</h3>
                </div>
                {(() => {
                  const total = gaMetrics.newVsReturning.reduce((s, r) => s + r.users, 0)
                  const nvr = gaMetrics.newVsReturning.map((r) => ({
                    name: r.type === "new" ? "Nouveaux" : r.type === "returning" ? "Récurrents" : r.type,
                    value: r.users,
                    pct: total > 0 ? ((r.users / total) * 100).toFixed(1) : "0",
                  }))
                  const colors = ["#1B1918", "#C4A882"]
                  return (
                    <div className="flex items-center gap-4">
                      <div className="h-[120px] w-[120px] shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={nvr} dataKey="value" cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={2}>
                              {nvr.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {nvr.map((r, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                            <span className="text-sm">{r.name}</span>
                            <span className="text-sm font-medium tabular-nums">{r.value.toLocaleString("fr-FR")}</span>
                            <span className="text-xs text-muted-foreground">({r.pct}%)</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Devices */}
            {gaMetrics.devices.length > 0 && (
              <div className="rounded-[20px] bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-header text-sm uppercase tracking-wide">Appareils</h3>
                </div>
                {(() => {
                  const total = gaMetrics.devices.reduce((s, d) => s + d.users, 0)
                  const deviceColors: Record<string, string> = { desktop: "#1B1918", mobile: "#8B7355", tablet: "#C4A882" }
                  const deviceIcons: Record<string, typeof Monitor> = { desktop: Monitor, mobile: Smartphone, tablet: Tablet }
                  return (
                    <div className="space-y-3">
                      {gaMetrics.devices.map((d, i) => {
                        const pct = total > 0 ? (d.users / total) * 100 : 0
                        const Icon = deviceIcons[d.device] || Monitor
                        return (
                          <div key={i}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm capitalize">{d.device}</span>
                              </div>
                              <span className="text-sm font-medium tabular-nums">{d.users.toLocaleString("fr-FR")} ({pct.toFixed(1)}%)</span>
                            </div>
                            <div className="h-2 rounded-full bg-muted overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${pct}%`, backgroundColor: deviceColors[d.device] || "#999" }}
                              />
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* Traffic Sources */}
            {gaMetrics.trafficSources.length > 0 && (
              <div className="rounded-[20px] bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-header text-sm uppercase tracking-wide">Sources de trafic</h3>
                </div>
                <div className="space-y-2">
                  {gaMetrics.trafficSources.slice(0, 8).map((s, i) => {
                    const maxSessions = gaMetrics.trafficSources[0]?.sessions || 1
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm truncate min-w-0 flex-1">{s.source}</span>
                        <div className="w-20 h-2 rounded-full bg-muted overflow-hidden shrink-0">
                          <div className="h-full rounded-full bg-[#1B1918]" style={{ width: `${(s.sessions / maxSessions) * 100}%` }} />
                        </div>
                        <span className="text-sm font-medium tabular-nums shrink-0 w-12 text-right">{s.sessions.toLocaleString("fr-FR")}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row: Top Pages + Landing Pages + Geo */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {/* Top pages */}
            {gaMetrics.topPages.length > 0 && (
              <div className="rounded-[20px] bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-header text-sm uppercase tracking-wide">Pages les plus vues</h3>
                </div>
                <div className="space-y-2">
                  {gaMetrics.topPages.slice(0, 10).map((page, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground mr-2">{page.path}</span>
                      <span className="shrink-0 font-medium tabular-nums">{page.views.toLocaleString("fr-FR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Landing pages */}
            {gaMetrics.landingPages.length > 0 && (
              <div className="rounded-[20px] bg-card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <LogIn className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-header text-sm uppercase tracking-wide">Pages d{"'"}entrée</h3>
                </div>
                <div className="space-y-2">
                  {gaMetrics.landingPages.slice(0, 10).map((page, i) => (
                    <div key={i} className="flex items-center justify-between text-sm">
                      <span className="truncate text-muted-foreground mr-2">{page.path}</span>
                      <span className="shrink-0 font-medium tabular-nums">{page.sessions.toLocaleString("fr-FR")}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Countries + Cities */}
            <div className="rounded-[20px] bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-header text-sm uppercase tracking-wide">Géographie</h3>
              </div>
              {gaMetrics.countries.length > 0 && (
                <div className="mb-4">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Pays</p>
                  <div className="space-y-1.5">
                    {gaMetrics.countries.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{c.country}</span>
                        <span className="font-medium tabular-nums">{c.users.toLocaleString("fr-FR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {gaMetrics.cities.length > 0 && (
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">Villes</p>
                  <div className="space-y-1.5">
                    {gaMetrics.cities.slice(0, 5).map((c, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{c.city}</span>
                        <span className="font-medium tabular-nums">{c.users.toLocaleString("fr-FR")}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Events */}
          {gaMetrics.events.length > 0 && (
            <div className="rounded-[20px] bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-header text-sm uppercase tracking-wide">Événements</h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {gaMetrics.events.slice(0, 15).map((e, i) => (
                  <div key={i} className="rounded-xl bg-muted/50 p-3 text-center">
                    <p className="text-xs text-muted-foreground truncate mb-1">{e.name}</p>
                    <p className="font-header text-lg tabular-nums">{e.count.toLocaleString("fr-FR")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          </>}
        </>
      ) : (
        <div className="rounded-[20px] bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-header text-lg uppercase tracking-wide">Comportement visiteurs</h3>
            <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-muted-foreground bg-muted px-2 py-0.5 rounded-full">GA4</span>
          </div>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <BarChart3 className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm font-medium text-muted-foreground mb-1">Intégration Google Analytics en attente</p>
            <p className="text-xs text-muted-foreground/70 max-w-sm">
              Configurez le compte de service Google Cloud pour afficher les données de trafic et comportement visiteurs.
            </p>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Pie chart: signups by site or source */}
        <div className="rounded-[20px] bg-card p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-header text-lg uppercase tracking-wide">Source d&apos;inscription</h3>
            <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
              <button
                onClick={() => setSignupChartView("site")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  signupChartView === "site" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Par site
              </button>
              <button
                onClick={() => setSignupChartView("source")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  signupChartView === "source" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Par type
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            {signupChartView === "site" ? "Répartition par site" : "Direct vs M&E"}
          </p>
          {(() => {
            const SOURCE_PIE_COLORS = ["#22c55e", "#8b5cf6"]
            if (signupChartView === "site") {
              const siteTotals = signupSiteNames.map((name) => ({
                name,
                value: signupsBySite.reduce((sum, row) => sum + (Number(row[name]) || 0), 0),
              })).filter((d) => d.value > 0)
              const total = siteTotals.reduce((s, d) => s + d.value, 0)
              return siteTotals.length > 0 ? (
                <div className="flex items-center gap-4">
                  <div className="relative shrink-0 h-[180px] w-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={siteTotals} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                          {siteTotals.map((_, i) => (
                            <Cell key={i} fill={SITE_CHART_COLORS[i % SITE_CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`${value}`, ""]} contentStyle={{ borderRadius: 12, fontSize: 13 }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <span className="font-header text-xl">{total}</span>
                        <p className="text-[10px] text-muted-foreground">total</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 min-w-0 flex-1">
                    {siteTotals.map((d, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: SITE_CHART_COLORS[i % SITE_CHART_COLORS.length] }} />
                        <span className="truncate text-muted-foreground">{d.name}</span>
                        <span className="ml-auto font-medium tabular-nums">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-12">Aucune inscription sur la période</p>
              )
            } else {
              const directCount = bookings.filter((b) => b.source === "Direct").length
              const meCount = bookings.filter((b) => b.source === "M&E").length
              const sourceData = [
                { name: "Direct", value: directCount },
                { name: "M&E", value: meCount },
              ]
              return directCount + meCount > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={sourceData} barCategoryGap="40%">
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, fontSize: 13, border: "1px solid hsl(var(--border))" }}
                      formatter={(value: number) => [`${value}`, ""]}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      <Cell fill="#22c55e" />
                      <Cell fill="#8b5cf6" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-12">Aucune réservation sur la période</p>
              )
            }
          })()}
        </div>

        {/* Pie chart: segmentation */}
        <div className="rounded-[20px] bg-card p-5">
          <h3 className="font-header text-lg uppercase tracking-wide mb-1">Segmentation</h3>
          <p className="text-sm text-muted-foreground mb-4">Répartition des entreprises</p>
          {pieData.length > 0 ? (
            <div className="flex items-center gap-4">
              <div className="relative shrink-0 h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [`${value}`, ""]}
                      contentStyle={{ borderRadius: 12, fontSize: 13 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="font-header text-xl">{pieTotal}</span>
                    <p className="text-[10px] text-muted-foreground">total</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2 min-w-0 flex-1">
                {pieData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="truncate text-muted-foreground">{d.name}</span>
                    <span className="flex-1 border-b border-dotted border-border/40 min-w-[12px] mx-1" />
                    <span className="font-bold tabular-nums shrink-0">{d.value}</span>
                    <span className="text-xs text-muted-foreground shrink-0">({pieTotal > 0 ? Math.round((d.value / pieTotal) * 100) : 0}%)</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">Aucune donnée</p>
          )}
        </div>
      </div>

      {/* Table section */}
      <div className="rounded-[20px] bg-card p-4 sm:p-5">
        {/* Toggle + filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-muted p-0.5">
              <button
                onClick={() => setTableView("bookings")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  tableView === "bookings" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Réservations
              </button>
              <button
                onClick={() => setTableView("companies")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  tableView === "companies" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                Entreprises
              </button>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {tableView === "bookings" ? `${filteredBookings.length} résultat${filteredBookings.length > 1 ? "s" : ""}` : `${filteredCompanies.length} résultat${filteredCompanies.length > 1 ? "s" : ""}`}
            </span>
          </div>
          <button
            onClick={tableView === "bookings" ? handleExportBookingsCSV : handleExportCompaniesCSV}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </button>
        </div>

        {/* Filters */}
        {tableView === "bookings" ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={bSearch}
                onChange={(e) => { setBSearch(e.target.value); setBPage(1) }}
                className="pl-9 h-8 text-sm rounded-full"
              />
            </div>
            <SearchableSelect
              value={bSiteFilter}
              onValueChange={(v) => { setBSiteFilter(v); setBPage(1) }}
              options={siteFilterOptions}
              placeholder="Site"
              className="w-[180px]"
            />
            <SearchableSelect
              value={bSourceFilter}
              onValueChange={(v) => { setBSourceFilter(v); setBPage(1) }}
              options={sourceFilterOptions}
              placeholder="Source"
              className="w-[160px]"
            />
            <SearchableSelect
              value={bTypeFilter}
              onValueChange={(v) => { setBTypeFilter(v); setBPage(1) }}
              options={resourceTypeFilterOptions}
              placeholder="Type"
              className="w-[160px]"
            />
            <SearchableSelect
              value={bStatusFilter}
              onValueChange={(v) => { setBStatusFilter(v); setBPage(1) }}
              options={statusFilterOptions}
              placeholder="Statut"
              className="w-[160px]"
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={cSearch}
                onChange={(e) => { setCSearch(e.target.value); setCPage(1) }}
                className="pl-9 h-8 text-sm rounded-full"
              />
            </div>
            <SearchableSelect
              value={cSourceFilter}
              onValueChange={(v) => { setCSourceFilter(v); setCPage(1) }}
              options={companySourceFilterOptions}
              placeholder="Source"
              className="w-[160px]"
            />
            <SearchableSelect
              value={cTypeFilter}
              onValueChange={(v) => { setCTypeFilter(v); setCPage(1) }}
              options={companyTypeFilterOptions}
              placeholder="Type"
              className="w-[160px]"
            />
          </div>
        )}

        {/* Bookings table */}
        {tableView === "bookings" && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleBookingSort("date")}>
                      <span className="flex items-center">Date <BSortIcon field="date" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleBookingSort("clientName")}>
                      <span className="flex items-center">Client <BSortIcon field="clientName" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => toggleBookingSort("siteName")}>
                      <span className="flex items-center">Site <BSortIcon field="siteName" /></span>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Type</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleBookingSort("source")}>
                      <span className="flex items-center">Source <BSortIcon field="source" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleBookingSort("status")}>
                      <span className="flex items-center">Statut <BSortIcon field="status" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedBookings.length > 0 ? (
                    paginatedBookings.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="text-xs tabular-nums whitespace-nowrap">
                          {new Date(b.date).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate max-w-[200px]">{b.clientName}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[200px]">{b.companyName}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{b.siteName}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs">{resourceTypeLabels[b.resourceType] || b.resourceType}</TableCell>
                        <TableCell><SourceBadge source={b.source} /></TableCell>
                        <TableCell>
                          <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", statusColors[b.status] || "bg-gray-100 text-gray-700")}>
                            {statusLabels[b.status] || b.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucune réservation trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            {bTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-muted-foreground">
                  Page {bCurrentPage} / {bTotalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setBPage(Math.max(1, bCurrentPage - 1))}
                    disabled={bCurrentPage <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setBPage(Math.min(bTotalPages, bCurrentPage + 1))}
                    disabled={bCurrentPage >= bTotalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Companies table */}
        {tableView === "companies" && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleCompanySort("createdAt")}>
                      <span className="flex items-center">Date <CSortIcon field="createdAt" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleCompanySort("name")}>
                      <span className="flex items-center">Nom <CSortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleCompanySort("source")}>
                      <span className="flex items-center">Source <CSortIcon field="source" /></span>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">UTM Source</TableHead>
                    <TableHead className="hidden lg:table-cell">UTM Medium</TableHead>
                    <TableHead className="hidden xl:table-cell">UTM Campaign</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleCompanySort("bookingsCount")}>
                      <span className="flex items-center justify-end">Résa. <CSortIcon field="bookingsCount" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-right hidden sm:table-cell" onClick={() => toggleCompanySort("revenue")}>
                      <span className="flex items-center justify-end">CA <CSortIcon field="revenue" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.length > 0 ? (
                    paginatedCompanies.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-xs tabular-nums whitespace-nowrap">
                          {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <p className="text-sm font-medium truncate max-w-[200px]">{c.name}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {c.meetingRoomOnly ? "Salle uniquement" : c.companyType === "self_employed" ? "Indépendant" : c.companyType === "multi_employee" ? "Multi-employé" : c.companyType}
                        </TableCell>
                        <TableCell><SourceBadge source={c.source} /></TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{c.utmSource || "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{c.utmMedium || "—"}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{c.utmCampaign || "—"}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">{c.bookingsCount}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium hidden sm:table-cell">
                          {c.revenue > 0 ? formatEuro(c.revenue) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                        Aucune entreprise trouvée
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Pagination */}
            {cTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-muted-foreground">
                  Page {cCurrentPage} / {cTotalPages}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCPage(Math.max(1, cCurrentPage - 1))}
                    disabled={cCurrentPage <= 1}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCPage(Math.min(cTotalPages, cCurrentPage + 1))}
                    disabled={cCurrentPage >= cTotalPages}
                    className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
