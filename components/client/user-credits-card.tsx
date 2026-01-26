import { Ticket } from "lucide-react"
import type { UserCredits } from "@/lib/types/database"

interface UserCreditsCardProps {
  credits: UserCredits | null
}

export function UserCreditsCard({ credits }: UserCreditsCardProps) {
  const displayValue = credits
    ? `${credits.remaining} crédit${credits.remaining > 1 ? "s" : ""} restant${credits.remaining > 1 ? "s" : ""}`
    : "Aucun crédit disponible"

  return (
    <div className="rounded-[20px] bg-card p-4 sm:p-6">
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
    </div>
  )
}
