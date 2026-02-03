"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, RotateCcw, Minus, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  isWeekend,
  isBefore,
  startOfDay,
  addDays,
  getDay,
  isAfter,
} from "date-fns"
import { fr } from "date-fns/locale"

interface ScrollableCalendarProps {
  selectedDates: Date[]
  onDatesChange: (dates: Date[]) => void
  passType: "day" | "week" | "month"
  seats: number
  onSeatsChange: (seats: number) => void
}

// Calculate Easter date using Anonymous Gregorian algorithm
function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1

  return new Date(year, month - 1, day)
}

function getFrenchHolidays(year: number): Date[] {
  const holidays: Date[] = []

  // Fixed holidays
  holidays.push(new Date(year, 0, 1)) // Jour de l'an
  holidays.push(new Date(year, 4, 1)) // Fête du Travail
  holidays.push(new Date(year, 4, 8)) // Victoire 1945
  holidays.push(new Date(year, 6, 14)) // Fête nationale
  holidays.push(new Date(year, 7, 15)) // Assomption
  holidays.push(new Date(year, 10, 1)) // Toussaint
  holidays.push(new Date(year, 10, 11)) // Armistice
  holidays.push(new Date(year, 11, 25)) // Noël

  // Easter-based holidays
  const easter = getEaster(year)
  holidays.push(addDays(easter, 1)) // Lundi de Pâques
  holidays.push(addDays(easter, 39)) // Ascension
  holidays.push(addDays(easter, 50)) // Lundi de Pentecôte

  return holidays
}

function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some((h) => isSameDay(h, date))
}

function isBusinessDay(date: Date, holidays: Date[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays)
}

function getBusinessDaysInRange(startDate: Date, endDate: Date, holidays: Date[]): Date[] {
  const dates: Date[] = []
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  for (const day of allDays) {
    if (isBusinessDay(day, holidays)) {
      dates.push(day)
    }
  }

  return dates
}

const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"]

