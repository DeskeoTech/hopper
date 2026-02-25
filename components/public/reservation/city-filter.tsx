"use client"

import { useState } from "react"
import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface CityFilterProps {
  selectedCity: "paris" | "lyon"
  onCityChange: (city: "paris" | "lyon") => void
}

const cities = [
  { id: "paris" as const, label: "Paris" },
  { id: "lyon" as const, label: "Lyon" },
]

export function CityFilter({ selectedCity, onCityChange }: CityFilterProps) {
  const [open, setOpen] = useState(false)

  const displayLabel = cities.find((c) => c.id === selectedCity)?.label ?? "Paris"

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 rounded-full border-0 bg-transparent px-3 py-1.5 text-sm font-medium hover:bg-transparent"
          suppressHydrationWarning
        >
          <span>{displayLabel}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 opacity-60 transition-transform", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto min-w-0 border-0 p-1.5" align="start">
        <div className="space-y-0.5">
          {cities.map((city) => (
            <button
              key={city.id}
              onClick={() => {
                onCityChange(city.id)
                setOpen(false)
              }}
              className={cn(
                "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                selectedCity === city.id && "bg-muted"
              )}
            >
              <span>{city.label}</span>
              {selectedCity === city.id && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}