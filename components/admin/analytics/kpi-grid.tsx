"use client"

import { useState } from "react"
import { TrendingUp, TrendingDown, Calendar, Briefcase, Ban, ChevronRight, ChevronDown } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

// === Detail data types ===

export interface CompanyBreakdown {
  selfEmployed: number
  multiEmployee: number
  meetingRoomOnly: number
  selfEmployedNames: string[]
  multiEmployeeNames: string[]
  meetingRoomOnlyNames: string[]
}

export interface WeeklyBookingsByType {
  flexDesk: number
  meetingRoom: number
}

export interface BookingDetail {
  id: string
  startDate: string
  resourceName: string
  resourceType: string
  siteName: string
  userName: string
}

export interface KpiGridProps {
  companiesCount: number
  bookingsCount: number
  cancellationRate: number
  cancelledCount: number
  totalBookings: number
  periodLabel: string
  // Detail data
  companyBreakdown: CompanyBreakdown
  bookingsByType: WeeklyBookingsByType
  cancelledBookings: BookingDetail[]
  confirmedBookings: BookingDetail[]
  flexDeskBookings: BookingDetail[]
  meetingRoomBookings: BookingDetail[]
}

// === Reusable detail list item ===

function DetailRow({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-bold tabular-nums", color)}>{value}</span>
    </div>
  )
}

// === KPI Card with dialog ===

