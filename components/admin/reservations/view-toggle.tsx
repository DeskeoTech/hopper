"use client"

import { CalendarDays, Calendar, List } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="inline-flex rounded-lg border border-border bg-muted/50 p-1">
      {views.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => onViewChange(value)}
          className={cn(
            "gap-2 rounded-md px-3",
            currentView === value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      ))}
    </div>
  )
}
