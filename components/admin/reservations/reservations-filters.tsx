"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useState, useTransition, useMemo } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { MultiSelectCheckbox } from "@/components/ui/multi-select-checkbox"

export type HiddenFilter = "site" | "company" | "status" | "type" | "user" | "search"

interface ReservationsFiltersProps {
  sites: Array<{ id: string; name: string | null }>
  companies: Array<{ id: string; name: string | null }>
  users: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }>
  hiddenFilters?: HiddenFilter[]
  paramPrefix?: string
}

const resourceTypes = [
  { value: "bench", label: "Bench" },
  { value: "meeting_room", label: "Salle de reunion" },
  { value: "flex_desk", label: "Flex desk" },
  { value: "fixed_desk", label: "Bureau fixe" },
]

const statusOptions = [
  { value: "confirmed", label: "Confirmee" },
  { value: "pending", label: "En attente" },
]

export function ReservationsFilters({
  sites,
  companies,
  users,
  hiddenFilters = [],
  paramPrefix = "",
}: ReservationsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Helper to get prefixed param key
  const getParamKey = (key: string) => `${paramPrefix}${key}`

  // Helper to get param value with prefix
  const getParam = (key: string) => searchParams.get(getParamKey(key))

  const [search, setSearch] = useState(getParam("search") || "")

  const updateUrl = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      const prefixedKey = getParamKey(key)
      if (Array.isArray(value)) {
        // Handle array values (for multi-select)
        if (value.length > 0) {
          params.set(prefixedKey, value.join(","))
        } else {
          params.delete(prefixedKey)
        }
      } else if (value && value !== "all") {
        params.set(prefixedKey, value)
      } else {
        params.delete(prefixedKey)
      }
    })

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const handleSitesChange = (selectedSites: string[]) => {
    updateUrl({ site: selectedSites })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl({ search: search || null })
  }

  const handleFilterChange = (key: string, value: string) => {
    updateUrl({ [key]: value })
  }

  const clearFilters = () => {
    setSearch("")
    startTransition(() => {
      // Preserve only view, date, startDate, endDate params (with prefix)
      // Also preserve any non-prefixed params if using a prefix
      const params = new URLSearchParams(searchParams.toString())

      // Delete all filter params with our prefix
      params.delete(getParamKey("search"))
      params.delete(getParamKey("site"))
      params.delete(getParamKey("company"))
      params.delete(getParamKey("status"))
      params.delete(getParamKey("type"))
      params.delete(getParamKey("user"))

      router.push(`${pathname}?${params.toString()}`)
    })
  }

  const hasFilters =
    search ||
    getParam("site") ||
    getParam("company") ||
    getParam("status") ||
    getParam("type") ||
    getParam("user")

  const siteOptions = useMemo(
    () =>
      sites.map((site) => ({
        value: site.id,
        label: site.name || "Sans nom",
      })),
    [sites]
  )

  // Parse site param as array (comma-separated)
  const selectedSites = useMemo(() => {
    const siteParam = getParam("site")
    if (!siteParam) return []
    return siteParam.split(",").filter(Boolean)
  }, [searchParams, paramPrefix])

  const companyOptions = useMemo(
    () => [
      { value: "all", label: "Toutes les entreprises" },
      ...companies.map((company) => ({
        value: company.id,
        label: company.name || "Sans nom",
      })),
    ],
    [companies]
  )

  const statusSelectOptions = useMemo(
    () => [
      { value: "all", label: "Tous les statuts" },
      ...statusOptions,
    ],
    []
  )

  const typeOptions = useMemo(
    () => [
      { value: "all", label: "Tous les types" },
      ...resourceTypes,
    ],
    []
  )

  const userOptions = useMemo(
    () => [
      { value: "all", label: "Tous les utilisateurs" },
      ...users.map((user) => ({
        value: user.id,
        label:
          user.first_name || user.last_name
            ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
            : user.email || "Sans nom",
      })),
    ],
    [users]
  )

  const showSearch = !hiddenFilters.includes("search")
  const showSite = !hiddenFilters.includes("site")
  const showCompany = !hiddenFilters.includes("company")
  const showStatus = !hiddenFilters.includes("status")
  const showType = !hiddenFilters.includes("type")
  const showUser = !hiddenFilters.includes("user")

  return (
    <div className="space-y-4">
      {/* First row: Search + Site + Company */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {showSearch && (
          <form onSubmit={handleSearchSubmit} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Rechercher par nom, email ou ressource..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </form>
        )}

        {showSite && (
          <MultiSelectCheckbox
            options={siteOptions}
            value={selectedSites}
            onValueChange={handleSitesChange}
            placeholder="Sites"
            searchPlaceholder="Rechercher un site..."
            allLabel="Tous les sites"
            triggerClassName="w-full sm:w-[200px]"
          />
        )}

        {showCompany && (
          <SearchableSelect
            options={companyOptions}
            value={getParam("company") || "all"}
            onValueChange={(value) => handleFilterChange("company", value)}
            placeholder="Entreprise"
            searchPlaceholder="Rechercher une entreprise..."
            triggerClassName="w-full sm:w-[180px]"
          />
        )}
      </div>

      {/* Second row: Status + Type + User + Clear */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {showStatus && (
          <SearchableSelect
            options={statusSelectOptions}
            value={getParam("status") || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
            placeholder="Statut"
            searchPlaceholder="Rechercher un statut..."
            triggerClassName="w-full sm:w-[160px]"
          />
        )}

        {showType && (
          <SearchableSelect
            options={typeOptions}
            value={getParam("type") || "all"}
            onValueChange={(value) => handleFilterChange("type", value)}
            placeholder="Type de ressource"
            searchPlaceholder="Rechercher un type..."
            triggerClassName="w-full sm:w-[180px]"
          />
        )}

        {showUser && (
          <SearchableSelect
            options={userOptions}
            value={getParam("user") || "all"}
            onValueChange={(value) => handleFilterChange("user", value)}
            placeholder="Utilisateur"
            searchPlaceholder="Rechercher un utilisateur..."
            triggerClassName="w-full sm:w-[200px]"
          />
        )}

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            disabled={isPending}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>
    </div>
  )
}
