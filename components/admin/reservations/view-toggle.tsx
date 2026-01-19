"use client"

import { CalendarDays, Calendar, List } from "lucide-react"
import { cn } from "@/lib/utils"

export type ViewMode = "week" | "month" | "list"

interface ViewToggleProps {
  currentView: ViewMode
  onViewChange: (view: ViewMode) => void
}

const views: { value: ViewMode; label: string; icon: typeof Calendar }[] = [
  { value: "week", label: "Semaine", icon: CalendarDays },
  { value: "month", label: "Mois", icon: Calendar },
  { value: "list", label: "Liste", icon: List },
]

export function ViewToggle({ currentView, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center overflow-hidden rounded-[20px] border border-border bg-white/20 p-1">
      {views.map(({ value, label, icon: Icon }, index) => (
        <button
          key={value}
          onClick={() => onViewChange(value)}
          className={cn(
            "flex items-center gap-2 rounded-[16px] px-3 py-1.5 text-xs font-bold transition-all sm:px-4",
            currentView === value
              ? "bg-foreground text-background"
              : "opacity-60 hover:opacity-100",
            index === views.length - 1 &&
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
