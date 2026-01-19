"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useMemo, useEffect } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface AbonnementsFiltersProps {
  sites: Array<{ id: string; name: string | null }>
}

export function AbonnementsFilters({ sites }: AbonnementsFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "all")
  const [period, setPeriod] = useState(searchParams.get("period") || "all")
  const [site, setSite] = useState(searchParams.get("site") || "all")

  const updateUrl = (newSearch: string, newStatus: string, newPeriod: string, newSite: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newStatus && newStatus !== "all") params.set("status", newStatus)
    if (newPeriod && newPeriod !== "all") params.set("period", newPeriod)
    if (newSite && newSite !== "all") params.set("site", newSite)

    startTransition(() => {
      router.push(`/admin/abonnements?${params.toString()}`)
    })
  }

  // Real-time search filtering
  useEffect(() => {
    const handler = setTimeout(() => {
      if (search !== (searchParams.get("search") || "")) {
        updateUrl(search, status, period, site)
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [search])

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateUrl(search, value, period, site)
  }

  const handlePeriodChange = (value: string) => {
    setPeriod(value)
    updateUrl(search, status, value, site)
  }

  const handleSiteChange = (value: string) => {
    setSite(value)
    updateUrl(search, status, period, value)
  }

  const clearFilters = () => {
    setSearch("")
    setStatus("all")
    setPeriod("all")
    setSite("all")
    startTransition(() => {
      router.push("/admin/abonnements")
    })
  }

  const hasFilters = search || status !== "all" || period !== "all" || site !== "all"

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Tous les statuts" },
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
      { value: "expirant", label: "Expire bientot" },
    ],
    []
  )

  const periodOptions = useMemo(
    () => [
      { value: "all", label: "Toutes les periodes" },
      { value: "month", label: "Mensuel" },
      { value: "week", label: "Hebdomadaire" },
    ],
    []
  )

  const siteOptions = useMemo(
    () => [
      { value: "all", label: "Tous les sites" },
      ...sites.map((s) => ({ value: s.id, label: s.name || "Sans nom" })),
    ],
    [sites]
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <SearchableSelect
        options={statusOptions}
        value={status}
        onValueChange={handleStatusChange}
        placeholder="Statut"
        searchPlaceholder="Rechercher un statut..."
        triggerClassName="w-full sm:w-[160px]"
      />

      <SearchableSelect
        options={periodOptions}
        value={period}
        onValueChange={handlePeriodChange}
        placeholder="Periode"
        searchPlaceholder="Rechercher une periode..."
        triggerClassName="w-full sm:w-[180px]"
      />

      <SearchableSelect
        options={siteOptions}
        value={site}
        onValueChange={handleSiteChange}
        placeholder="Site"
        searchPlaceholder="Rechercher un site..."
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
  )
}
