"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { DoorOpen, Armchair, Building2, Info } from "lucide-react"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

import { TopMeetingRoomsCard } from "./top-meeting-rooms-card"
import { TopSitesCard } from "./top-sites-card"
import { KpiGrid, MonthlyBookingsSummaryCard, type CompanyBreakdown, type WeeklyBookingsByType, type BookingDetail } from "./kpi-grid"

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
  // Availability today
  totalBenchAvailable: number
  totalBenchCapacity: number
  totalMeetingRoomAvailable: number
  totalMeetingRoomCapacity: number
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
}

export function OverviewTab({
  companiesCount,
  bookingsCount,
  bookingsBySite,
  totalBookingCount,
  totalBenchAvailable,
  totalBenchCapacity,
  totalMeetingRoomAvailable,
  totalMeetingRoomCapacity,
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

      {/* Row 2: Occupation des espaces + Disponibilité temps réel */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        <div className="lg:col-span-3 rounded-[20px] bg-card p-5">
          <div className="flex items-center gap-3 mb-1">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <h2 className="font-header text-lg uppercase tracking-wide">Occupation des espaces</h2>
            <TooltipProvider>
              <UITooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-center">
                  Nombre de réservations pondéré par la capacité des salles (ex : 1 réservation d&apos;une salle de 4 places = 4)
                </TooltipContent>
              </UITooltip>
            </TooltipProvider>
            <span className="font-header text-2xl tabular-nums ml-auto">
              {totalBookingCount}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{pLabel}</p>
          {bookingsBySite.length > 0 ? (
            <div className="space-y-2.5">
              {bookingsBySite.map((site) => {
                const maxCount = bookingsBySite[0]?.bookingCount || 1
                const barWidth = Math.max(2, (site.bookingCount / maxCount) * 100)
                const occupancy = site.dailyCapacity > 0 ? Math.min(100, Math.round((site.dailyAvg / site.dailyCapacity) * 100)) : 0
                return (
                  <div key={site.siteId} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{site.siteName}</p>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-sm font-bold tabular-nums">{site.bookingCount}</span>
                        <span className="text-xs text-muted-foreground">
                          {site.dailyAvg}/{site.dailyCapacity} places/j
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
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune réservation
            </p>
          )}
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="rounded-[20px] bg-card p-5 flex-1">
            <h2 className="font-header text-lg uppercase tracking-wide mb-4">Disponibilité — {pLabel}</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Armchair className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Places de travail</p>
                    <p className="text-xs text-muted-foreground">
                      {totalBenchAvailable} / {totalBenchCapacity} disponibles/j
                    </p>
                  </div>
                </div>
                <span className="font-header text-2xl">
                  {totalBenchCapacity > 0 ? Math.round((totalBenchAvailable / totalBenchCapacity) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500"
                  style={{ width: `${totalBenchCapacity > 0 ? (totalBenchAvailable / totalBenchCapacity) * 100 : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <DoorOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Salles de réunion</p>
                    <p className="text-xs text-muted-foreground">
                      {totalMeetingRoomAvailable} / {totalMeetingRoomCapacity} disponibles/j
                    </p>
                  </div>
                </div>
                <span className="font-header text-2xl">
                  {totalMeetingRoomCapacity > 0 ? Math.round((totalMeetingRoomAvailable / totalMeetingRoomCapacity) * 100) : 0}%
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500"
                  style={{ width: `${totalMeetingRoomCapacity > 0 ? (totalMeetingRoomAvailable / totalMeetingRoomCapacity) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>

          <MonthlyBookingsSummaryCard
            monthlyBookingsCount={bookingsCount}
            cancelledCount={cancelledCount}
            cancellationRate={cancellationRate}
            totalBookingsThisMonth={totalBookings}
            cancelledBookings={cancelledBookings}
            confirmedBookings={confirmedBookings}
            periodLabel={pLabel}
          />
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
