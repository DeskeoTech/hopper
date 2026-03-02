import { cn } from "@/lib/utils"

interface PaymentStatusBadgeProps {
  paymentStatus: string | null
  sessionStatus?: string | null
  size?: "sm" | "md"
}

const statusConfig: Record<string, {
  label: string
  bgClass: string
  textClass: string
  borderClass: string
  dotClass: string
}> = {
  paid: {
    label: "Payé",
    bgClass: "bg-success/10",
    textClass: "text-success",
    borderClass: "border-success/30",
    dotClass: "bg-success",
  },
  unpaid: {
    label: "En attente",
    bgClass: "bg-warning/10",
    textClass: "text-warning",
    borderClass: "border-warning/30",
    dotClass: "bg-warning",
  },
  no_payment_required: {
    label: "Crédits",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    dotClass: "bg-muted-foreground",
  },
  expired: {
    label: "Expiré",
    bgClass: "bg-destructive/10",
    textClass: "text-destructive",
    borderClass: "border-destructive/30",
    dotClass: "bg-destructive",
  },
  unknown: {
    label: "Inconnu",
    bgClass: "bg-muted",
    textClass: "text-muted-foreground",
    borderClass: "border-border",
    dotClass: "bg-muted-foreground",
  },
}

export function PaymentStatusBadge({
  paymentStatus,
  sessionStatus,
  size = "sm",
}: PaymentStatusBadgeProps) {
  // If session expired and not paid, show as expired
  const effectiveStatus = sessionStatus === "expired" && paymentStatus !== "paid"
    ? "expired"
    : paymentStatus || "unknown"

  const config = statusConfig[effectiveStatus] || statusConfig.unknown

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
