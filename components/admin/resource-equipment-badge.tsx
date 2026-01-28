import type React from "react"
import type { ResourceEquipment } from "@/lib/types/database"
import { Monitor, Video, PresentationIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const resourceEquipmentConfig: Record<ResourceEquipment, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  ecran: { label: "Écran", icon: Monitor },
  visio: { label: "Visio", icon: Video },
  tableau: { label: "Tableau", icon: PresentationIcon },
}

interface ResourceEquipmentBadgeProps {
  equipment: ResourceEquipment
  size?: "sm" | "md"
}

export function ResourceEquipmentBadge({ equipment, size = "md" }: ResourceEquipmentBadgeProps) {
  const config = resourceEquipmentConfig[equipment]
  if (!config) return null

  const Icon = config.icon

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-border bg-muted font-medium text-foreground",
        size === "sm" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-1 text-xs"
      )}
    >
      <Icon className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
      {config.label}
    </span>
  )
}
