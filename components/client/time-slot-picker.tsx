"use client"

import { cn } from "@/lib/utils"

interface TimeSlotPickerProps {
  selectedSlots: string[]
  onSlotsChange: (slots: string[]) => void
  unavailableSlots: string[]
  disabled?: boolean
}

const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
]

export function TimeSlotPicker({
  selectedSlots,
  onSlotsChange,
  unavailableSlots,
  disabled = false,
}: TimeSlotPickerProps) {
  const handleSlotClick = (slot: string) => {
    if (disabled || unavailableSlots.includes(slot)) return

    if (selectedSlots.includes(slot)) {
      // Remove slot and any slots after it to keep selection consecutive
      const slotIndex = TIME_SLOTS.indexOf(slot)
      const newSlots = selectedSlots.filter((s) => {
        const sIndex = TIME_SLOTS.indexOf(s)
        return sIndex < slotIndex
      })
      onSlotsChange(newSlots)
    } else {
      // Add slot only if it's consecutive with existing selection
      if (selectedSlots.length === 0) {
        onSlotsChange([slot])
      } else {
        const sortedSelected = [...selectedSlots].sort(
          (a, b) => TIME_SLOTS.indexOf(a) - TIME_SLOTS.indexOf(b)
        )
        const lastSelectedIndex = TIME_SLOTS.indexOf(
          sortedSelected[sortedSelected.length - 1]
        )
        const clickedIndex = TIME_SLOTS.indexOf(slot)

        // Allow adding only if consecutive (next slot after last selected)
        if (clickedIndex === lastSelectedIndex + 1) {
          // Check if any slot between would be unavailable
          onSlotsChange([...selectedSlots, slot])
        } else if (clickedIndex < TIME_SLOTS.indexOf(sortedSelected[0])) {
          // Allow prepending if consecutive before first
          const firstSelectedIndex = TIME_SLOTS.indexOf(sortedSelected[0])
          if (clickedIndex === firstSelectedIndex - 1) {
            onSlotsChange([slot, ...selectedSlots])
          }
        }
      }
    }
  }

  const formatSlotLabel = (slot: string) => {
    const hour = parseInt(slot.split(":")[0])
    const nextHour = hour + 1
    return `${hour}h - ${nextHour}h`
  }

  return (
    <div className="space-y-3">
      <p className="type-body-sm text-muted-foreground">
        Sélectionnez des créneaux consécutifs
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlots.includes(slot)
          const isUnavailable = unavailableSlots.includes(slot)

          return (
            <button
              key={slot}
              type="button"
              onClick={() => handleSlotClick(slot)}
              disabled={disabled || isUnavailable}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                isUnavailable && "cursor-not-allowed bg-muted text-muted-foreground opacity-50",
                isSelected && !isUnavailable && "border-primary bg-primary text-primary-foreground",
                !isSelected && !isUnavailable && "border-border bg-background hover:border-primary hover:bg-primary/5",
                disabled && "pointer-events-none opacity-50"
              )}
            >
              {formatSlotLabel(slot)}
            </button>
          )
        })}
      </div>
      {selectedSlots.length > 0 && (
        <p className="type-body-sm text-foreground">
          {selectedSlots.length} heure{selectedSlots.length > 1 ? "s" : ""} sélectionnée{selectedSlots.length > 1 ? "s" : ""}
        </p>
      )}
    </div>
  )
}
