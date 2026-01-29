"use client"

import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ContractForDisplay, ReservationItemType } from "@/lib/types/database"

interface ContractCardProps {
  contract: ContractForDisplay
  type: ReservationItemType
  isPast?: boolean
}

const typeLabels: Record<ReservationItemType, string> = {
  meeting_room: "SALLE DE RÉUNION",
  pass_day: "PASS DAY",
  pass_week: "PASS WEEK",
  pass_month: "PASS MONTH",
}

export function ContractCard({ contract, type, isPast = false }: ContractCardProps) {
  const startDate = contract.start_date ? parseISO(contract.start_date) : null
  const endDate = contract.end_date ? parseISO(contract.end_date) : null

  const formatDate = (date: Date) => format(date, "d MMM yyyy", { locale: fr })

  const isTerminated = contract.status === "terminated"

  return (
    <div
      className={cn(
        "flex-shrink-0 w-[160px] rounded-[16px] bg-card p-4 transition-all duration-200",
        isPast && "opacity-50"
      )}
    >
      <div className="flex flex-col items-center text-center">
        {/* Type tag */}
        <span className="mb-2 rounded-full bg-foreground/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-foreground/70">
          {typeLabels[type]}
        </span>

        {/* Plan name */}
        <p className="font-header text-sm font-semibold text-foreground line-clamp-2">
          {contract.plan_name}
        </p>

        {/* Date range */}
        <div className="mt-2 text-[10px] text-foreground/70">
          {startDate && endDate ? (
            <p>
              {formatDate(startDate)} → {formatDate(endDate)}
            </p>
          ) : startDate ? (
            <p>Depuis le {formatDate(startDate)}</p>
          ) : (
            <p>—</p>
          )}
        </div>

        {/* Site name */}
        {contract.site_name && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px] text-foreground/40">
            <MapPin className="h-2.5 w-2.5" />
            <span className="truncate max-w-[110px]">{contract.site_name}</span>
          </div>
        )}

        {/* Status badge */}
        {(isPast || isTerminated) && (
          <span className="mt-2.5 rounded-full bg-foreground/5 px-2.5 py-0.5 text-[10px] text-foreground/50">
            {isTerminated ? "Terminé" : "Passé"}
          </span>
        )}
      </div>
    </div>
  )
}
