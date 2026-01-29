import { cn } from "@/lib/utils"

export type SubscriptionStatus = "actif" | "inactif" | "expirant"

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus
  size?: "sm" | "md"
}

export function SubscriptionStatusBadge({ status, size = "sm" }: SubscriptionStatusBadgeProps) {
  const config = {
    actif: {
      label: "Actif",
      dotClass: "text-success",
    },
    inactif: {
      label: "Inactif",
      dotClass: "text-muted-foreground",
    },
    expirant: {
      label: "Expire bientôt",
      dotClass: "text-warning",
    },
  }

  const { label, dotClass } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-medium text-foreground",
        size === "sm" ? "text-sm" : "text-base"
      )}
    >
      <span className={cn("text-base", dotClass)}>●</span>
      {label}
    </span>
  )
}

export function getSubscriptionStatus(endDate: string | null): SubscriptionStatus {
  if (!endDate) return "actif"

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)

  if (end <= today) return "inactif"

  const thirtyDaysFromNow = new Date(today)
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  if (end <= thirtyDaysFromNow) return "expirant"

  return "actif"
}
