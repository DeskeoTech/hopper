"use client"

import { useState } from "react"
import { ChevronDown, Info, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useClientLayout } from "./client-layout-provider"
import { SiteInfoModal } from "./site-info-modal"
import { SiteSwitcherModal } from "./site-switcher-modal"

export function SiteSelector() {
  const { sites, selectedSite } = useClientLayout()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [switcherModalOpen, setSwitcherModalOpen] = useState(false)

  if (sites.length === 0) {
    return null
  }

  const handleOpenInfoModal = () => {
    setPopoverOpen(false)
    setInfoModalOpen(true)
  }

  const handleOpenSwitcherModal = () => {
    setPopoverOpen(false)
    setSwitcherModalOpen(true)
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className="h-auto gap-2 px-0 text-left text-brand-foreground hover:bg-transparent hover:text-brand-foreground"
          >
            <span className="truncate font-header text-lg">
              Hopper - {selectedSite?.name || "Selectionner"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-2">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={handleOpenInfoModal}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Info className="h-4 w-4" />
              Voir les infos du site
            </button>
            <button
              type="button"
              onClick={handleOpenSwitcherModal}
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <Building2 className="h-4 w-4" />
              Voir tous les sites Hopper
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <SiteInfoModal open={infoModalOpen} onOpenChange={setInfoModalOpen} />
      <SiteSwitcherModal
        open={switcherModalOpen}
        onOpenChange={setSwitcherModalOpen}
      />
    </>
  )
}
