"use client"

import { useState, useRef, useCallback, useMemo, useEffect } from "react"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

interface TimeSlotPickerProps {
  selectedSlots: string[]
  onSlotsChange: (slots: string[]) => void
  unavailableSlots: string[]
  disabled?: boolean
}

const MIN_HOUR = 8
const MAX_HOUR = 20
const TOTAL_HOURS = MAX_HOUR - MIN_HOUR
const ALL_HOURS = Array.from({ length: TOTAL_HOURS }, (_, i) => MIN_HOUR + i)

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
  const t = useTranslations("bookingCreate")
  const trackRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<"start" | "end" | null>(null)

  // Derive current start and end from selected slots
  const { startHour, endHour } = useMemo(() => {
    if (selectedSlots.length === 0) return { startHour: null, endHour: null }
    const sorted = [...selectedSlots].sort()
    return {
      startHour: slotToHour(sorted[0]),
      endHour: slotToHour(sorted[sorted.length - 1]) + 1,
    }
  }, [selectedSlots])

  // Convert pixel position to nearest hour
  const posToHour = useCallback((clientX: number): number => {
    if (!trackRef.current) return MIN_HOUR
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = (clientX - rect.left) / rect.width
    return Math.max(MIN_HOUR, Math.min(MAX_HOUR, Math.round(ratio * TOTAL_HOURS) + MIN_HOUR))
  }, [])

  // Max valid end for a given start (stops at first unavailable slot)
  const maxEndForStart = useCallback(
    (start: number): number => {
      for (let h = start; h < MAX_HOUR; h++) {
        if (unavailableSlots.includes(hourToSlot(h))) return h
      }
      return MAX_HOUR
    },
    [unavailableSlots]
  )

  // Min valid start for a given end (stops at last unavailable slot before end)
  const minStartForEnd = useCallback(
    (end: number): number => {
      for (let h = end - 1; h >= MIN_HOUR; h--) {
        if (unavailableSlots.includes(hourToSlot(h))) return h + 1
      }
      return MIN_HOUR
    },
    [unavailableSlots]
  )

  const setSlotsFromRange = useCallback(
    (start: number, end: number) => {
      const slots: string[] = []
      for (let h = start; h < end; h++) {
        slots.push(hourToSlot(h))
      }
      onSlotsChange(slots)
    },
    [onSlotsChange]
  )

  // Click on a track segment → start new 1-hour selection
  const handleSegmentClick = useCallback(
    (hour: number) => {
      if (disabled || unavailableSlots.includes(hourToSlot(hour))) return
      setSlotsFromRange(hour, Math.min(hour + 1, maxEndForStart(hour)))
    },
    [disabled, unavailableSlots, setSlotsFromRange, maxEndForStart]
  )

  // Quick duration selection
  const handleDurationSelect = useCallback(
    (hours: number) => {
      if (startHour === null || disabled) return
      const maxEnd = maxEndForStart(startHour)
      const newEnd = Math.min(startHour + hours, maxEnd)
      if (newEnd > startHour) {
        setSlotsFromRange(startHour, newEnd)
      }
    },
    [startHour, disabled, maxEndForStart, setSlotsFromRange]
  )

  // Drag logic via document listeners
  useEffect(() => {
    if (!dragging) return

    const onMove = (e: PointerEvent) => {
      e.preventDefault()
      const hour = posToHour(e.clientX)

      if (dragging === "start" && endHour !== null) {
        const minStart = minStartForEnd(endHour)
        const clampedStart = Math.max(minStart, Math.min(hour, endHour - 1))
        if (clampedStart !== startHour) {
          setSlotsFromRange(clampedStart, endHour)
        }
      } else if (dragging === "end" && startHour !== null) {
        const maxEnd = maxEndForStart(startHour)
        const clampedEnd = Math.max(startHour + 1, Math.min(hour, maxEnd))
        if (clampedEnd !== endHour) {
          setSlotsFromRange(startHour, clampedEnd)
        }
      }
    }

    const onUp = () => setDragging(null)

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
    return () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
    }
  }, [dragging, startHour, endHour, posToHour, minStartForEnd, maxEndForStart, setSlotsFromRange])

  const duration = startHour !== null && endHour !== null ? endHour - startHour : 0
  const startPercent = startHour !== null ? ((startHour - MIN_HOUR) / TOTAL_HOURS) * 100 : 0
  const endPercent = endHour !== null ? ((endHour - MIN_HOUR) / TOTAL_HOURS) * 100 : 0

  // Available durations for quick selection
  const maxDuration = startHour !== null ? maxEndForStart(startHour) - startHour : 0
  const quickDurations = [1, 2, 3, 4].filter((d) => d <= maxDuration)

  return (
    <div className="space-y-4">
      {/* Timeline Slider */}
      <div className="relative select-none" style={{ touchAction: "none" }}>
        {/* Floating time label above selection */}
        <div className="h-8 relative">
          {startHour !== null && endHour !== null && (
            <div
              className="absolute z-20 flex justify-center pointer-events-none"
              style={{
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
              }}
            >
              <span className="text-[11px] font-semibold bg-[#1B1918] text-white px-2.5 py-1 rounded-full whitespace-nowrap">
                {startHour}h00 — {endHour}h00
              </span>
            </div>
          )}
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="relative h-12 rounded-[14px] bg-foreground/[0.04] overflow-hidden"
        >
          {/* Unavailable segments */}
          {ALL_HOURS.map((h) => {
            if (!unavailableSlots.includes(hourToSlot(h))) return null
            const left = ((h - MIN_HOUR) / TOTAL_HOURS) * 100
            const width = (1 / TOTAL_HOURS) * 100
            return (
              <div
                key={`unavail-${h}`}
                className="absolute inset-y-0 bg-foreground/[0.06]"
                style={{ left: `${left}%`, width: `${width}%` }}
              >
                <div
                  className="h-full w-full text-foreground/20"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(135deg, transparent, transparent 3px, currentColor 3px, currentColor 4px)",
                  }}
                />
              </div>
            )
          })}

          {/* Selected range */}
          {startHour !== null && endHour !== null && (
            <div
              className={cn(
                "absolute inset-y-0 bg-[#1B1918] transition-[left,width]",
                !dragging && "duration-200"
              )}
              style={{
                left: `${startPercent}%`,
                width: `${endPercent - startPercent}%`,
              }}
            >
              {/* Duration text inside bar */}
              {duration >= 2 && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-medium text-white/50">
                    {duration}h
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Vertical grid lines */}
          {ALL_HOURS.slice(1).map((h) => {
            const left = ((h - MIN_HOUR) / TOTAL_HOURS) * 100
            const isInSelection =
              startHour !== null && endHour !== null && h > startHour && h < endHour
            return (
              <div
                key={`grid-${h}`}
                className={cn(
                  "absolute inset-y-0 w-px pointer-events-none",
                  isInSelection ? "bg-white/15" : "bg-foreground/[0.06]"
                )}
                style={{ left: `${left}%` }}
              />
            )
          })}

          {/* Clickable segments */}
          {ALL_HOURS.map((h) => {
            const isUnavailable = unavailableSlots.includes(hourToSlot(h))
            const left = ((h - MIN_HOUR) / TOTAL_HOURS) * 100
            const width = (1 / TOTAL_HOURS) * 100
            return (
              <button
                key={`seg-${h}`}
                type="button"
                onClick={() => handleSegmentClick(h)}
                disabled={disabled || isUnavailable}
                className="absolute inset-y-0 z-10 cursor-pointer disabled:cursor-not-allowed"
                style={{ left: `${left}%`, width: `${width}%` }}
                aria-label={`${h}h00`}
              />
            )
          })}
        </div>

        {/* Drag handles (outside overflow-hidden track) */}
        {startHour !== null && (
          <div
            className={cn(
              "absolute top-8 -translate-x-1/2 w-7 h-12 z-30 flex items-center justify-center",
              !disabled && "cursor-ew-resize"
            )}
            style={{ left: `${startPercent}%` }}
            onPointerDown={(e) => {
              if (disabled) return
              e.preventDefault()
              e.stopPropagation()
              setDragging("start")
            }}
          >
            <div className="w-[5px] h-7 rounded-full bg-white shadow-sm" />
          </div>
        )}
        {endHour !== null && (
          <div
            className={cn(
              "absolute top-8 -translate-x-1/2 w-7 h-12 z-30 flex items-center justify-center",
              !disabled && "cursor-ew-resize"
            )}
            style={{ left: `${endPercent}%` }}
            onPointerDown={(e) => {
              if (disabled) return
              e.preventDefault()
              e.stopPropagation()
              setDragging("end")
            }}
          >
            <div className="w-[5px] h-7 rounded-full bg-white shadow-sm" />
          </div>
        )}

        {/* Hour labels below track */}
        <div className="relative h-5 mt-2">
          {ALL_HOURS.filter((_, i) => i % 2 === 0).map((h) => (
            <span
              key={`label-${h}`}
              className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
              style={{ left: `${((h - MIN_HOUR) / TOTAL_HOURS) * 100}%` }}
            >
              {h}h
            </span>
          ))}
          <span
            className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
            style={{ left: "100%" }}
          >
            20h
          </span>
        </div>
      </div>

      {/* Quick duration chips */}
      {startHour !== null && quickDurations.length > 1 && (
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground mr-1">
            {t("duration")} :
          </span>
          {quickDurations.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => handleDurationSelect(d)}
              disabled={disabled}
              className={cn(
                "h-7 min-w-[44px] rounded-full px-2.5 text-xs font-medium transition-all",
                duration === d
                  ? "bg-[#1B1918] text-white"
                  : "bg-foreground/5 text-foreground hover:bg-foreground/10"
              )}
            >
              {d}h
            </button>
          ))}
        </div>
      )}

      {/* Summary */}
      {duration > 0 && (
        <div className="rounded-[12px] bg-foreground/5 px-3 py-2">
          <p className="text-sm font-medium text-foreground">
            {startHour}h00 — {endHour}h00
            <span className="ml-2 font-normal text-muted-foreground">
              · {duration} {t("hour")}{duration > 1 ? "s" : ""}
            </span>
          </p>
        </div>
      )}
    </div>
  )
}
