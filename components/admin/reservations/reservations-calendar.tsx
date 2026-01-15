"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition } from "react"
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
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ViewToggle, type ViewMode } from "./view-toggle"
import { CalendarWeekView } from "./calendar-week-view"
import { CalendarMonthView } from "./calendar-month-view"
import { CalendarListView } from "./calendar-list-view"
import type { BookingWithDetails } from "@/lib/types/database"

interface ReservationsCalendarProps {
  bookings: BookingWithDetails[]
  view: ViewMode
  referenceDate: string
}

export function ReservationsCalendar({
  bookings,
  view,
  referenceDate,
}: ReservationsCalendarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const currentDate = parseISO(referenceDate)

  const updateUrl = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    startTransition(() => {
      router.push(`/admin/reservations?${params.toString()}`)
    })
  }

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
    <div className="space-y-4">
      {/* Navigation header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            disabled={isPending}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            disabled={isPending}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            disabled={isPending}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="ml-2 text-lg font-semibold capitalize">
            {getPeriodTitle()}
          </h2>
        </div>

        <ViewToggle currentView={view} onViewChange={handleViewChange} />
      </div>

      {/* Calendar view */}
      <div className="rounded-lg border border-border bg-card">
        {view === "week" && (
          <CalendarWeekView bookings={bookings} referenceDate={currentDate} />
        )}
        {view === "month" && (
          <CalendarMonthView bookings={bookings} referenceDate={currentDate} />
        )}
        {view === "list" && <CalendarListView bookings={bookings} />}
      </div>
    </div>
  )
}
