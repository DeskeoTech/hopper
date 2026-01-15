"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useMemo } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface ReservationsFiltersProps {
  sites: Array<{ id: string; name: string | null }>
  companies: Array<{ id: string; name: string | null }>
  users: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }>
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
  { value: "cancelled", label: "Annulee" },
]

export function ReservationsFilters({
  sites,
  companies,
  users,
}: ReservationsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("search") || "")

  const updateUrl = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    startTransition(() => {
      router.push(`/admin/reservations?${params.toString()}`)
    })
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
      // Preserve only view, date, startDate, endDate params
      const params = new URLSearchParams()
      const viewParam = searchParams.get("view")
      const date = searchParams.get("date")
      const startDate = searchParams.get("startDate")
      const endDate = searchParams.get("endDate")
      if (viewParam) params.set("view", viewParam)
      if (date) params.set("date", date)
      if (startDate) params.set("startDate", startDate)
      if (endDate) params.set("endDate", endDate)
      router.push(`/admin/reservations?${params.toString()}`)
    })
  }

  const hasFilters =
    search ||
    searchParams.get("site") ||
    searchParams.get("company") ||
    searchParams.get("status") ||
    searchParams.get("type") ||
    searchParams.get("user")

  const siteOptions = useMemo(
    () => [
      { value: "all", label: "Tous les sites" },
      ...sites.map((site) => ({
        value: site.id,
        label: site.name || "Sans nom",
      })),
    ],
    [sites]
  )

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

  return (
    <div className="space-y-4">
      {/* First row: Search + Site + Company */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
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

        <SearchableSelect
          options={siteOptions}
          value={searchParams.get("site") || "all"}
          onValueChange={(value) => handleFilterChange("site", value)}
          placeholder="Site"
          searchPlaceholder="Rechercher un site..."
          triggerClassName="w-full sm:w-[180px]"
        />

        <SearchableSelect
          options={companyOptions}
          value={searchParams.get("company") || "all"}
          onValueChange={(value) => handleFilterChange("company", value)}
          placeholder="Entreprise"
          searchPlaceholder="Rechercher une entreprise..."
          triggerClassName="w-full sm:w-[180px]"
        />
      </div>

      {/* Second row: Status + Type + User + Clear */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchableSelect
          options={statusSelectOptions}
          value={searchParams.get("status") || "all"}
          onValueChange={(value) => handleFilterChange("status", value)}
          placeholder="Statut"
          searchPlaceholder="Rechercher un statut..."
          triggerClassName="w-full sm:w-[160px]"
        />

        <SearchableSelect
          options={typeOptions}
          value={searchParams.get("type") || "all"}
          onValueChange={(value) => handleFilterChange("type", value)}
          placeholder="Type de ressource"
          searchPlaceholder="Rechercher un type..."
          triggerClassName="w-full sm:w-[180px]"
        />

        <SearchableSelect
          options={userOptions}
          value={searchParams.get("user") || "all"}
          onValueChange={(value) => handleFilterChange("user", value)}
          placeholder="Utilisateur"
          searchPlaceholder="Rechercher un utilisateur..."
          triggerClassName="w-full sm:w-[200px]"
        />

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
