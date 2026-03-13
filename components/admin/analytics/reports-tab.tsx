"use client"

import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Building2,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Download,
  Search,
  TrendingUp,
  Users,
} from "lucide-react"
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
import { cn } from "@/lib/utils"
import { convertToCSV } from "@/lib/utils/csv"

// === Types ===

interface ReportUser {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  role: string
  status: string
  companyName: string
  companyType: string
  siteName: string
  siteId: string
  createdAt: string
  hasCgu: boolean
}

interface ReportCompany {
  id: string
  name: string
  companyType: string
  source: string
  meetingRoomOnly: boolean
  onboardingDone: boolean
  siteName: string
  siteId: string
  planName: string
  monthlyPrice: number | null
  monthlyCredits: number | null
  seats: number | null
  bookingsCount: number
  revenue: number
  createdAt: string
}

interface MonthlyRecapEntry {
  month: string
  monthKey: string
  newCompanies: number
  confirmedBookings: number
  cancelledBookings: number
  cancellationRate: number
  meetingRoomBookings: number
  flexDeskBookings: number
  revenue: number
}

export interface ReportsTabProps {
  users: ReportUser[]
  companies: ReportCompany[]
  monthlyRecap: MonthlyRecapEntry[]
  sites: { value: string; label: string }[]
}

// === Constants ===

const PAGE_SIZE = 20

type ReportType = "users" | "companies" | "recap"

const reportTypes = [
  { value: "users" as ReportType, label: "Utilisateurs", icon: Users, desc: "Export complet des utilisateurs" },
  { value: "companies" as ReportType, label: "Entreprises", icon: Building2, desc: "Export complet des entreprises" },
  { value: "recap" as ReportType, label: "Recap Mensuel", icon: CalendarRange, desc: "12 derniers mois en un clic" },
]

const companyTypeLabels: Record<string, string> = {
  self_employed: "Independant",
  multi_employee: "Multi-employe",
}

const sourceFilterOptions = [
  { value: "all", label: "Toutes les sources" },
  { value: "Spacebring", label: "Spacebring" },
  { value: "Direct", label: "Direct" },
]

const companyTypeFilterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "self_employed", label: "Independant" },
  { value: "multi_employee", label: "Multi-employe" },
]

type UserSortField = "lastName" | "email" | "companyName" | "siteName" | "createdAt"
type CompanySortField = "name" | "source" | "bookingsCount" | "revenue" | "createdAt"
type SortOrder = "asc" | "desc"

// === Helpers ===

function formatEuro(value: number): string {
  return Math.round(value).toLocaleString("fr-FR") + " €"
}

function SourceBadge({ source }: { source: string }) {
  const colors = source === "Spacebring"
    ? "bg-blue-100 text-blue-700"
    : "bg-green-100 text-green-700"
  return (
    <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium", colors)}>
      {source}
    </span>
  )
}

// === Component ===

