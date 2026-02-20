"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { SearchableSelect } from "@/components/ui/searchable-select"

interface SiteSwitcherProps {
  sites: { id: string; name: string }[]
  currentSiteId: string
}

export function SiteSwitcher({ sites, currentSiteId }: SiteSwitcherProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const options = [
    { value: "all", label: "Tous les sites" },
    ...sites.map((s) => ({ value: s.id, label: s.name })),
  ]

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("site", value)
    const query = params.toString()
    router.push(`/admin${query ? `?${query}` : ""}`)
  }

  return (
    <SearchableSelect
      options={options}
      value={currentSiteId}
      onValueChange={handleChange}
      placeholder="Sélectionner un site"
      searchPlaceholder="Rechercher un site..."
      triggerClassName="w-full sm:w-[220px]"
    />
  )
}
