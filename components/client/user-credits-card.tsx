"use client"

import { useState } from "react"
import { Ticket, ChevronRight } from "lucide-react"
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
        className="group relative w-full rounded-[16px] bg-card p-5 text-left shadow-sm transition-all duration-200 hover:shadow-md"
      >
        <div className="mb-3">
          <Ticket className="h-6 w-6 text-foreground/30" />
        </div>
        <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
          Mes crédits
        </p>
        <p className="mt-1 font-medium text-foreground">{displayValue}</p>
        <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/30 transition-transform duration-200 group-hover:translate-x-1" />
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
