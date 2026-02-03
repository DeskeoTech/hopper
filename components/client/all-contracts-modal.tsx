"use client"

import { X } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContractListCard } from "./contract-list-card"
import { useClientLayout } from "./client-layout-provider"
import type { ContractForDisplay } from "@/lib/types/database"

interface AllContractsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contracts: ContractForDisplay[]
  onSelectContract?: (contract: ContractForDisplay) => void
}

export function AllContractsModal({
  open,
  onOpenChange,
  contracts,
  onSelectContract,
}: AllContractsModalProps) {
  const { isDeskeoEmployee, plan } = useClientLayout()

  // Check if expired contract banner is visible
  const showBanner = !isDeskeoEmployee && !plan

  if (!open) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          "fixed z-50 bg-background",
          // Mobile: full screen
          "inset-0",
          showBanner && "top-[56px] sm:top-[58px]",
          // Desktop: centered modal
          "md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-full md:max-w-lg md:max-h-[85vh] md:rounded-[20px]"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-4 md:rounded-t-[20px]">
          <h1 className="font-header text-xl font-bold uppercase tracking-tight">
            Tous les contrats
          </h1>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className={cn(
            "overflow-y-auto overscroll-contain p-4",
            // Mobile heights
            showBanner
              ? "h-[calc(100vh-57px-56px)] sm:h-[calc(100vh-57px-58px)]"
              : "h-[calc(100vh-57px)]",
            // Desktop: auto height within max-height
            "md:h-auto md:max-h-[calc(85vh-64px)]"
          )}
        >
          <div className="space-y-3">
            {contracts.map((contract) => (
              <ContractListCard
                key={contract.id}
                contract={contract}
                onSelect={(c) => {
                  onSelectContract?.(c)
                  onOpenChange(false) // Close the "all contracts" modal
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
