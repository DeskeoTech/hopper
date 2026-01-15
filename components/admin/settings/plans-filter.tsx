"use client"

import { useMemo } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface PlansFilterProps {
  search: string
  onSearchChange: (value: string) => void
  statusFilter: "all" | "active" | "archived"
  onStatusFilterChange: (value: "all" | "active" | "archived") => void
}

export function PlansFilter({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}: PlansFilterProps) {
  const hasFilters = search || statusFilter !== "all"

  const handleClear = () => {
    onSearchChange("")
    onStatusFilterChange("all")
  }

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Tous" },
      { value: "active", label: "Actifs" },
      { value: "archived", label: "Archivés" },
    ],
    []
  )

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Rechercher un forfait..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
      <SearchableSelect
        options={statusOptions}
        value={statusFilter}
        onValueChange={(value) => onStatusFilterChange(value as "all" | "active" | "archived")}
        placeholder="Statut"
        searchPlaceholder="Rechercher un statut..."
        triggerClassName="w-[140px]"
      />
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1">
          <X className="h-4 w-4" />
          Effacer
        </Button>
      )}
    </div>
  )
}
