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
        isOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700",
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", isOpen ? "bg-emerald-500" : "bg-red-500")} />
      {isOpen ? "Ouvert" : "Fermé"}
    </span>
  )
}
