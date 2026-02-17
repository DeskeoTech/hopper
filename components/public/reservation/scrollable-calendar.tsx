"use client"

import { useState, useMemo, useCallback, useEffect, memo } from "react"
import { ChevronLeft, ChevronRight, ChevronDown, Minus, Plus, Ticket, Check } from "lucide-react"
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
} from "date-fns"
import { fr } from "date-fns/locale"

interface ScrollableCalendarProps {
  selectedDates: Date[]
  onDatesChange: (dates: Date[]) => void
  onToggleDate: (date: Date) => void
  passType: "day" | "week" | "month"
  onPassTypeChange: (passType: "day" | "week" | "month") => void
  seats: number
  onSeatsChange: (seats: number) => void
}

interface MonthGridProps {
  monthDate: Date
  selectedDates: Date[]
  holidays: Date[]
  today: Date
  minDate: Date
  passType: "day" | "week" | "month"
  onDateClick: (date: Date) => void
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

function getNextBusinessDays(startDate: Date, count: number, holidays: Date[]): Date[] {
  const dates: Date[] = []
  let current = startDate
  while (dates.length < count) {
    if (isBusinessDay(current, holidays)) {
      dates.push(current)
    }
    current = addDays(current, 1)
  }
  return dates
}

const DAYS_SHORT = ["L", "M", "M", "J", "V", "S", "D"]

// Get stable initial date for SSR (start of current day, without time component that could differ)
function getStableDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

const MonthGrid = memo(function MonthGrid({
  monthDate,
  selectedDates,
  holidays,
  today,
  minDate,
  passType,
  onDateClick,
}: MonthGridProps) {
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

          // Range styling only for week/month passes
          const isRangeMode = passType !== "day" && selectedDates.length > 1
          const sortedDates = isRangeMode
            ? [...selectedDates].sort((a, b) => a.getTime() - b.getTime())
            : []
          const isStart = isRangeMode && sortedDates.length > 0 && isSameDay(day, sortedDates[0])
          const isEnd = isRangeMode && sortedDates.length > 0 && isSameDay(day, sortedDates[sortedDates.length - 1])
          const isMiddle = isRangeMode && isSelected && !isStart && !isEnd

          return (
            <button
              key={day.toISOString()}
              onClick={() => !isUnavailable && onDateClick(day)}
              disabled={isUnavailable}
              className={cn(
                "aspect-square flex items-center justify-center text-sm font-medium transition-colors rounded-lg",
                !isUnavailable && !isSelected && "hover:bg-muted cursor-pointer",
                isUnavailable && "text-muted-foreground/30 cursor-not-allowed",
                (isWeekendDay || isHolidayDay) && "line-through decoration-muted-foreground/40",
                isTodayDay && !isSelected && "border-2 border-foreground",
                // Day mode: all selected dates get same style
                passType === "day" && isSelected && "bg-foreground text-background font-bold",
                // Range mode: start/end get dark bg, middle get beige
                (isStart || isEnd) && "bg-foreground text-background font-bold",
                isStart && "rounded-r-none",
                isEnd && "rounded-l-none",
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
})

export function ScrollableCalendar({
  selectedDates,
  onDatesChange,
  onToggleDate,
  passType,
  onPassTypeChange,
  seats,
  onSeatsChange,
}: ScrollableCalendarProps) {
  const [mounted, setMounted] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(() => getStableDate())
  const [today, setToday] = useState(() => getStableDate())
  const [minDate, setMinDate] = useState(() => getStableDate())
  const [passExpanded, setPassExpanded] = useState(true)

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
        // Use stable toggle callback from parent (no selectedDates dependency)
        onToggleDate(date)
      } else if (passType === "week") {
        // Auto-select 5 business days from clicked date
        const businessDays = getNextBusinessDays(date, 5, holidays)
        onDatesChange(businessDays)
      } else if (passType === "month") {
        // Auto-select 20 business days from clicked date
        const businessDays = getNextBusinessDays(date, 20, holidays)
        onDatesChange(businessDays)
      }
    },
    [passType, holidays, minDate, onDatesChange, onToggleDate]
  )

  const handleReset = useCallback(() => {
    onDatesChange([])
  }, [onDatesChange])

  const handlePassToggle = useCallback(
    (type: "week" | "month") => {
      if (passType === type) {
        // Deselect: revert to day mode
        onPassTypeChange("day")
        onDatesChange([])
      } else {
        // Select this pass
        onPassTypeChange(type)
        onDatesChange([])
      }
    },
    [passType, onPassTypeChange, onDatesChange]
  )

  // Show loading state until client-side hydration is complete
  if (!mounted) {
    return (
      <div>
        <div className="flex items-center justify-between pb-3">
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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between pb-3">
        <span className="text-sm font-medium text-muted-foreground">
          {passType === "week"
            ? "Sélectionnez le début de votre semaine"
            : passType === "month"
            ? "Sélectionnez le début de votre mois"
            : "Sélectionnez vos dates"}
        </span>
        {selectedDates.length > 0 && (
          <button onClick={handleReset} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Réinitialiser
          </button>
        )}
      </div>

      {/* Desktop: Navigation + 2 months */}
      <div className="hidden sm:flex items-center justify-between py-2">
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

      <div className="hidden sm:flex gap-6 pb-4">
        <MonthGrid
          monthDate={currentMonth}
          selectedDates={selectedDates}
          holidays={holidays}
          today={today}
          minDate={minDate}
          passType={passType}
          onDateClick={handleDateClick}
        />
        <MonthGrid
          monthDate={addMonths(currentMonth, 1)}
          selectedDates={selectedDates}
          holidays={holidays}
          today={today}
          minDate={minDate}
          passType={passType}
          onDateClick={handleDateClick}
        />
      </div>

      {/* Mobile: Sticky weekdays header + 12 months scroll */}
      <div className="sm:hidden">
        <div className="sticky top-0 z-10 grid grid-cols-7 gap-1 py-2 bg-white border-b border-black/10">
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
        <div className="max-h-[280px] overflow-y-auto pb-4 space-y-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i}>
              <MonthGrid
                monthDate={addMonths(today, i)}
                selectedDates={selectedDates}
                holidays={holidays}
                today={today}
                minDate={minDate}
                passType={passType}
                onDateClick={handleDateClick}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Seats selector */}
      <div className="border-t border-black/10 py-4 mt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Nombre de postes</span>
          <div className="flex items-center gap-3">
            <button
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                seats <= 1
                  ? "bg-[#E6D5C3]/50 text-foreground/30 cursor-not-allowed"
                  : "bg-[#E6D5C3] text-foreground hover:bg-[#D4C4B0] cursor-pointer"
              )}
              onClick={() => onSeatsChange(Math.max(1, seats - 1))}
              disabled={seats <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center text-lg font-bold">{seats}</span>
            <button
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
                seats >= 6
                  ? "bg-[#E6D5C3]/50 text-foreground/30 cursor-not-allowed"
                  : "bg-[#E6D5C3] text-foreground hover:bg-[#D4C4B0] cursor-pointer"
              )}
              onClick={() => onSeatsChange(seats + 1)}
              disabled={seats >= 6}
            >
              <Plus className="h-4 w-4" />
            </button>
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

      {/* Pass selector */}
      <div className="border-t border-black/10 pt-4">
        <div className="rounded-[20px] bg-[#F2E7DC] p-4">
        {/* Header - collapsible toggle */}
        <button
          onClick={() => setPassExpanded(!passExpanded)}
          className="flex w-full items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5">
              <Ticket className="h-4 w-4 text-foreground/70" />
            </div>
            <span className="text-sm font-semibold">Restez plus, payez moins.</span>
          </div>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              passExpanded && "rotate-180"
            )}
          />
        </button>

        {/* Collapsible pass cards */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-200",
            passExpanded ? "max-h-[200px] opacity-100 mt-3" : "max-h-0 opacity-0"
          )}
        >
          <div className="grid grid-cols-2 gap-3 p-0.5">
            {/* Pass Week */}
            <button
              onClick={() => handlePassToggle("week")}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-[16px] p-3 text-left transition-all",
                passType === "week"
                  ? "bg-white ring-2 ring-foreground"
                  : "bg-white hover:bg-white/80"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                    passType === "week"
                      ? "border-foreground bg-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {passType === "week" && <Check className="h-3 w-3 text-background" />}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    passType === "week"
                      ? "bg-green-600 text-white"
                      : "bg-foreground/10 text-foreground/50"
                  )}
                >
                  -33%
                </span>
              </div>
              <span className="text-sm font-semibold">Pass Week</span>
            </button>

            {/* Pass Month */}
            <button
              onClick={() => handlePassToggle("month")}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-[16px] p-3 text-left transition-all",
                passType === "month"
                  ? "bg-white ring-2 ring-foreground"
                  : "bg-white hover:bg-white/80"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <div
                  className={cn(
                    "flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
                    passType === "month"
                      ? "border-foreground bg-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {passType === "month" && <Check className="h-3 w-3 text-background" />}
                </div>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold",
                    passType === "month"
                      ? "bg-green-600 text-white"
                      : "bg-foreground/10 text-foreground/50"
                  )}
                >
                  -50%
                </span>
              </div>
              <span className="text-sm font-semibold">Pass Month</span>
            </button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
