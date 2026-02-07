import { cn } from "@/lib/utils"
import type { BookingStatus } from "@/lib/types/database"

interface BookingStatusBadgeProps {
  status: BookingStatus | null
  size?: "sm" | "md"
}

const statusConfig = {
  confirmed: {
    label: "Confirmee",
    bgClass: "bg-success/10",
    textClass: "text-success",
    borderClass: "border-success/30",
    dotClass: "bg-success",
  },
  pending: {
    label: "En attente",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    borderClass: "border-warning/30",
    dotClass: "bg-warning",
  },
  cancelled: {
    label: "Annulee",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/30",
    dotClass: "bg-destructive",
  },
}

export function BookingStatusBadge({
  status,
  size = "sm",
}: BookingStatusBadgeProps) {
  const config = status
    ? statusConfig[status]
    : {
        label: "Inconnu",
        bgClass: "bg-muted",
        textClass: "text-muted-foreground",
        borderClass: "border-border",
        dotClass: "bg-muted-foreground",
      }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        config.bgClass,
        config.textClass,
        config.borderClass
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dotClass)} />
      {config.label}
    </span>
  )
}
