"use client"

import * as React from "react"
import { ChevronDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

export interface MultiSelectOption {
  value: string
  label: string
}

interface MultiSelectCheckboxProps {
  options: MultiSelectOption[]
  value: string[] // Array of selected values (empty = none selected)
  onValueChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  allLabel?: string
  className?: string
  triggerClassName?: string
}

export function MultiSelectCheckbox({
  options,
  value,
  onValueChange,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  allLabel = "Tous",
  className,
  triggerClassName,
}: MultiSelectCheckboxProps) {
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")

  const allSelected = value.length === options.length && options.length > 0
  const noneSelected = value.length === 0
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelectAll = () => {
    if (allSelected) {
      // Uncheck all
      onValueChange([])
    } else {
      // Select all
      onValueChange(options.map((o) => o.value))
    }
  }

  const handleOptionToggle = (optionValue: string) => {
    if (value.includes(optionValue)) {
      // Remove from selection
      onValueChange(value.filter((v) => v !== optionValue))
    } else {
      // Add to selection
      onValueChange([...value, optionValue])
    }
  }

  const isOptionSelected = (optionValue: string) => {
    return value.includes(optionValue)
  }

  const getDisplayText = () => {
    if (noneSelected) return placeholder
    if (allSelected) return allLabel
    if (value.length === 1) {
      return options.find((o) => o.value === value[0])?.label || placeholder
    }
    return `${value.length} sélectionnés`
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal",
            noneSelected && "text-muted-foreground",
            triggerClassName
          )}
        >
          <span className="truncate">{getDisplayText()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn("w-[220px] p-0", className)}
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onWheel={(e) => e.stopPropagation()}
      >
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <div
          className="max-h-[280px] overflow-y-auto p-1"
          onWheel={(e) => e.stopPropagation()}
        >
          {/* All option */}
          <label
            className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
            onClick={handleSelectAll}
          >
            <Checkbox
              checked={allSelected}
              onCheckedChange={handleSelectAll}
              className="pointer-events-none"
            />
            <span className="text-sm font-medium">{allLabel}</span>
          </label>

          <div className="h-px bg-border my-1" />

          {/* Individual options */}
          {filteredOptions.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer hover:bg-accent"
              onClick={() => handleOptionToggle(option.value)}
            >
              <Checkbox
                checked={isOptionSelected(option.value)}
                onCheckedChange={() => handleOptionToggle(option.value)}
                className="pointer-events-none"
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}

          {filteredOptions.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucun résultat
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
