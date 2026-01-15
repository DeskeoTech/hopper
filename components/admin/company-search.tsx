"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useMemo } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"

export function CompanySearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [companyType, setCompanyType] = useState(searchParams.get("type") || "all")

  const updateUrl = (newSearch: string, newType: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newType && newType !== "all") params.set("type", newType)

    startTransition(() => {
      router.push(`/admin/clients?${params.toString()}`)
    })
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUrl(search, companyType)
  }

  const handleTypeChange = (value: string) => {
    setCompanyType(value)
    updateUrl(search, value)
  }

  const clearFilters = () => {
    setSearch("")
    setCompanyType("all")
    startTransition(() => {
      router.push("/admin/clients")
    })
  }

  const hasFilters = search || companyType !== "all"

  const typeOptions = useMemo(
    () => [
      { value: "all", label: "Tous les types" },
      { value: "self_employed", label: "Indépendant" },
      { value: "multi_employee", label: "Multi-employés" },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <form onSubmit={handleSearchSubmit} className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher par nom ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </form>

      <SearchableSelect
        options={typeOptions}
        value={companyType}
        onValueChange={handleTypeChange}
        placeholder="Type d'entreprise"
        searchPlaceholder="Rechercher un type..."
        triggerClassName="w-full sm:w-[180px]"
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