export function ReportsTab({ users, companies, monthlyRecap, sites }: ReportsTabProps) {
  const [reportType, setReportType] = useState<ReportType>("users")

  // User filters & sort
  const [uSearch, setUSearch] = useState("")
  const [uSiteFilter, setUSiteFilter] = useState("all")
  const [uSortField, setUSortField] = useState<UserSortField>("lastName")
  const [uSortOrder, setUSortOrder] = useState<SortOrder>("asc")
  const [uPage, setUPage] = useState(1)

  // Company filters & sort
  const [cSearch, setCSearch] = useState("")
  const [cSourceFilter, setCSourceFilter] = useState("all")
  const [cTypeFilter, setCTypeFilter] = useState("all")
  const [cSiteFilter, setCSiteFilter] = useState("all")
  const [cSortField, setCSortField] = useState<CompanySortField>("name")
  const [cSortOrder, setCSortOrder] = useState<SortOrder>("asc")
  const [cPage, setCPage] = useState(1)

  const siteFilterOptions = useMemo(
    () => [{ value: "all", label: "Tous les sites" }, ...sites],
    [sites]
  )

  // Users filtering & sorting
  const filteredUsers = useMemo(() => {
    let result = users
    if (uSiteFilter !== "all") result = result.filter((u) => u.siteId === uSiteFilter)
    if (uSearch.trim()) {
      const q = uSearch.toLowerCase().trim()
      result = result.filter(
        (u) =>
          u.firstName.toLowerCase().includes(q) ||
          u.lastName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.companyName.toLowerCase().includes(q)
      )
    }
    return result
  }, [users, uSiteFilter, uSearch])

  const sortedUsers = useMemo(() => {
    const copy = [...filteredUsers]
    copy.sort((a, b) => {
      let cmp = 0
      switch (uSortField) {
        case "lastName": cmp = a.lastName.localeCompare(b.lastName); break
        case "email": cmp = a.email.localeCompare(b.email); break
        case "companyName": cmp = a.companyName.localeCompare(b.companyName); break
        case "siteName": cmp = a.siteName.localeCompare(b.siteName); break
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
      }
      return uSortOrder === "asc" ? cmp : -cmp
    })
    return copy
  }, [filteredUsers, uSortField, uSortOrder])

  const uTotalPages = Math.max(1, Math.ceil(sortedUsers.length / PAGE_SIZE))
  const uCurrentPage = Math.min(uPage, uTotalPages)
  const paginatedUsers = sortedUsers.slice((uCurrentPage - 1) * PAGE_SIZE, uCurrentPage * PAGE_SIZE)

  // Companies filtering & sorting
  const filteredCompanies = useMemo(() => {
    let result = companies
    if (cSourceFilter !== "all") result = result.filter((c) => c.source === cSourceFilter)
    if (cSiteFilter !== "all") result = result.filter((c) => c.siteId === cSiteFilter)
    if (cTypeFilter !== "all") result = result.filter((c) => c.companyType === cTypeFilter && !c.meetingRoomOnly)
    if (cSearch.trim()) {
      const q = cSearch.toLowerCase().trim()
      result = result.filter((c) => c.name.toLowerCase().includes(q))
    }
    return result
  }, [companies, cSourceFilter, cSiteFilter, cTypeFilter, cSearch])

  const sortedCompanies = useMemo(() => {
    const copy = [...filteredCompanies]
    copy.sort((a, b) => {
      let cmp = 0
      switch (cSortField) {
        case "name": cmp = (a.name || "").localeCompare(b.name || ""); break
        case "source": cmp = (a.source || "").localeCompare(b.source || ""); break
        case "bookingsCount": cmp = a.bookingsCount - b.bookingsCount; break
        case "revenue": cmp = a.revenue - b.revenue; break
        case "createdAt": cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(); break
      }
      return cSortOrder === "asc" ? cmp : -cmp
    })
    return copy
  }, [filteredCompanies, cSortField, cSortOrder])

  const cTotalPages = Math.max(1, Math.ceil(sortedCompanies.length / PAGE_SIZE))
  const cCurrentPage = Math.min(cPage, cTotalPages)
  const paginatedCompanies = sortedCompanies.slice((cCurrentPage - 1) * PAGE_SIZE, cCurrentPage * PAGE_SIZE)

  // Sort handlers
  function toggleUserSort(field: UserSortField) {
    if (uSortField === field) {
      setUSortOrder((o) => (o === "asc" ? "desc" : "asc"))
    } else {
      setUSortField(field)
      setUSortOrder(field === "createdAt" ? "desc" : "asc")
    }
    setUPage(1)
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

  function USortIcon({ field }: { field: UserSortField }) {
    if (uSortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return uSortOrder === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
  }

  function CSortIcon({ field }: { field: CompanySortField }) {
    if (cSortField !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-40" />
    return cSortOrder === "asc" ? <ArrowUp className="h-3 w-3 ml-1" /> : <ArrowDown className="h-3 w-3 ml-1" />
  }

  // CSV exports
  function handleExportUsersCSV() {
    const csv = convertToCSV(sortedUsers as unknown as Record<string, unknown>[], [
      { key: "firstName", header: "Prenom" },
      { key: "lastName", header: "Nom" },
      { key: "email", header: "Email" },
      { key: "phone", header: "Telephone" },
      { key: "companyName", header: "Entreprise" },
      { key: "companyType", header: "Type entreprise", getValue: (row) => companyTypeLabels[(row as unknown as ReportUser).companyType] || (row as unknown as ReportUser).companyType },
      { key: "siteName", header: "Site" },
      { key: "role", header: "Role" },
      { key: "status", header: "Statut" },
      { key: "createdAt", header: "Date inscription", getValue: (row) => {
        const d = (row as unknown as ReportUser).createdAt
        return d ? new Date(d).toLocaleDateString("fr-FR") : ""
      }},
      { key: "hasCgu", header: "CGU acceptees", getValue: (row) => (row as unknown as ReportUser).hasCgu ? "Oui" : "Non" },
    ])
    downloadCSV(csv, "utilisateurs")
  }

  function handleExportCompaniesCSV() {
    const csv = convertToCSV(sortedCompanies as unknown as Record<string, unknown>[], [
      { key: "name", header: "Nom" },
      { key: "companyType", header: "Type", getValue: (row) => {
        const c = row as unknown as ReportCompany
        if (c.meetingRoomOnly) return "Salle uniquement"
        return companyTypeLabels[c.companyType] || c.companyType
      }},
      { key: "source", header: "Source" },
      { key: "siteName", header: "Site principal" },
      { key: "planName", header: "Plan" },
      { key: "onboardingDone", header: "Onboarding", getValue: (row) => (row as unknown as ReportCompany).onboardingDone ? "Oui" : "Non" },
      { key: "bookingsCount", header: "Reservations" },
      { key: "revenue", header: "CA (EUR)", getValue: (row) => (row as unknown as ReportCompany).revenue.toFixed(2) },
      { key: "createdAt", header: "Date inscription", getValue: (row) => {
        const d = (row as unknown as ReportCompany).createdAt
        return d ? new Date(d).toLocaleDateString("fr-FR") : ""
      }},
    ])
    downloadCSV(csv, "entreprises")
  }

  function handleExportRecapCSV() {
    const csv = convertToCSV(monthlyRecap as unknown as Record<string, unknown>[], [
      { key: "month", header: "Mois" },
      { key: "newCompanies", header: "Nouvelles entreprises" },
      { key: "confirmedBookings", header: "Reservations confirmees" },
      { key: "cancelledBookings", header: "Reservations annulees" },
      { key: "cancellationRate", header: "Taux annulation (%)" },
      { key: "meetingRoomBookings", header: "Salles de reunion" },
      { key: "flexDeskBookings", header: "Flex Desk" },
      { key: "revenue", header: "CA (EUR)", getValue: (row) => (row as unknown as MonthlyRecapEntry).revenue.toFixed(2) },
    ])
    downloadCSV(csv, "recap-mensuel")
  }

  function downloadCSV(csv: string, name: string) {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${name}-${new Date().toISOString().split("T")[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Recap totals
  const recapTotals = useMemo(() => {
    return monthlyRecap.reduce(
      (acc, m) => ({
        newCompanies: acc.newCompanies + m.newCompanies,
        confirmedBookings: acc.confirmedBookings + m.confirmedBookings,
        cancelledBookings: acc.cancelledBookings + m.cancelledBookings,
        revenue: acc.revenue + m.revenue,
      }),
      { newCompanies: 0, confirmedBookings: 0, cancelledBookings: 0, revenue: 0 }
    )
  }, [monthlyRecap])

  const currentExportHandler =
    reportType === "users" ? handleExportUsersCSV :
    reportType === "companies" ? handleExportCompaniesCSV :
    handleExportRecapCSV

  const currentCount =
    reportType === "users" ? filteredUsers.length :
    reportType === "companies" ? filteredCompanies.length :
    monthlyRecap.length

  return (
    <div className="space-y-4">
      {/* Report type selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {reportTypes.map((rt) => {
          const Icon = rt.icon
          return (
            <button
              key={rt.value}
              onClick={() => setReportType(rt.value)}
              className={cn(
                "rounded-[20px] bg-card p-4 sm:p-5 text-left transition-all",
                reportType === rt.value ? "ring-2 ring-foreground" : "hover:ring-1 hover:ring-border"
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <h3 className="font-header text-sm uppercase tracking-wide">{rt.label}</h3>
              </div>
              <p className="text-xs text-muted-foreground">{rt.desc}</p>
            </button>
          )
        })}
      </div>

      {/* Table section */}
      <div className="rounded-[20px] bg-card p-4 sm:p-5">
        {/* Header with count + export */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <span className="text-xs text-muted-foreground tabular-nums">
            {currentCount} resultat{currentCount > 1 ? "s" : ""}
          </span>
          <button
            onClick={currentExportHandler}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Exporter CSV
          </button>
        </div>

        {/* Users report */}
        {reportType === "users" && (
          <>
            {/* Filters */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={uSearch}
                  onChange={(e) => { setUSearch(e.target.value); setUPage(1) }}
                  className="pl-9 h-8 text-sm rounded-full"
                />
              </div>
              <SearchableSelect
                value={uSiteFilter}
                onValueChange={(v) => { setUSiteFilter(v); setUPage(1) }}
                options={siteFilterOptions}
                placeholder="Site"
                className="w-[180px]"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleUserSort("lastName")}>
                      <span className="flex items-center">Nom <USortIcon field="lastName" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleUserSort("email")}>
                      <span className="flex items-center">Email <USortIcon field="email" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => toggleUserSort("companyName")}>
                      <span className="flex items-center">Entreprise <USortIcon field="companyName" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hidden lg:table-cell" onClick={() => toggleUserSort("siteName")}>
                      <span className="flex items-center">Site <USortIcon field="siteName" /></span>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Role</TableHead>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleUserSort("createdAt")}>
                      <span className="flex items-center">Inscription <USortIcon field="createdAt" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <p className="text-sm font-medium truncate max-w-[180px]">
                            {u.firstName} {u.lastName}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">{u.email}</TableCell>
                        <TableCell className="hidden md:table-cell text-sm truncate max-w-[160px]">{u.companyName}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{u.siteName}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs capitalize">{u.role}</TableCell>
                        <TableCell className="text-xs tabular-nums whitespace-nowrap">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucun utilisateur trouve
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {uTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-muted-foreground">Page {uCurrentPage} / {uTotalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setUPage(Math.max(1, uCurrentPage - 1))} disabled={uCurrentPage <= 1} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setUPage(Math.min(uTotalPages, uCurrentPage + 1))} disabled={uCurrentPage >= uTotalPages} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Companies report */}
        {reportType === "companies" && (
          <>
            {/* Filters */}
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
                options={sourceFilterOptions}
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
              <SearchableSelect
                value={cSiteFilter}
                onValueChange={(v) => { setCSiteFilter(v); setCPage(1) }}
                options={siteFilterOptions}
                placeholder="Site"
                className="w-[180px]"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer select-none" onClick={() => toggleCompanySort("name")}>
                      <span className="flex items-center">Nom <CSortIcon field="name" /></span>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="cursor-pointer select-none hidden md:table-cell" onClick={() => toggleCompanySort("source")}>
                      <span className="flex items-center">Source <CSortIcon field="source" /></span>
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Site</TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleCompanySort("bookingsCount")}>
                      <span className="flex items-center justify-end">Resa. <CSortIcon field="bookingsCount" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleCompanySort("revenue")}>
                      <span className="flex items-center justify-end">CA <CSortIcon field="revenue" /></span>
                    </TableHead>
                    <TableHead className="cursor-pointer select-none hidden sm:table-cell" onClick={() => toggleCompanySort("createdAt")}>
                      <span className="flex items-center">Inscription <CSortIcon field="createdAt" /></span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCompanies.length > 0 ? (
                    paginatedCompanies.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell>
                          <p className="text-sm font-medium truncate max-w-[200px]">{c.name}</p>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          {c.meetingRoomOnly ? "Salle uniquement" : companyTypeLabels[c.companyType] || c.companyType}
                        </TableCell>
                        <TableCell className="hidden md:table-cell"><SourceBadge source={c.source} /></TableCell>
                        <TableCell className="hidden lg:table-cell text-sm truncate max-w-[140px]">{c.siteName}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">{c.bookingsCount}</TableCell>
                        <TableCell className="text-right tabular-nums text-sm font-medium">
                          {c.revenue > 0 ? formatEuro(c.revenue) : "\u2014"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs tabular-nums whitespace-nowrap">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : "\u2014"}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        Aucune entreprise trouvee
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {cTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 px-1">
                <p className="text-xs text-muted-foreground">Page {cCurrentPage} / {cTotalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setCPage(Math.max(1, cCurrentPage - 1))} disabled={cCurrentPage <= 1} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button onClick={() => setCPage(Math.min(cTotalPages, cCurrentPage + 1))} disabled={cCurrentPage >= cTotalPages} className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted disabled:opacity-30 transition-colors">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Monthly recap */}
        {reportType === "recap" && (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Nouvelles entreprises</p>
                <p className="font-header text-xl tabular-nums">{recapTotals.newCompanies}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Resa. confirmees</p>
                <p className="font-header text-xl tabular-nums">{recapTotals.confirmedBookings}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground mb-1">Resa. annulees</p>
                <p className="font-header text-xl tabular-nums">{recapTotals.cancelledBookings}</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <div className="flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">CA total</p>
                </div>
                <p className="font-header text-xl tabular-nums text-emerald-600">{formatEuro(recapTotals.revenue)}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mois</TableHead>
                    <TableHead className="text-right">Nouvelles ent.</TableHead>
                    <TableHead className="text-right">Confirmees</TableHead>
                    <TableHead className="text-right">Annulees</TableHead>
                    <TableHead className="text-right">Taux ann.</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Salles</TableHead>
                    <TableHead className="text-right hidden md:table-cell">Flex Desk</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyRecap.map((m) => (
                    <TableRow key={m.monthKey}>
                      <TableCell className="text-sm font-medium capitalize whitespace-nowrap">{m.month}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{m.newCompanies}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{m.confirmedBookings}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">{m.cancelledBookings}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        <span className={cn(m.cancellationRate > 20 ? "text-red-600" : "text-muted-foreground")}>
                          {m.cancellationRate}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm hidden md:table-cell">{m.meetingRoomBookings}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm hidden md:table-cell">{m.flexDeskBookings}</TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-medium">
                        {m.revenue > 0 ? formatEuro(m.revenue) : "\u2014"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
