"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState, useTransition, useMemo, useEffect, useRef } from "react"
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { SearchableSelect } from "@/components/ui/searchable-select"

export function TicketsSearch() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const isInitialMount = useRef(true)

  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [status, setStatus] = useState(searchParams.get("status") || "all")
  const [requestType, setRequestType] = useState(searchParams.get("request_type") || "all")

  const updateUrl = (newSearch: string, newStatus: string, newRequestType: string) => {
    const params = new URLSearchParams()
    if (newSearch) params.set("search", newSearch)
    if (newStatus && newStatus !== "all") params.set("status", newStatus)
    if (newRequestType && newRequestType !== "all") params.set("request_type", newRequestType)

    startTransition(() => {
      router.push(`/admin/tickets?${params.toString()}`)
    })
  }

  // Real-time search on input change (debounced)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    const timeoutId = setTimeout(() => {
      updateUrl(search, status, requestType)
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [search])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  const handleStatusChange = (value: string) => {
    setStatus(value)
    updateUrl(search, value, requestType)
  }

  const handleRequestTypeChange = (value: string) => {
    setRequestType(value)
    updateUrl(search, status, value)
  }

  const clearFilters = () => {
    setSearch("")
    setStatus("all")
    setRequestType("all")
    startTransition(() => {
      router.push("/admin/tickets")
    })
  }

  const hasFilters = search || status !== "all" || requestType !== "all"

  const statusOptions = useMemo(
    () => [
      { value: "all", label: "Tous les statuts" },
      { value: "todo", label: "À faire" },
      { value: "in_progress", label: "En cours" },
      { value: "done", label: "Résolu" },
    ],
    []
  )

  const requestTypeOptions = useMemo(
    () => [
      { value: "all", label: "Tous les types" },
      { value: "account_billing", label: "Compte / Facturation" },
      { value: "issue", label: "Problème" },
      { value: "callback", label: "Rappel" },
      { value: "other", label: "Autre" },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Rechercher un ticket..."
          value={search}
          onChange={handleSearchChange}
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
        options={requestTypeOptions}
        value={requestType}
        onValueChange={handleRequestTypeChange}
        placeholder="Type"
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
