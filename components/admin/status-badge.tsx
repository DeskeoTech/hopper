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
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        isOpen ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-success" : "bg-destructive")} />
      {isOpen ? "Ouvert" : "Fermé"}
    </span>
  )
}
