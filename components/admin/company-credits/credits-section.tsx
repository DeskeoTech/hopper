"use client"

import { useState } from "react"
import { Coins, Settings2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CreditsHistoryTable } from "./credits-history-table"
import { CreditAdjustmentModal } from "./credit-adjustment-modal"
import type { CreditMovement } from "@/lib/types/database"

interface CreditsSectionProps {
  companyId: string
  companyName?: string
  totalCredits: number
  movements: CreditMovement[]
}

export function CreditsSection({ companyId, companyName, totalCredits, movements }: CreditsSectionProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 type-h3 text-foreground">
            <Coins className="h-5 w-5" />
            Crédits
          </h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-primary/10"
            onClick={() => setIsModalOpen(true)}
          >
            <Settings2 className="h-4 w-4" />
            <span className="sr-only">Ajuster les crédits</span>
          </Button>
        </div>

        {/* Credit Balance Card */}
        <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Solde actuel</p>
              <p className="text-4xl font-bold text-foreground">{totalCredits}</p>
              <p className="text-sm text-muted-foreground">crédits disponibles</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 transition-all hover:bg-primary/20 hover:scale-105 cursor-pointer"
              >
                <Coins className="h-8 w-8 text-primary" />
              </button>
            </div>
          </div>
        </div>

        {/* Credits History */}
        <div>
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Historique des mouvements
          </h3>
          <CreditsHistoryTable movements={movements} />
        </div>
      </div>

      <CreditAdjustmentModal
        companyId={companyId}
        companyName={companyName}
        currentCredits={totalCredits}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </>
  )
}
