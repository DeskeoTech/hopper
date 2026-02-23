"use client"

import { useState, useMemo, useEffect, useTransition } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { CompaniesTable } from "@/components/admin/companies-table"
import type { Company, SubscriptionPeriod } from "@/lib/types/database"
import type { SubscriptionStatus } from "@/components/admin/abonnements/subscription-status-badge"
import { Briefcase } from "lucide-react"

interface CompanyWithCounts extends Company {
  userCount: number
  mainSiteName: string | null
  subscriptionStatus: SubscriptionStatus
}

interface SiteClientsSectionProps {
  companies: CompanyWithCounts[]
  isTechAdmin?: boolean
}

export function SiteClientsSection({ companies, isTechAdmin = false }: SiteClientsSectionProps) {
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("actif")
  const [period, setPeriod] = useState("all")

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Tous les statuts" },
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
      { value: "expirant", label: "Expire bientôt" },
    ],
    []
  )

  const periodOptions = useMemo(
    () => [
      { value: "all", label: "Tous les pass" },
      { value: "month", label: "Mensuel" },
      { value: "week", label: "Hebdomadaire" },
    ],
    []
  )

  const filteredCompanies = useMemo(() => {
    let result = companies

    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter((c) => c.name?.toLowerCase().includes(searchLower))
    }

    if (status && status !== "all") {
      result = result.filter((c) => c.subscriptionStatus === status)
    }

    if (period && period !== "all") {
      result = result.filter((c) => c.subscription_period === period)
    }

    return result
  }, [companies, search, status, period])

  const clearFilters = () => {
    setSearch("")
    setStatus("all")
    setPeriod("all")
  }

  const hasFilters = search || status !== "all" || period !== "all"

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <SearchableSelect
          options={statusOptions}
          value={status}
          onValueChange={setStatus}
          placeholder="Statut"
          searchPlaceholder="Rechercher un statut..."
          triggerClassName="w-full sm:w-[160px]"
        />

        <SearchableSelect
          options={periodOptions}
          value={period}
          onValueChange={setPeriod}
          placeholder="Pass"
          searchPlaceholder="Rechercher un pass..."
          triggerClassName="w-full sm:w-[180px]"
        />

        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="gap-1"
          >
            <X className="h-4 w-4" />
            Effacer
          </Button>
        )}
      </div>

      {/* Table */}
      {filteredCompanies.length > 0 ? (
        <CompaniesTable companies={filteredCompanies} isTechAdmin={isTechAdmin} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {hasFilters ? "Aucun client ne correspond à vos critères" : "Aucun client pour ce site"}
          </p>
        </div>
      )}
    </div>
  )
}
