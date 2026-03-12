"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { Building2 } from "lucide-react"
import { cn } from "@/lib/utils"

import { TopMeetingRoomsCard } from "./top-meeting-rooms-card"
import { TopSitesCard } from "./top-sites-card"
import { KpiGrid, type CompanyBreakdown, type WeeklyBookingsByType, type BookingDetail } from "./kpi-grid"

interface BookingBySite {
  siteId: string
  siteName: string
  bookingCount: number
  dailyAvg: number
  dailyCapacity: number
}

interface TopMeetingRoom {
  resourceId: string
  resourceName: string
  siteName: string
  bookingsCount: number
}

interface TopSite {
  siteId: string
  siteName: string
  bookingsCount: number
}

const periodOptions = [
  { value: "today", label: "Aujourd'hui" },
  { value: "week", label: "Semaine" },
  { value: "month", label: "Mois" },
  { value: "3months", label: "3 mois" },
  { value: "year", label: "1 an" },
  { value: "3years", label: "3 ans" },
  { value: "all", label: "Tout" },
]

const periodLabels: Record<string, Record<string, string>> = {
  calendar: {
    today: "aujourd'hui",
    week: "cette semaine (lun-dim)",
    month: "ce mois (1-31)",
    "3months": "3 derniers mois",
    year: "cette année",
    "3years": "3 dernières années",
    all: "tout le temps",
  },
  rolling: {
    today: "aujourd'hui",
    week: "7 derniers jours",
    month: "30 derniers jours",
    "3months": "3 derniers mois",
    year: "cette année",
    "3years": "3 dernières années",
    all: "tout le temps",
  },
}

export interface OverviewTabProps {
  // KPIs
  companiesCount: number
  bookingsCount: number
  // Bookings per site
  bookingsBySite: BookingBySite[]
  totalBookingCount: number
  // Site capacities
  siteCapacities: { siteId: string; siteName: string; capacity: number; occupied: number }[]
  // Cancellation
  cancellationRate: number
  cancelledCount: number
  totalBookings: number
  // Top rankings
  topMeetingRooms: TopMeetingRoom[]
  topSites: TopSite[]
  // KPI detail data
  companyBreakdown: CompanyBreakdown
  bookingsByType: WeeklyBookingsByType
  cancelledBookings: BookingDetail[]
  confirmedBookings: BookingDetail[]
  flexDeskBookings: BookingDetail[]
  meetingRoomBookings: BookingDetail[]
  // Period
  period: string
  periodMode: string
  periodStartDate: string
  periodEndDate: string
}

export function OverviewTab({
  companiesCount,
  bookingsCount,
  bookingsBySite,
  totalBookingCount,
  siteCapacities,
  cancellationRate,
  cancelledCount,
  totalBookings,
  topMeetingRooms,
  topSites,
  companyBreakdown,
  bookingsByType,
  cancelledBookings,
  confirmedBookings,
  flexDeskBookings,
  meetingRoomBookings,
  period,
  periodMode,
  periodStartDate,
  periodEndDate,
}: OverviewTabProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handlePeriodChange(newPeriod: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "overview")
    params.set("period", newPeriod)
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleModeChange(newMode: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", "overview")
    params.set("mode", newMode)
    router.push(`${pathname}?${params.toString()}`)
  }

  const showModeToggle = period === "week" || period === "month"

  const modeLabels = periodLabels[periodMode] || periodLabels.calendar
  const pLabel = modeLabels[period] || modeLabels.month
  const maxMeetingRoomBookings = topMeetingRooms[0]?.bookingsCount ?? 0
  const maxSiteBookings = topSites[0]?.bookingsCount ?? 0

  return (
    <div className="space-y-4">
      {/* Period selector */}
      <div className="flex flex-wrap items-center gap-1.5">
        {periodOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => handlePeriodChange(opt.value)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              period === opt.value
                ? "bg-foreground text-background"
                : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
        {showModeToggle && (
          <>
            <span className="mx-1 h-4 w-px bg-border" />
            <button
              onClick={() => handleModeChange(periodMode === "calendar" ? "rolling" : "calendar")}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {periodMode === "calendar" ? "Calendaire" : "Glissant"}
            </button>
            <span className="text-xs text-muted-foreground tabular-nums ml-1">
              {periodStartDate === periodEndDate ? periodStartDate : `${periodStartDate} — ${periodEndDate}`}
            </span>
          </>
        )}
      </div>

      {/* Row 1: KPI metrics (clickable with detail dialogs) */}
      <KpiGrid
        companiesCount={companiesCount}
        bookingsCount={bookingsCount}
        cancellationRate={cancellationRate}
        cancelledCount={cancelledCount}
        totalBookings={totalBookings}
        periodLabel={pLabel}
        companyBreakdown={companyBreakdown}
        bookingsByType={bookingsByType}
        cancelledBookings={cancelledBookings}
        confirmedBookings={confirmedBookings}
        flexDeskBookings={flexDeskBookings}
        meetingRoomBookings={meetingRoomBookings}
      />

      {/* Row 2: Occupation des espaces par site */}
      <div>
        <div className="rounded-[20px] bg-card p-5">
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-header text-lg uppercase tracking-wide">Occupation par site</h2>
            <span className="font-header text-2xl tabular-nums ml-auto">
              {siteCapacities.reduce((s, site) => s + site.occupied, 0)} / {siteCapacities.reduce((s, site) => s + site.capacity, 0)}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">Capacité des sites — {pLabel}</p>
          {siteCapacities.length > 0 ? (
            <div className="space-y-2.5">
              {siteCapacities.map((site) => {
                const occupancy = site.capacity > 0 ? Math.min(100, Math.round((site.occupied / site.capacity) * 100)) : 0
                return (
                  <div key={site.siteId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{site.siteName}</p>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm tabular-nums text-muted-foreground">
                          {site.occupied}/{site.capacity} places
                        </span>
                        <span className={cn(
                          "text-xs font-bold tabular-nums",
                          occupancy >= 80 && "text-green-600",
                          occupancy >= 50 && occupancy < 80 && "text-orange-500",
                          occupancy < 50 && "text-red-500"
                        )}>
                          {occupancy}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 bg-muted-foreground/40"
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucun site
            </p>
          )}
        </div>

      </div>

      {/* Row 3: Top rankings */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <TopMeetingRoomsCard rooms={topMeetingRooms} maxBookings={maxMeetingRoomBookings} periodLabel={pLabel} />
        <TopSitesCard sites={topSites} maxBookings={maxSiteBookings} periodLabel={pLabel} />
      </div>
    </div>
  )
}
