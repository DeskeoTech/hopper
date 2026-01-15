"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

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
      // Preserve only view and date params
      const params = new URLSearchParams()
      const view = searchParams.get("view")
      const date = searchParams.get("date")
      if (view) params.set("view", view)
      if (date) params.set("date", date)
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

        <Select
          value={searchParams.get("site") || "all"}
          onValueChange={(value) => handleFilterChange("site", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Site" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les sites</SelectItem>
            {sites.map((site) => (
              <SelectItem key={site.id} value={site.id}>
                {site.name || "Sans nom"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("company") || "all"}
          onValueChange={(value) => handleFilterChange("company", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Entreprise" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les entreprises</SelectItem>
            {companies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name || "Sans nom"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Second row: Status + Type + User + Clear */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select
          value={searchParams.get("status") || "all"}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {statusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("type") || "all"}
          onValueChange={(value) => handleFilterChange("type", value)}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Type de ressource" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {resourceTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={searchParams.get("user") || "all"}
          onValueChange={(value) => handleFilterChange("user", value)}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Utilisateur" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les utilisateurs</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.first_name || user.last_name
                  ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
                  : user.email || "Sans nom"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
