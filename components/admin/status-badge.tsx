import { cn } from "@/lib/utils"
import type { SiteStatus } from "@/lib/types/database"

interface StatusBadgeProps {
  status: SiteStatus
  size?: "sm" | "md"
}

export function StatusBadge({ status, size = "sm" }: StatusBadgeProps) {
  const isOpen = status === "open"

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border font-medium",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        isOpen
          ? "bg-success/10 text-success border-success/30"
          : "bg-destructive/10 text-destructive border-destructive/30",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-sm", isOpen ? "bg-success" : "bg-destructive")} />
      {isOpen ? "Ouvert" : "Fermé"}
    </span>
  )
}
