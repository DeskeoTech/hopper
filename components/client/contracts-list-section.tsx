"use client"

import { useState, useMemo } from "react"
import { FileText, ChevronRight, Coffee } from "lucide-react"
import { useTranslations } from "next-intl"
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
  const tCompany = useTranslations("company")
  const [showAllModal, setShowAllModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<ContractForDisplay | null>(null)

  // Filter active/non-terminated contracts and sort by start date
  const activeContracts = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0]
    return contracts
      .filter((c) => {
        return c.status !== "terminated" && (!c.end_date || c.end_date >= todayStr)
      })
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
        return dateB - dateA
      })
  }, [contracts])

  // Split into coworking and café contracts
  const coworkingContracts = useMemo(
    () => activeContracts.filter((c) => c.service_type !== "coffee_subscription"),
    [activeContracts]
  )
  const cafeContracts = useMemo(
    () => activeContracts.filter((c) => c.service_type === "coffee_subscription"),
    [activeContracts]
  )

  const visibleCoworking = coworkingContracts.slice(0, MAX_VISIBLE_CONTRACTS)
  const hasMoreCoworking = coworkingContracts.length > MAX_VISIBLE_CONTRACTS

  const handleSelectContract = (contract: ContractForDisplay) => {
    setSelectedContract(contract)
  }

  return (
    <div className="space-y-8">
      {/* Coworking passes */}
      <section className="space-y-4">
        <h2 className="font-header text-2xl text-foreground">{tCompany("pass")}</h2>

        {coworkingContracts.length === 0 ? (
          <div className="rounded-[16px] bg-card p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
              <FileText className="h-7 w-7 text-foreground/40" />
            </div>
            <p className="mt-4 text-base text-muted-foreground">{tCompany("noActivePass")}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {visibleCoworking.map((contract) => (
                <ContractListCard
                  key={contract.id}
                  contract={contract}
                  onSelect={handleSelectContract}
                />
              ))}
            </div>

            {hasMoreCoworking && (
              <button
                type="button"
                onClick={() => setShowAllModal(true)}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-foreground/5 px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
              >
                <span>{tCompany("viewAllPasses", { count: coworkingContracts.length })}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </>
        )}
      </section>

      {/* Café passes */}
      <section className="space-y-4">
        <h2 className="font-header text-2xl text-foreground">{tCompany("cafePass")}</h2>

        {cafeContracts.length === 0 ? (
          <div className="rounded-[16px] bg-card p-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
              <Coffee className="h-7 w-7 text-foreground/40" />
            </div>
            <p className="mt-4 text-base text-muted-foreground">{tCompany("noActiveCafePass")}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cafeContracts.map((contract) => (
              <ContractListCard
                key={contract.id}
                contract={contract}
                onSelect={handleSelectContract}
              />
            ))}
          </div>
        )}
      </section>

      {/* Modal with all coworking contracts - lazy rendered */}
      {showAllModal && (
        <AllContractsModal
          open={showAllModal}
          onOpenChange={setShowAllModal}
          contracts={coworkingContracts}
          onSelectContract={handleSelectContract}
        />
      )}

      {/* Contract detail modal - lazy rendered */}
      {selectedContract && (
        <ContractDetailModal
          contract={selectedContract}
          open={!!selectedContract}
          onOpenChange={(open) => !open && setSelectedContract(null)}
        />
      )}
    </div>
  )
}
