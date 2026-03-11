import { cn } from "@/lib/utils"
import type { CompanyPaymentStatus } from "@/lib/actions/stripe"

interface CompanyPaymentStatusBadgeProps {
  status: CompanyPaymentStatus
  size?: "sm" | "md"
}

const statusConfig: Record<CompanyPaymentStatus, {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
}> = {
  ok: {
    label: "Payé",
    bgClass: "bg-success/10",
    textClass: "text-success",
    borderClass: "border-success/30",
    dotClass: "bg-success",
  },
  failed: {
    label: "Échoué",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/30",
    dotClass: "bg-destructive",
  },
  none: {
    label: "—",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    dotClass: "bg-muted-foreground",
  },
}

export function CompanyPaymentStatusBadge({
  status,
  size = "sm",
}: CompanyPaymentStatusBadgeProps) {
  const config = statusConfig[status]

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
