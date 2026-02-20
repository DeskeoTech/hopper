"use client"

import { useMemo, useCallback } from "react"
import { cn } from "@/lib/utils"

interface TimeSlotPickerProps {
  selectedSlots: string[]
  onSlotsChange: (slots: string[]) => void
  unavailableSlots: string[]
  disabled?: boolean
}

const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]

function hourToSlot(h: number): string {
  return `${h.toString().padStart(2, "0")}:00`
}

function slotToHour(slot: string): number {
  return parseInt(slot.split(":")[0])
}

export function TimeSlotPicker({
  selectedSlots,
  onSlotsChange,
  unavailableSlots,
  disabled = false,
}: TimeSlotPickerProps) {
  // Derive current start and end from selected slots
  const { startHour, endHour } = useMemo(() => {
    if (selectedSlots.length === 0) return { startHour: null, endHour: null }
    const sorted = [...selectedSlots].sort()
    return {
      startHour: slotToHour(sorted[0]),
      endHour: slotToHour(sorted[sorted.length - 1]) + 1,
    }
  }, [selectedSlots])

  // Available end hours: consecutive available hours after start
  const availableEnds = useMemo(() => {
    if (startHour === null) return []
    const ends: number[] = []
    for (let h = startHour; h < 20; h++) {
      // If this hour is unavailable (and not the start itself), stop
      if (h > startHour && unavailableSlots.includes(hourToSlot(h))) break
      ends.push(h + 1)
    }
    return ends
  }, [startHour, unavailableSlots])

  // Set start and auto-select 1 hour
  const handleStartChange = useCallback(
    (hour: number) => {
      if (disabled) return
      onSlotsChange([hourToSlot(hour)])
    },
    [disabled, onSlotsChange]
  )

  // Set end and fill all slots between start and end
  const handleEndChange = useCallback(
    (end: number) => {
      if (disabled || startHour === null) return
      const slots: string[] = []
      for (let h = startHour; h < end; h++) {
        slots.push(hourToSlot(h))
      }
      onSlotsChange(slots)
    },
    [disabled, startHour, onSlotsChange]
  )

  const duration =
    startHour !== null && endHour !== null ? endHour - startHour : 0

  return (
    <div className="space-y-4">
      {/* Start time */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">
          Heure de début
        </label>
        <div className="flex flex-wrap gap-1.5">
          {HOURS.map((h) => {
            const isUnavailable = unavailableSlots.includes(hourToSlot(h))
            const isSelected = h === startHour
            return (
              <button
                key={h}
                type="button"
                onClick={() => handleStartChange(h)}
                disabled={disabled || isUnavailable}
                className={cn(
                  "h-9 min-w-[44px] rounded-full px-2 text-sm font-medium transition-all",
                  isUnavailable &&
                    "cursor-not-allowed bg-muted text-muted-foreground/40 line-through",
                  isSelected &&
                    !isUnavailable &&
                    "bg-[#1B1918] text-white",
                  !isSelected &&
                    !isUnavailable &&
                    "bg-foreground/5 text-foreground hover:bg-foreground/10"
                )}
              >
                {h}h
              </button>
            )
          })}
        </div>
      </div>

      {/* End time */}
      {startHour !== null && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">
            Heure de fin
          </label>
          <div className="flex flex-wrap gap-1.5">
            {availableEnds.map((h) => {
              const isSelected = h === endHour
              return (
                <button
                  key={h}
                  type="button"
                  onClick={() => handleEndChange(h)}
                  disabled={disabled}
                  className={cn(
                    "h-9 min-w-[44px] rounded-full px-2 text-sm font-medium transition-all",
                    isSelected && "bg-[#1B1918] text-white",
                    !isSelected &&
                      "bg-foreground/5 text-foreground hover:bg-foreground/10"
                  )}
                >
                  {h}h
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Visual timeline bar */}
      {startHour !== null && (
        <div className="space-y-1">
          <div className="flex h-2 gap-0.5 overflow-hidden rounded-full">
            {HOURS.map((h) => {
              const isUnavailable = unavailableSlots.includes(hourToSlot(h))
              const isSelected =
                startHour !== null &&
                endHour !== null &&
                h >= startHour &&
                h < endHour
              return (
                <div
                  key={h}
                  className={cn(
                    "flex-1 transition-colors duration-200",
                    isUnavailable && !isSelected && "bg-foreground/15",
                    isSelected && "bg-[#1B1918]",
                    !isSelected && !isUnavailable && "bg-foreground/5"
                  )}
                />
              )
            })}
          </div>
          <div className="flex justify-between px-0.5">
            <span className="text-[10px] text-muted-foreground">8h</span>
            <span className="text-[10px] text-muted-foreground">14h</span>
            <span className="text-[10px] text-muted-foreground">20h</span>
          </div>
        </div>
      )}

      {/* Summary */}
      {duration > 0 && (
        <div className="rounded-[12px] bg-foreground/5 px-3 py-2">
          <p className="text-sm font-medium text-foreground">
            {startHour}h00 — {endHour}h00
            <span className="ml-2 font-normal text-muted-foreground">
              · {duration} heure{duration > 1 ? "s" : ""}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
