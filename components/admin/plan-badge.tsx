import { CreditCard } from "lucide-react"
import type { Plan } from "@/lib/types/database"

interface PlanBadgeProps {
  plan: Pick<Plan, "name" | "price_per_seat_month" | "credits_per_month">
}

export function PlanBadge({ plan }: PlanBadgeProps) {
  const details = plan.price_per_seat_month
    ? `${plan.price_per_seat_month} EUR/siège`
    : plan.credits_per_month
      ? `${plan.credits_per_month} crédits`
      : null

  return (
    <span className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-muted px-3 py-1.5 text-xs font-medium text-foreground">
      <CreditCard className="h-3.5 w-3.5" />
      <span>{plan.name}</span>
      {details && (
        <span className="text-muted-foreground">· {details}</span>
      )}
    </span>
  )
}
