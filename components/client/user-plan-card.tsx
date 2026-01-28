import { CreditCard, ChevronRight } from "lucide-react"
import type { UserPlan } from "@/lib/types/database"

interface UserPlanCardProps {
  plan: UserPlan | null
}

export function UserPlanCard({ plan }: UserPlanCardProps) {
  return (
    <div className="group relative rounded-[16px] bg-card p-5 shadow-sm transition-all duration-200 hover:shadow-md">
      <div className="mb-3">
        <CreditCard className="h-6 w-6 text-foreground/30" />
      </div>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
        Mon forfait
      </p>
      <p className="mt-1 font-medium text-foreground">
        {plan ? plan.name : "Aucun forfait actif"}
      </p>
      <ChevronRight className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/30 transition-transform duration-200 group-hover:translate-x-1" />
    </div>
  )
}
