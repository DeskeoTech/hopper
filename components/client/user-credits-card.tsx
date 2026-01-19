import { Coins, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import type { UserCredits } from "@/lib/types/database"

interface UserCreditsCardProps {
  credits: UserCredits | null
  onBookClick: () => void
}

export function UserCreditsCard({ credits, onBookClick }: UserCreditsCardProps) {
  if (!credits) {
    return (
      <div className="rounded-[20px] border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
              <Coins className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="type-h4 text-foreground">Mes crédits</h3>
              <p className="type-body-sm text-muted-foreground">
                Aucun crédit disponible
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const periodDate = new Date(credits.period)
  const periodLabel = format(periodDate, "MMMM yyyy", { locale: fr })
  const percentage = Math.round((credits.remaining / credits.allocated) * 100)

  return (
    <div className="rounded-[20px] border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Coins className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="type-h4 text-foreground">Mes crédits</h3>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span className="type-body-sm capitalize">{periodLabel}</span>
              </div>
            </div>
          </div>

          <Button onClick={onBookClick} className="w-full sm:w-auto">
            Réserver une salle
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="type-h3 text-foreground">{credits.remaining}</span>
            <span className="type-body-sm text-muted-foreground">
              sur {credits.allocated} crédits
            </span>
          </div>

          <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="type-body-sm text-muted-foreground">
            {credits.remaining === 0
              ? "Tous vos crédits ont été utilisés ce mois-ci"
              : `${credits.remaining} crédit${credits.remaining > 1 ? "s" : ""} restant${credits.remaining > 1 ? "s" : ""} pour réserver des salles de réunion`}
          </p>
        </div>
      </div>
    </div>
  )
}
