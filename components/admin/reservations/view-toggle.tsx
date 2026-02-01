"use client"

import { CalendarDays, Calendar, List, DoorOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "week" | "month" | "list" | "rooms"

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
  showRoomsView?: boolean
}

const views: { value: ViewMode; label: string; icon: typeof Calendar }[] = [
  { value: "week", label: "Semaine", icon: CalendarDays },
  { value: "month", label: "Mois", icon: Calendar },
  { value: "list", label: "Liste", icon: List },
]

const roomsView = { value: "rooms" as ViewMode, label: "Salles", icon: DoorOpen }

export function ViewToggle({ currentView, onViewChange, showRoomsView = false }: ViewToggleProps) {
  const availableViews = showRoomsView ? [roomsView, ...views] : views

  return (
    <div className="flex items-center overflow-hidden rounded-[20px] border border-border bg-white/20 p-1">
      {availableViews.map(({ value, label, icon: Icon }, index) => (
        <button
          key={value}
          onClick={() => onViewChange(value)}
          className={cn(
            "flex items-center gap-2 rounded-[16px] px-3 py-1.5 text-xs font-bold transition-all sm:px-4",
            currentView === value
              ? "bg-foreground text-background"
              : "opacity-60 hover:opacity-100",
            index === availableViews.length - 1 &&
              currentView !== value &&
              "border-l border-border/10"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}