// Get stable initial date for SSR (start of current day, without time component that could differ)
function getStableDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export function ScrollableCalendar({
  selectedDates,
  onDatesChange,
  passType,
  seats,
  onSeatsChange,
}: ScrollableCalendarProps) {
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => getStableDate())
  const [today, setToday] = useState(() => getStableDate())
  const [minDate, setMinDate] = useState(() => getStableDate())
  const [rangeStart, setRangeStart] = useState<Date | null>(null)

  // Initialize dates on client only to avoid hydration mismatch
  useEffect(() => {
    const now = new Date()
    const todayDate = startOfDay(now)
    setToday(todayDate)
    setCurrentMonth(todayDate)

    // J+1, or today if before 18h
    if (now.getHours() < 18) {
      setMinDate(todayDate)
    } else {
      setMinDate(addDays(todayDate, 1))
    }

    setMounted(true)
  }, [])

  const holidays = useMemo(() => {
    const year = today.getFullYear()
    return [...getFrenchHolidays(year), ...getFrenchHolidays(year + 1)]
  }, [today])

  const handleDateClick = useCallback(
    (date: Date) => {
      if (isBefore(date, minDate)) return
      if (isWeekend(date)) return
      if (isHoliday(date, holidays)) return

      if (passType === "day") {
        // Single day selection
        onDatesChange([date])
        setRangeStart(null)
      } else {
        // Range selection mode
        if (!rangeStart) {
          // First click: set range start
          setRangeStart(date)
          onDatesChange([date])
        } else {
          // Second click: complete range
          const start = isBefore(date, rangeStart) ? date : rangeStart
          const end = isAfter(date, rangeStart) ? date : rangeStart

          const businessDays = getBusinessDaysInRange(start, end, holidays)
          onDatesChange(businessDays)
          setRangeStart(null)
        }
      }
    },
    [passType, holidays, minDate, onDatesChange, rangeStart]
  )

  const handleReset = useCallback(() => {
    onDatesChange([])
    setRangeStart(null)
  }, [onDatesChange])

  const renderMonth = useCallback(
    (monthDate: Date) => {
      const monthStart = startOfMonth(monthDate)
      const monthEnd = endOfMonth(monthDate)
      const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

      const firstDayOfWeek = getDay(monthStart)
      const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

      return (
        <div className="flex-1 min-w-[280px]">
          <h3 className="mb-3 text-center text-sm font-semibold capitalize">
            {format(monthDate, "MMMM yyyy", { locale: fr })}
          </h3>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS_SHORT.map((day, i) => (
              <div
                key={i}
                className={cn(
                  "aspect-square flex items-center justify-center text-xs font-semibold",
                  i >= 5 && "text-muted-foreground/50"
                )}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startOffset }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {days.map((day) => {
              const isDisabled = isBefore(day, minDate)
              const isWeekendDay = isWeekend(day)
              const isHolidayDay = isHoliday(day, holidays)
              const isSelected = selectedDates.some((d) => isSameDay(d, day))
              const isTodayDay = isSameDay(day, today)
              const isUnavailable = isDisabled || isWeekendDay || isHolidayDay

              const sortedDates = [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
              const isStart = sortedDates.length > 0 && isSameDay(day, sortedDates[0])
              const isEnd = sortedDates.length > 0 && isSameDay(day, sortedDates[sortedDates.length - 1])
              const isMiddle = isSelected && !isStart && !isEnd

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => !isUnavailable && handleDateClick(day)}
                  disabled={isUnavailable}
                  className={cn(
                    "aspect-square flex items-center justify-center text-sm font-medium transition-colors rounded-lg",
                    !isUnavailable && !isSelected && "hover:bg-muted cursor-pointer",
                    isUnavailable && "text-muted-foreground/30 cursor-not-allowed",
                    (isWeekendDay || isHolidayDay) && "line-through decoration-muted-foreground/40",
                    isTodayDay && !isSelected && "border-2 border-foreground",
                    (isStart || isEnd) && "bg-foreground text-background font-bold",
                    isStart && selectedDates.length > 1 && "rounded-r-none",
                    isEnd && selectedDates.length > 1 && "rounded-l-none",
                    isMiddle && "rounded-none bg-[#F1E8DC] text-foreground"
                  )}
                >
                  {format(day, "d")}
                </button>
              )
            })}
          </div>
        </div>
      )
    },
    [selectedDates, holidays, today, minDate, handleDateClick]
  )

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <div className="rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <span className="text-sm font-medium text-muted-foreground">
            Sélectionnez vos dates
          </span>
        </div>
        <div className="h-[300px] flex items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <span className="text-sm font-medium text-muted-foreground">
          {rangeStart && passType !== "day"
            ? "Sélectionnez la date de fin"
            : "Sélectionnez vos dates"}
        </span>
        {selectedDates.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleReset} className="text-xs text-muted-foreground">
            <RotateCcw className="mr-1 h-3 w-3" />
            Réinitialiser
          </Button>
        )}
      </div>

      {/* Desktop: Navigation + 2 months */}
      <div className="hidden sm:flex items-center justify-between px-4 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          disabled={isSameMonth(currentMonth, today)}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 hover:bg-muted rounded-lg"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="hidden sm:flex gap-6 px-4 pb-4">
        {renderMonth(currentMonth)}
        {renderMonth(addMonths(currentMonth, 1))}
      </div>

      {/* Mobile: Sticky weekdays header + 12 months scroll */}
      <div className="sm:hidden">
        <div className="sticky top-[53px] z-10 grid grid-cols-7 gap-1 px-4 py-2 bg-card border-b border-border">
          {DAYS_SHORT.map((day, i) => (
            <div
              key={i}
              className={cn(
                "aspect-square flex items-center justify-center text-xs font-semibold",
                i >= 5 && "text-muted-foreground/50"
              )}
            >
              {day}
            </div>
          ))}
        </div>
        <div className="max-h-[280px] overflow-y-auto px-4 pb-4 space-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>{renderMonth(addMonths(today, i))}</div>
          ))}
        </div>
      </div>

      {/* Selected info */}
      {selectedDates.length > 0 && (
        <div className="border-t border-border px-4 py-3">
          <p className="text-sm">
            <span className="font-semibold">{selectedDates.length} jour{selectedDates.length > 1 ? "s" : ""}</span>
            {" ouvré"}{selectedDates.length > 1 ? "s" : ""} sélectionné{selectedDates.length > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Seats selector */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Nombre de postes</span>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onSeatsChange(Math.max(1, seats - 1))}
              disabled={seats <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-8 text-center text-lg font-bold">{seats}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-full"
              onClick={() => onSeatsChange(seats + 1)}
              disabled={seats >= 6}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {seats >= 6 && (
          <div className="mt-3 rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              Pour plus de 6 postes, contactez-nous pour un devis personnalisé ou découvrez nos{" "}
              <a
                href="https://www.deskeo.com/fr/work-spaces/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                bureaux opérés
              </a>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
