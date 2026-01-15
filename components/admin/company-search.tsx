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

      <Select value={companyType} onValueChange={handleTypeChange}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Type d'entreprise" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les types</SelectItem>
          <SelectItem value="self_employed">Indépendant</SelectItem>
          <SelectItem value="multi_employee">Multi-employés</SelectItem>
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
  )
}
