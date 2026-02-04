"use client"

import { useState, useMemo } from "react"
import { FileText, ChevronRight } from "lucide-react"
import { ContractListCard } from "./contract-list-card"
import { AllContractsModal } from "./all-contracts-modal"
import { ContractDetailModal } from "./contract-detail-modal"
import type { ContractForDisplay } from "@/lib/types/database"

interface ContractsListSectionProps {
  contracts: ContractForDisplay[]
}

const MAX_VISIBLE_CONTRACTS = 3

export function ContractsListSection({
  contracts,
}: ContractsListSectionProps) {
  const [showAllModal, setShowAllModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<ContractForDisplay | null>(null)

  // Filter active/non-terminated contracts and sort by start date
  const activeContracts = useMemo(() => {
    const now = new Date()
    return contracts
      .filter((c) => {
        return c.status !== "terminated" && (!c.end_date || new Date(c.end_date) >= now)
      })
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
        return dateB - dateA // Most recent first
      })
  }, [contracts])

  // Show max 3 contracts with "see more" button if needed
  const visibleContracts = activeContracts.slice(0, MAX_VISIBLE_CONTRACTS)
  const hasMore = activeContracts.length > MAX_VISIBLE_CONTRACTS

  const handleSelectContract = (contract: ContractForDisplay) => {
    setSelectedContract(contract)
  }

  if (activeContracts.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="font-header text-2xl text-foreground">Contrats</h2>
        <div className="rounded-[16px] bg-card p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
            <FileText className="h-7 w-7 text-foreground/40" />
          </div>
          <p className="mt-4 text-base text-muted-foreground">Aucun contrat actif</p>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-4">
      <h2 className="font-header text-2xl text-foreground">Contrats</h2>

      {/* Contract cards */}
      <div className="space-y-3">
        {visibleContracts.map((contract) => (
          <ContractListCard
            key={contract.id}
            contract={contract}
            onSelect={handleSelectContract}
          />
        ))}
      </div>

      {/* "See all" button for admin with more than 3 contracts */}
      {hasMore && (
        <button
          type="button"
          onClick={() => setShowAllModal(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground/5 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
        >
          <span>Voir tous les contrats ({activeContracts.length})</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      )}

      {/* Modal with all contracts */}
      <AllContractsModal
        open={showAllModal}
        onOpenChange={setShowAllModal}
        contracts={activeContracts}
        onSelectContract={handleSelectContract}
      />

      {/* Contract detail modal */}
      <ContractDetailModal
        contract={selectedContract}
        open={!!selectedContract}
        onOpenChange={(open) => !open && setSelectedContract(null)}
      />
    </section>
  )
}