function KpiCard({
  title,
  value,
  trend,
  trendLabel,
  icon: Icon,
  dialogTitle,
  children,
}: {
  title: string
  value: string | number
  trend?: number
  trendLabel?: string
  icon: React.ComponentType<{ className?: string }>
  dialogTitle: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const isPositive = trend !== undefined && trend > 0
  const isNegative = trend !== undefined && trend < 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-[20px] bg-card p-4 sm:p-5 text-left transition-all hover:shadow-md group w-full">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {title}
                </p>
                <ChevronRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-header text-2xl sm:text-3xl text-foreground">
                  {value}
                </span>
                {trend !== undefined && (
                  <span
                    className={cn(
                      "inline-flex items-center text-xs font-medium",
                      isPositive && "text-green-600",
                      isNegative && "text-red-500",
                      !isPositive && !isNegative && "text-muted-foreground"
                    )}
                  >
                    {isPositive ? (
                      <TrendingUp className="h-3 w-3 mr-0.5" />
                    ) : isNegative ? (
                      <TrendingDown className="h-3 w-3 mr-0.5" />
                    ) : null}
                    {trend > 0 ? "+" : ""}{trend}%
                  </span>
                )}
              </div>
              {trendLabel && (
                <p className="text-[10px] mt-1 text-muted-foreground/60">
                  {trendLabel}
                </p>
              )}
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-header text-xl">{dialogTitle}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[60vh] overflow-y-auto">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}

// === Company names list ===

function CompanyNamesList({ names }: { names: string[] }) {
  if (names.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">Aucune entreprise</p>
  }
  return (
    <>
      {names.map((name, i) => (
        <div key={i} className="flex items-center py-2 px-3 border-b border-border/30 last:border-0">
          <p className="text-xs font-medium truncate">{name}</p>
        </div>
      ))}
    </>
  )
}

// === Companies KPI with expandable lists ===

function CompaniesKpiCard({
  companiesCount,
  companyBreakdown,
}: {
  companiesCount: number
  companyBreakdown: CompanyBreakdown
}) {
  const [selfExpanded, setSelfExpanded] = useState(false)
  const [multiExpanded, setMultiExpanded] = useState(false)
  const [meetingExpanded, setMeetingExpanded] = useState(false)

  return (
    <KpiCard
      title="Entreprises"
      value={companiesCount}
      icon={Briefcase}
      dialogTitle="Répartition des entreprises"
    >
      <div className="space-y-0">
        {/* Indépendants expandable row */}
        <button
          type="button"
          onClick={() => setSelfExpanded(!selfExpanded)}
          className="flex items-center justify-between py-2.5 border-b border-border/50 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            Indépendants
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", selfExpanded && "rotate-180")} />
          </span>
          <span className="text-sm font-bold tabular-nums">{companyBreakdown.selfEmployed}</span>
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          selfExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-border ml-1 my-1.5">
            <CompanyNamesList names={companyBreakdown.selfEmployedNames} />
          </div>
        </div>

        {/* Multi-employés expandable row */}
        <button
          type="button"
          onClick={() => setMultiExpanded(!multiExpanded)}
          className="flex items-center justify-between py-2.5 border-b border-border/50 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            Multi-employés
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", multiExpanded && "rotate-180")} />
          </span>
          <span className="text-sm font-bold tabular-nums">{companyBreakdown.multiEmployee}</span>
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          multiExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-border ml-1 my-1.5">
            <CompanyNamesList names={companyBreakdown.multiEmployeeNames} />
          </div>
        </div>

        {/* Salles de réunion uniquement expandable row */}
        <button
          type="button"
          onClick={() => setMeetingExpanded(!meetingExpanded)}
          className="flex items-center justify-between py-2.5 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            Salles de réunion uniquement
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", meetingExpanded && "rotate-180")} />
          </span>
          <span className="text-sm font-bold tabular-nums">{companyBreakdown.meetingRoomOnly}</span>
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          meetingExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-border ml-1 my-1.5">
            <CompanyNamesList names={companyBreakdown.meetingRoomOnlyNames} />
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <DetailRow label="Total" value={companiesCount} />
      </div>
    </KpiCard>
  )
}

// === Weekly Bookings KPI with expandable lists ===

function BookingsList({ bookings }: { bookings: BookingDetail[] }) {
  if (bookings.length === 0) {
    return <p className="text-xs text-muted-foreground text-center py-4">Aucune réservation</p>
  }
  return (
    <>
      {bookings.map((booking) => (
        <div key={booking.id} className="flex items-start justify-between py-2 px-3 border-b border-border/30 last:border-0">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate">{booking.resourceName}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              {resourceTypeLabels[booking.resourceType] || booking.resourceType} • {booking.siteName}
            </p>
            <p className="text-[11px] text-muted-foreground">{booking.userName}</p>
          </div>
          <span className="text-[11px] text-muted-foreground shrink-0 ml-2 tabular-nums">
            {format(new Date(booking.startDate), "d MMM", { locale: fr })}
          </span>
        </div>
      ))}
    </>
  )
}

function BookingsKpiCard({
  bookingsCount,
  bookingsByType,
  flexDeskBookings,
  meetingRoomBookings,
  periodLabel,
}: {
  bookingsCount: number
  bookingsByType: WeeklyBookingsByType
  flexDeskBookings: BookingDetail[]
  meetingRoomBookings: BookingDetail[]
  periodLabel: string
}) {
  const [flexExpanded, setFlexExpanded] = useState(false)
  const [meetingExpanded, setMeetingExpanded] = useState(false)

  return (
    <KpiCard
      title="Réservations"
      value={bookingsCount}
      icon={Calendar}
      dialogTitle={`Réservations — ${periodLabel}`}
    >
      <div className="space-y-0">
        {/* Flex desk expandable row */}
        <button
          type="button"
          onClick={() => setFlexExpanded(!flexExpanded)}
          className="flex items-center justify-between py-2.5 border-b border-border/50 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            Places de travail (flex desk)
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", flexExpanded && "rotate-180")} />
          </span>
          <span className="text-sm font-bold tabular-nums">{bookingsByType.flexDesk}</span>
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          flexExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-border ml-1 my-1.5">
            <BookingsList bookings={flexDeskBookings} />
          </div>
        </div>

        {/* Meeting room expandable row */}
        <button
          type="button"
          onClick={() => setMeetingExpanded(!meetingExpanded)}
          className="flex items-center justify-between py-2.5 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            Salles de réunion
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", meetingExpanded && "rotate-180")} />
          </span>
          <span className="text-sm font-bold tabular-nums">{bookingsByType.meetingRoom}</span>
        </button>
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          meetingExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-border ml-1 my-1.5">
            <BookingsList bookings={meetingRoomBookings} />
          </div>
        </div>
      </div>
      <div className="mt-4 pt-3 border-t border-border">
        <DetailRow label="Total" value={bookingsCount} />
      </div>
    </KpiCard>
  )
}

// === Cancellation KPI with expandable bookings list ===

const resourceTypeLabels: Record<string, string> = {
  meeting_room: "Salle de réunion",
  flex_desk: "Flex desk",
  bench: "Place",
  fixed_desk: "Bureau fixe",
}

function CancellationKpiCard({
  cancellationRate,
  cancelledCount,
  totalBookingsThisMonth,
  cancelledBookings,
  confirmedBookings,
}: {
  cancellationRate: number
  cancelledCount: number
  totalBookingsThisMonth: number
  cancelledBookings: BookingDetail[]
  confirmedBookings: BookingDetail[]
}) {
  const [cancelledExpanded, setCancelledExpanded] = useState(false)
  const [confirmedExpanded, setConfirmedExpanded] = useState(false)

  return (
    <KpiCard
      title="Taux d'annulation de réservations"
      value={`${cancellationRate}%`}
      icon={Ban}
      dialogTitle="Taux d'annulation de réservations"
    >
      <div className="space-y-0">
        {/* Expandable cancelled bookings row */}
        <button
          type="button"
          onClick={() => setCancelledExpanded(!cancelledExpanded)}
          className="flex items-center justify-between py-2.5 border-b border-border/50 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            Réservations annulées ce mois
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", cancelledExpanded && "rotate-180")} />
          </span>
          <span className="text-sm font-bold tabular-nums text-red-500">{cancelledCount}</span>
        </button>

        {/* Expanded list */}
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          cancelledExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-red-300 ml-1 my-1.5">
            <BookingsList bookings={cancelledBookings} />
          </div>
        </div>

        {/* Expandable confirmed bookings row */}
        <button
          type="button"
          onClick={() => setConfirmedExpanded(!confirmedExpanded)}
          className="flex items-center justify-between py-2.5 border-b border-border/50 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
        >
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            Total réservations ce mois
            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", confirmedExpanded && "rotate-180")} />
          </span>
          <span className="text-sm font-bold tabular-nums">{totalBookingsThisMonth}</span>
        </button>

        {/* Expanded confirmed list */}
        <div className={cn(
          "overflow-hidden transition-all duration-200",
          confirmedExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-border ml-1 my-1.5">
            <BookingsList bookings={confirmedBookings} />
          </div>
        </div>

        <DetailRow label="Taux d'annulation" value={`${cancellationRate}%`} color={cancellationRate > 20 ? "text-red-500" : cancellationRate > 10 ? "text-orange-500" : "text-green-600"} />
      </div>
    </KpiCard>
  )
}

// === Main grid ===

export function KpiGrid({
  companiesCount,
  bookingsCount,
  cancellationRate,
  cancelledCount,
  totalBookings,
  periodLabel,
  companyBreakdown,
  bookingsByType,
  cancelledBookings,
  confirmedBookings,
  flexDeskBookings,
  meetingRoomBookings,
}: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {/* Entreprises */}
      <CompaniesKpiCard
        companiesCount={companiesCount}
        companyBreakdown={companyBreakdown}
      />

      {/* Réservations */}
      <BookingsKpiCard
        bookingsCount={bookingsCount}
        bookingsByType={bookingsByType}
        flexDeskBookings={flexDeskBookings}
        meetingRoomBookings={meetingRoomBookings}
        periodLabel={periodLabel}
      />

      {/* Taux d'annulation */}
      <CancellationKpiCard
        cancellationRate={cancellationRate}
        cancelledCount={cancelledCount}
        totalBookingsThisMonth={totalBookings}
        cancelledBookings={cancelledBookings}
        confirmedBookings={confirmedBookings}
      />
    </div>
  )
}

// === Monthly bookings summary card (used outside KPI grid) ===

export function MonthlyBookingsSummaryCard({
  monthlyBookingsCount,
  cancelledCount,
  cancellationRate,
  totalBookingsThisMonth,
  cancelledBookings,
  confirmedBookings,
  periodLabel,
}: {
  monthlyBookingsCount: number
  cancelledCount: number
  cancellationRate: number
  totalBookingsThisMonth: number
  cancelledBookings: BookingDetail[]
  confirmedBookings: BookingDetail[]
  periodLabel: string
}) {
  const [open, setOpen] = useState(false)
  const [cancelledExpanded, setCancelledExpanded] = useState(false)
  const [confirmedExpanded, setConfirmedExpanded] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="rounded-[20px] bg-card p-5 text-left transition-all hover:shadow-md group w-full">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Réservations — {periodLabel}</p>
              <p className="font-header text-3xl mt-1">{monthlyBookingsCount}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Annulées</p>
              <p className="font-header text-3xl mt-1 text-red-500">{cancelledCount}</p>
            </div>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-header text-xl">Réservations — {periodLabel}</DialogTitle>
        </DialogHeader>
        <div className="mt-2 max-h-[60vh] overflow-y-auto">
          <div className="space-y-0">
            {/* Confirmed bookings */}
            <button
              type="button"
              onClick={() => setConfirmedExpanded(!confirmedExpanded)}
              className="flex items-center justify-between py-2.5 border-b border-border/50 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
            >
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                Réservations confirmées
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", confirmedExpanded && "rotate-180")} />
              </span>
              <span className="text-sm font-bold tabular-nums">{monthlyBookingsCount}</span>
            </button>
            <div className={cn(
              "overflow-hidden transition-all duration-200",
              confirmedExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-border ml-1 my-1.5">
                <BookingsList bookings={confirmedBookings} />
              </div>
            </div>

            {/* Cancelled bookings */}
            <button
              type="button"
              onClick={() => setCancelledExpanded(!cancelledExpanded)}
              className="flex items-center justify-between py-2.5 border-b border-border/50 w-full text-left hover:bg-muted/30 transition-colors -mx-1 px-1 rounded"
            >
              <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                Réservations annulées
                <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", cancelledExpanded && "rotate-180")} />
              </span>
              <span className="text-sm font-bold tabular-nums text-red-500">{cancelledCount}</span>
            </button>
            <div className={cn(
              "overflow-hidden transition-all duration-200",
              cancelledExpanded ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
            )}>
              <div className="overflow-y-auto max-h-[280px] rounded-sm bg-muted/40 border-l-2 border-red-300 ml-1 my-1.5">
                <BookingsList bookings={cancelledBookings} />
              </div>
            </div>

            <DetailRow label="Total" value={totalBookingsThisMonth} />
            <DetailRow label="Taux d'annulation" value={`${cancellationRate}%`} color={cancellationRate > 20 ? "text-red-500" : cancellationRate > 10 ? "text-orange-500" : "text-green-600"} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
