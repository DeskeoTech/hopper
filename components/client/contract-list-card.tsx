"use client"

import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { FileText, ChevronRight } from "lucide-react"
import type { ContractForDisplay } from "@/lib/types/database"

interface ContractListCardProps {
  contract: ContractForDisplay
  onSelect?: (contract: ContractForDisplay) => void
}

export function ContractListCard({ contract, onSelect }: ContractListCardProps) {
  const startDate = contract.start_date ? parseISO(contract.start_date) : null
  const endDate = contract.end_date ? parseISO(contract.end_date) : null

  const formatDate = (date: Date) => format(date, "d MMM yyyy", { locale: fr })

  const isTerminated = contract.status === "terminated"
  const isSuspended = contract.status === "suspended"

  // Ongoing = active, started, and not ended yet
  const now = new Date()
  const isOngoing =
    contract.status === "active" &&
    startDate &&
    startDate <= now &&
    (!endDate || endDate >= now)

  // Build date string
  let dateString = "—"
  if (startDate && endDate) {
    dateString = `${formatDate(startDate)} → ${formatDate(endDate)}`
  } else if (startDate) {
    dateString = `Depuis le ${formatDate(startDate)}`
  }

  // Build seats string
  const seatsString =
    contract.number_of_seats !== null
      ? `${contract.number_of_seats} poste${contract.number_of_seats > 1 ? "s" : ""}`
      : null

  const handleClick = () => {
    if (onSelect) {
      onSelect(contract)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full rounded-[16px] bg-card p-5 text-left border border-foreground/10 hover:border-foreground/30 transition-colors cursor-pointer"
    >
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/5">
          <FileText className="h-6 w-6 text-foreground/60" />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="font-header text-base font-semibold uppercase tracking-tight text-foreground">
            {contract.plan_name}
          </p>
          <p className="mt-1 text-sm text-foreground/60">{dateString}</p>
          {seatsString && (
            <p className="mt-0.5 text-sm text-foreground/40">{seatsString}</p>
          )}
        </div>

        {/* Status badge */}
        <div className="flex shrink-0 items-center gap-2">
          {isOngoing && (
            <span className="rounded-full bg-green-500/20 px-3 py-1.5 text-sm font-semibold text-green-700">
              En cours
            </span>
          )}
          {isSuspended && (
            <span className="rounded-full bg-orange-500/20 px-3 py-1.5 text-sm font-semibold text-orange-700">
              Suspendu
            </span>
          )}
          {isTerminated && (
            <span className="rounded-full bg-foreground/5 px-3 py-1.5 text-sm text-foreground/50">
              Terminé
            </span>
          )}
          {!isOngoing && !isSuspended && !isTerminated && (
            <span className="rounded-full bg-blue-500/20 px-3 py-1.5 text-sm font-semibold text-blue-700">
              À venir
            </span>
          )}
          <ChevronRight className="h-5 w-5 text-foreground/30" />
        </div>
      </div>
    </button>
  )
}
