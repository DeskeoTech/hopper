import type React from "react"
import type { Equipment } from "@/lib/types/database"
import { Coffee, Bike, Printer, ShowerHead, Dumbbell, TreePine, Building } from "lucide-react"

const equipmentConfig: Record<Equipment, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  barista: { label: "Barista", icon: Coffee },
  stationnement_velo: { label: "Parking vélos", icon: Bike },
  impression: { label: "Impression", icon: Printer },
  douches: { label: "Douches", icon: ShowerHead },
  salle_sport: { label: "Salle de sport", icon: Dumbbell },
  terrasse: { label: "Terrasse", icon: TreePine },
  rooftop: { label: "Rooftop", icon: Building },
}

interface EquipmentBadgeProps {
  equipment: Equipment
}

export function EquipmentBadge({ equipment }: EquipmentBadgeProps) {
  const config = equipmentConfig[equipment]
  if (!config) return null

  const Icon = config.icon

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-muted px-3 py-1.5 text-xs font-medium text-foreground">
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  )
}
