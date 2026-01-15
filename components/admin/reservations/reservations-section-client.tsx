"use client"

import { Suspense } from "react"
import { ReservationsFilters, type HiddenFilter } from "./reservations-filters"
import { ReservationsCalendar } from "./reservations-calendar"
import type { BookingWithDetails } from "@/lib/types/database"
import type { ViewMode } from "./view-toggle"

interface ReservationsSectionClientProps {
  bookings: BookingWithDetails[]
  sites: Array<{ id: string; name: string | null }>
  companies: Array<{ id: string; name: string | null }>
  users: Array<{
    id: string
    first_name: string | null
    last_name: string | null
    email: string | null
  }>
  view: ViewMode
  referenceDate: string
  hiddenFilters: HiddenFilter[]
  paramPrefix: string
}

export function ReservationsSectionClient({
  bookings,
  sites,
  companies,
  users,
  view,
  referenceDate,
  hiddenFilters,
  paramPrefix,
}: ReservationsSectionClientProps) {
  return (
    <div className="space-y-4">
      <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
        <ReservationsFilters
          sites={sites}
          companies={companies}
          users={users}
          hiddenFilters={hiddenFilters}
          paramPrefix={paramPrefix}
        />
      </Suspense>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <ReservationsCalendar
          bookings={bookings}
          view={view}
          referenceDate={referenceDate}
          paramPrefix={paramPrefix}
        />
      </Suspense>
    </div>
  )
}
