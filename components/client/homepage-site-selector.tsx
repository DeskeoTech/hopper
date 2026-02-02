"use client"

import { useState, useRef, useEffect } from "react"
import { MapPin, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"

export function HomepageSiteSelector() {
  const { sitesWithDetails, selectedSiteWithDetails: selectedSite, setSelectedSiteId } = useClientLayout()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus()
    }
  }, [open])

  const filteredSites = sitesWithDetails.filter((site) =>
    site.name.toLowerCase().includes(search.toLowerCase()) ||
    site.address.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (siteId: string) => {
    setSelectedSiteId(siteId)
    setOpen(false)
    setSearch("")
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Search bar trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex w-full items-center gap-2.5 sm:gap-3 rounded-[16px] bg-card px-3 sm:px-4 py-2.5 sm:py-3 text-left transition-all",
          open && "ring-1 ring-foreground/10"
        )}
      >
        <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
          <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-foreground/50" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-header text-sm sm:text-base font-medium text-foreground">
            {selectedSite?.name || "Sélectionner un espace"}
          </p>
          {selectedSite?.address && (
            <p className="truncate text-xs sm:text-sm text-foreground/50">
              {selectedSite.address}
            </p>
          )}
        </div>
        <ChevronDown className={cn(
          "h-4 w-4 sm:h-5 sm:w-5 shrink-0 text-foreground/30 transition-transform",
          open && "rotate-180"
        )} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-[16px] bg-card ">
          {/* Search input */}
          <div className="border-b border-foreground/5 p-3">
            <div className="flex items-center gap-2 rounded-[12px] bg-muted px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un espace..."
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Sites list */}
          <div className="max-h-64 overflow-y-auto p-2">
            {filteredSites.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                Aucun espace trouvé
              </p>
            ) : (
              filteredSites.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => handleSelect(site.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[12px] px-3 py-2.5 text-left transition-colors",
                    site.id === selectedSite?.id
                      ? "bg-primary/10"
                      : "hover:bg-muted"
                  )}
                >
                  <MapPin className={cn(
                    "h-4 w-4 shrink-0",
                    site.id === selectedSite?.id ? "text-primary" : "text-muted-foreground"
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className={cn(
                      "truncate text-sm font-medium",
                      site.id === selectedSite?.id && "text-primary"
                    )}>
                      {site.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {site.address}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
