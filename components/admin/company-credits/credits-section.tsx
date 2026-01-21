import { Coins } from "lucide-react"
import { CreditsHistoryTable } from "./credits-history-table"
import type { CreditMovement } from "@/lib/types/database"

interface CreditsSectionProps {
  companyId: string
  totalCredits: number
  movements: CreditMovement[]
}

export function CreditsSection({ companyId, totalCredits, movements }: CreditsSectionProps) {
  return (
    <div className="rounded-lg bg-card p-4 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 type-h3 text-foreground">
        <Coins className="h-5 w-5" />
        Crédits
      </h2>

      {/* Credit Balance Card */}
      <div className="mb-6 rounded-lg border border-border bg-muted/30 p-4 sm:p-6">
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Solde actuel</p>
            <p className="text-4xl font-bold text-foreground">{totalCredits}</p>
            <p className="text-sm text-muted-foreground">crédits disponibles</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Coins className="h-8 w-8 text-primary" />
            </div>
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
  )
}
