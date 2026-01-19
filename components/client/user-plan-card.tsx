import { Package, ExternalLink, Coins } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UserPlan } from "@/lib/types/database"

interface UserPlanCardProps {
  plan: UserPlan | null
}

export function UserPlanCard({ plan }: UserPlanCardProps) {
  if (!plan) {
    return (
      <div className="rounded-[20px] border bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted">
              <Package className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <h3 className="type-h4 text-foreground">Mon forfait</h3>
              <p className="type-body-sm text-muted-foreground">
                Aucun forfait actif
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const formattedPrice = plan.pricePerSeatMonth
    ? `${plan.pricePerSeatMonth.toLocaleString("fr-FR")} €/mois`
    : null

  return (
    <div className="rounded-[20px] border bg-card p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="type-h4 text-foreground">Mon forfait</h3>
              <p className="type-h3 text-foreground">{plan.name}</p>
            </div>
          </div>

          <Button variant="outline" asChild className="w-full sm:w-auto">
            <a href="#">
              Gérer mon forfait
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>

        <div className="flex flex-wrap gap-4 text-muted-foreground">
          {formattedPrice && (
            <div className="flex items-center gap-1.5">
              <span className="type-body-sm">{formattedPrice}</span>
            </div>
          )}
          {plan.creditsPerMonth !== null && plan.creditsPerMonth > 0 && (
            <div className="flex items-center gap-1.5">
              <Coins className="h-4 w-4" />
              <span className="type-body-sm">
                {plan.creditsPerMonth} crédit{plan.creditsPerMonth > 1 ? "s" : ""}/mois
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
