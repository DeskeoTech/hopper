"use client"

import { List, MapIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface MobileToggleProps {
  view: "list" | "map"
  onViewChange: (view: "list" | "map") => void
}

export function MobileToggle({ view, onViewChange }: MobileToggleProps) {
  return (
    <div className="fixed bottom-6 right-4 z-40 lg:hidden">
      <div className="flex rounded-full bg-foreground p-1.5 shadow-2xl">
        <button
          onClick={() => onViewChange("list")}
          className={cn(
            "rounded-full p-3 transition-all",
            view === "list"
              ? "bg-background text-foreground shadow-md"
              : "text-background hover:text-background/80"
          )}
          aria-label="Vue liste"
        >
          <List className="h-5 w-5" />
        </button>
        <button
          onClick={() => onViewChange("map")}
          className={cn(
            "rounded-full p-3 transition-all",
            view === "map"
              ? "bg-background text-foreground shadow-md"
              : "text-background hover:text-background/80"
          )}
          aria-label="Vue carte"
        >
          <MapIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}
