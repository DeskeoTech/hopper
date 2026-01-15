"use client"

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
      <Select value={statusFilter} onValueChange={onStatusFilterChange}>
        <SelectTrigger className="w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="active">Actifs</SelectItem>
          <SelectItem value="archived">Archivés</SelectItem>
        </SelectContent>
      </Select>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={handleClear} className="gap-1">
          <X className="h-4 w-4" />
          Effacer
        </Button>
      )}
    </div>
  )
}
