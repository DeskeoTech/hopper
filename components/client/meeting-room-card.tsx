"use client"

import { Users, Layers, Monitor, Video, PenTool, Coins } from "lucide-react"
import { cn } from "@/lib/utils"
import type { MeetingRoomResource, ResourceEquipment } from "@/lib/types/database"

interface MeetingRoomCardProps {
  room: MeetingRoomResource
  selected: boolean
  onSelect: () => void
  disabled?: boolean
}

const EQUIPMENT_LABELS: Record<ResourceEquipment, { label: string; icon: typeof Monitor }> = {
  ecran: { label: "Écran", icon: Monitor },
  visio: { label: "Visio", icon: Video },
  tableau: { label: "Tableau", icon: PenTool },
}

const FLOOR_LABELS: Record<string, string> = {
  "R-1": "Sous-sol",
  "RDJ": "Rez-de-jardin",
  "RDC": "Rez-de-chaussée",
  "R+1": "1er étage",
  "R+2": "2ème étage",
  "R+3": "3ème étage",
  "R+4": "4ème étage",
  "R+5": "5ème étage",
}

export function MeetingRoomCard({
  room,
  selected,
  onSelect,
  disabled = false,
}: MeetingRoomCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full rounded-lg border p-4 text-left transition-all",
        selected && "border-primary bg-primary/5 ring-1 ring-primary",
        !selected && "border-border bg-card hover:border-primary/50",
        disabled && "pointer-events-none opacity-50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="type-body font-medium text-foreground truncate">
            {room.name}
          </h4>

          <div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground">
            {room.capacity && (
              <div className="flex items-center gap-1 type-body-sm">
                <Users className="h-3.5 w-3.5" />
                <span>{room.capacity} pers.</span>
              </div>
            )}
            {room.floor && (
              <div className="flex items-center gap-1 type-body-sm">
                <Layers className="h-3.5 w-3.5" />
                <span>{FLOOR_LABELS[room.floor] || room.floor}</span>
              </div>
            )}
          </div>

          {room.equipments && room.equipments.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {room.equipments.map((eq) => {
                const config = EQUIPMENT_LABELS[eq]
                if (!config) return null
                const Icon = config.icon
                return (
                  <span
                    key={eq}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 type-body-sm text-muted-foreground"
                  >
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center gap-1 text-foreground">
            <Coins className="h-4 w-4 text-primary" />
            <span className="type-body font-semibold">
              {room.hourly_credit_rate || 1}
            </span>
          </div>
          <span className="type-body-sm text-muted-foreground">/ heure</span>
        </div>
      </div>
    </button>
  )
}
