"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useTransition, useMemo, useCallback } from "react"
import {
  format,
  parseISO,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns"
import { fr } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DateRangePicker } from "@/components/ui/date-range-picker"
import { ViewToggle, type ViewMode } from "./view-toggle"
import { CalendarWeekView } from "./calendar-week-view"
import { CalendarMonthView } from "./calendar-month-view"
import { CalendarListView } from "./calendar-list-view"
import type { BookingWithDetails } from "@/lib/types/database"

interface ReservationsCalendarProps {
  bookings: BookingWithDetails[]
  view: ViewMode
  referenceDate: string
  paramPrefix?: string
}

export function ReservationsCalendar({
  bookings,
  view,
  referenceDate,
  paramPrefix = "",
}: ReservationsCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  const currentDate = parseISO(referenceDate)

  // Helper to get prefixed param key
  const getParamKey = useCallback(
    (key: string) => `${paramPrefix}${key}`,
    [paramPrefix]
  )

  // Helper to get param value with prefix
  const getParam = useCallback(
    (key: string) => searchParams.get(getParamKey(key)),
    [searchParams, getParamKey]
  )

  // Date range for list view
  const dateRange = useMemo<DateRange | undefined>(() => {
    const startDateParam = getParam("startDate")
    const endDateParam = getParam("endDate")
    if (startDateParam && endDateParam) {
      return {
        from: parseISO(startDateParam),
        to: parseISO(endDateParam),
      }
    }
    // Default to current week
    const now = new Date()
    return {
      from: startOfWeek(now, { weekStartsOn: 1 }),
      to: endOfWeek(now, { weekStartsOn: 1 }),
    }
  }, [getParam])

  const updateUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        const prefixedKey = getParamKey(key)
        if (value) {
          params.set(prefixedKey, value)
        } else {
          params.delete(prefixedKey)
        }
      })

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`)
      })
    },
    [searchParams, pathname, router, getParamKey]
  )

  const handleViewChange = (newView: ViewMode) => {
    updateUrl({ view: newView })
  }

  const handlePrevious = () => {
    let newDate: Date
    if (view === "week") {
      newDate = subWeeks(currentDate, 1)
    } else if (view === "month") {
      newDate = subMonths(currentDate, 1)
    } else {
      newDate = subWeeks(currentDate, 1)
    }
    updateUrl({ date: format(newDate, "yyyy-MM-dd") })
  }

  const handleNext = () => {
    let newDate: Date
    if (view === "week") {
      newDate = addWeeks(currentDate, 1)
    } else if (view === "month") {
      newDate = addMonths(currentDate, 1)
    } else {
      newDate = addWeeks(currentDate, 1)
    }
    updateUrl({ date: format(newDate, "yyyy-MM-dd") })
  }

  const handleToday = () => {
    updateUrl({ date: format(new Date(), "yyyy-MM-dd") })
  }

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      updateUrl({
        startDate: range.from.toISOString().split("T")[0],
        endDate: range.to.toISOString().split("T")[0],
      })
    }
  }

  // Callback for month view day click - navigates to week view for that day
  const handleDayNavigate = useCallback(
    (day: Date) => {
      updateUrl({
        view: "week",
        date: format(day, "yyyy-MM-dd"),
      })
    },
    [updateUrl]
  )

  // Format period title based on view
  const getPeriodTitle = () => {
    if (view === "week") {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 })
      return `Semaine du ${format(weekStart, "d", { locale: fr })} - ${format(weekEnd, "d MMMM yyyy", { locale: fr })}`
    } else if (view === "month") {
      return format(currentDate, "MMMM yyyy", { locale: fr })
    } else {
      return `A partir du ${format(currentDate, "d MMMM yyyy", { locale: fr })}`
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Navigation header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {view !== "list" ? (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevious}
                disabled={isPending}
                className="flex h-9 w-9 items-center justify-center rounded-[20px] border border-border transition-opacity hover:opacity-70 disabled:opacity-50"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={handleToday}
                disabled={isPending}
                className="rounded-[20px] border border-border px-4 py-2 text-sm font-bold transition-opacity hover:opacity-70 disabled:opacity-50"
              >
                Aujourd&apos;hui
              </button>
              <button
                onClick={handleNext}
                disabled={isPending}
                className="flex h-9 w-9 items-center justify-center rounded-[20px] border border-border transition-opacity hover:opacity-70 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Period title */}
            <h2 className="text-lg font-black uppercase tracking-tight sm:ml-2 sm:text-xl">
              {getPeriodTitle()}
            </h2>
          </div>
        ) : (
          <div />
        )}

        <ViewToggle currentView={view} onViewChange={handleViewChange} />
      </div>

      {/* Date range picker for list view */}
      {view === "list" && (
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
          placeholder="Periode"
        />
      )}

      {/* Calendar view */}
      <div className="min-h-[500px]">
        {view === "week" && (
          <CalendarWeekView bookings={bookings} referenceDate={currentDate} />
        )}
        {view === "month" && (
          <CalendarMonthView
            bookings={bookings}
            referenceDate={currentDate}
            onDayNavigate={handleDayNavigate}
          />
        )}
        {view === "list" && <CalendarListView bookings={bookings} />}
      </div>
    </div>
  )
}
