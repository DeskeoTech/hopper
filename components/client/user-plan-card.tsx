import { CreditCard } from "lucide-react"
import type { UserPlan } from "@/lib/types/database"

interface UserPlanCardProps {
  plan: UserPlan | null
}

export function UserPlanCard({ plan }: UserPlanCardProps) {
  return (
    <div className="rounded-[20px] bg-card p-4 sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted sm:h-12 sm:w-12">
          <CreditCard className="h-5 w-5 text-foreground sm:h-6 sm:w-6" />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-foreground sm:text-sm">
            Mon forfait
          </h3>
          <p className="type-body-sm text-muted-foreground">
            {plan ? plan.name : "Aucun forfait actif"}
          </p>
        </div>
      </div>
    </div>
  )
}
