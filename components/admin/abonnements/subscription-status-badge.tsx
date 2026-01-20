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
      bgClass: "bg-success/10 text-success border-success/30",
      dotClass: "bg-success",
    },
    inactif: {
      label: "Inactif",
      bgClass: "bg-muted text-muted-foreground border-muted-foreground/30",
      dotClass: "bg-muted-foreground",
    },
    expirant: {
      label: "Expire bientot",
      bgClass: "bg-warning/10 text-warning border-warning/30",
      dotClass: "bg-warning",
    },
  }

  const { label, bgClass, dotClass } = config[status]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-medium",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        bgClass
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-sm", dotClass)} />
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
