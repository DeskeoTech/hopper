"use client"

import { useState } from "react"
import { Ticket } from "lucide-react"
import { CreditsHistoryModal } from "./credits-history-modal"
import { useClientLayout } from "./client-layout-provider"

export function UserCreditsCard() {
  const { credits, creditMovements } = useClientLayout()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const displayValue = credits
    ? `${credits.remaining} crédit${credits.remaining > 1 ? "s" : ""} restant${credits.remaining > 1 ? "s" : ""}`
    : "Aucun crédit disponible"

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="w-full rounded-[20px] bg-card p-4 text-left transition-colors hover:bg-card/80 sm:p-6"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-12 sm:w-12">
            <Ticket className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-foreground sm:text-sm">
              Mes crédits
            </h3>
            <p className="type-body-sm text-muted-foreground">{displayValue}</p>
          </div>
        </div>
      </button>

      <CreditsHistoryModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        credits={credits}
        movements={creditMovements}
      />
    </>
  )
}
