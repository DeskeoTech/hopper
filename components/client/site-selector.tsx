"use client"

import { useState } from "react"
import { ChevronDown, Info, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useClientLayout } from "./client-layout-provider"
import { cn } from "@/lib/utils"

export function SiteSelector() {
  const { sites, selectedSite, setSelectedSiteId } = useClientLayout()
  const [open, setOpen] = useState(false)

  if (sites.length === 0) {
    return null
  }

  const handleSelectSite = (siteId: string) => {
    setSelectedSiteId(siteId)
    setOpen(false)
  }

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-2 px-0 text-left text-brand-foreground hover:bg-transparent hover:text-brand-foreground"
          >
            <span className="truncate font-header text-lg">
              Hopper - {selectedSite?.name || "Sélectionner"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-56 p-1">
          <div className="flex flex-col">
            {sites.map((site) => (
              <button
                key={site.id}
                type="button"
                onClick={() => handleSelectSite(site.id)}
                className={cn(
                  "flex items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors",
                  "hover:bg-accent hover:text-accent-foreground",
                  site.id === selectedSite?.id && "bg-accent"
                )}
              >
                <span>{site.name}</span>
                {site.id === selectedSite?.id && (
                  <Check className="h-4 w-4" />
                )}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-brand-foreground/60 hover:bg-transparent hover:text-brand-foreground"
      >
        <Info className="h-4 w-4" />
        <span className="sr-only">Informations sur le site</span>
      </Button>
    </div>
  )
}
