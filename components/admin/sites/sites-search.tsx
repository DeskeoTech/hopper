"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

export function SitesSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(searchParams.get("search") || "")

  const updateUrl = (newSearch: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)

    startTransition(() => {
      router.push(`/admin/sites?${params.toString()}`)
    })
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    updateUrl(value)
  }

  const clearFilters = () => {
    setSearch("")
    startTransition(() => {
      router.push("/admin/sites")
    })
  }

  const hasFilters = search

  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Rechercher par nom, ville ou adresse..."
        value={search}
        onChange={handleSearchChange}
        className="h-12 rounded-[16px] border-none bg-card pl-12 pr-10 shadow-sm ring-1 ring-foreground/5 focus-visible:ring-2 focus-visible:ring-foreground/20"
      />
      {hasFilters && (
        <button
          type="button"
          onClick={clearFilters}
          disabled={isPending}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
