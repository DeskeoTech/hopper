import { createClient } from "@/lib/supabase/server"
import { LayoutDashboard, TrendingUp, TrendingDown, Headphones } from "lucide-react"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, addWeeks, addMonths, format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { OccupationCard } from "@/components/admin/occupation-card"
import { GrowthCard } from "@/components/admin/growth-card"
import { ReservationsCard } from "@/components/admin/reservations-card"
import { ForecastCard } from "@/components/admin/forecast-card"

// Composant carte métrique principale
function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendLabel,
  icon: Icon,
  variant = "default",
  className,
}: {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  trendLabel?: string
  icon?: React.ComponentType<{ className?: string }>
  variant?: "default" | "large" | "accent"
  className?: string
}) {
  const isPositiveTrend = trend && trend > 0
  const isNegativeTrend = trend && trend < 0

  return (
    <div
      className={cn(
        "rounded-[20px] bg-card p-4 sm:p-5",
        variant === "large" && "col-span-2",
        variant === "accent" && "bg-brand text-brand-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn(
            "text-xs font-medium uppercase tracking-wide",
            variant === "accent" ? "text-brand-foreground/70" : "text-muted-foreground"
          )}>
            {title}
          </p>
          {subtitle && (
            <p className={cn(
              "text-[10px] mt-0.5",
              variant === "accent" ? "text-brand-foreground/50" : "text-muted-foreground/70"
            )}>
              {subtitle}
            </p>
          )}
          <div className="flex items-baseline gap-2 mt-2">
            <span className={cn(
              "font-header text-2xl sm:text-3xl",
              variant === "accent" ? "text-brand-foreground" : "text-foreground"
            )}>
              {value}
            </span>
            {trend !== undefined && (
              <span
                className={cn(
                  "inline-flex items-center text-xs font-medium",
                  isPositiveTrend && "text-green-600",
                  isNegativeTrend && "text-red-500",
                  !isPositiveTrend && !isNegativeTrend && "text-muted-foreground"
                )}
              >
                {isPositiveTrend ? (
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                ) : isNegativeTrend ? (
                  <TrendingDown className="h-3 w-3 mr-0.5" />
                ) : null}
                {trend > 0 ? "+" : ""}{trend}%
              </span>
            )}
          </div>
          {trendLabel && (
            <p className={cn(
              "text-[10px] mt-1",
              variant === "accent" ? "text-brand-foreground/50" : "text-muted-foreground/60"
            )}>
              {trendLabel}
            </p>
          )}
        </div>
        {Icon && (
          <div className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-sm",
            variant === "accent" ? "bg-brand-foreground/10" : "bg-muted"
          )}>
            <Icon className={cn(
              "h-5 w-5",
              variant === "accent" ? "text-brand-foreground/70" : "text-muted-foreground"
            )} />
          </div>
        )}
      </div>
    </div>
  )
}

// Composant jauge circulaire
function CircularGauge({
  value,
  maxValue = 100,
  label,
  size = "md",
}: {
  value: number
  maxValue?: number
  label: string
  size?: "sm" | "md" | "lg"
}) {
  const percentage = Math.min((value / maxValue) * 100, 100)
  const circumference = 2 * Math.PI * 15.9155
  const strokeDasharray = `${(percentage / 100) * circumference}, ${circumference}`

  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-20 h-20",
    lg: "w-24 h-24",
  }

  return (
    <div className={cn("relative", sizeClasses[size])}>
      <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
        <path
          className="stroke-muted"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeWidth="3"
        />
        <path
          className="stroke-brand transition-all duration-500"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          strokeWidth="3"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-header text-[22px]">{Math.round(percentage)}%</span>
        <span className="text-xs text-muted-foreground uppercase">{label}</span>
      </div>
    </div>
  )
}

// Composant barre de progression
function ProgressBar({
  value,
  maxValue = 100,
  label,
  showValue = true,
  color = "default",
}: {
  value: number
  maxValue?: number
  label?: string
  showValue?: boolean
  color?: "default" | "green" | "orange" | "red"
}) {
  const percentage = Math.min((value / maxValue) * 100, 100)

  const colorClasses = {
    default: "bg-brand",
    green: "bg-green-500",
    orange: "bg-orange-400",
    red: "bg-red-500",
  }

  return (
    <div className="space-y-1">
      {(label || showValue) && (
        <div className="flex justify-between items-center">
          {label && <span className="text-xs text-muted-foreground">{label}</span>}
          {showValue && <span className="text-xs font-medium">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const now = new Date()

  // Dates pour les filtres
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Dates pour les prévisions
  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
  const weekAfterNextStart = startOfWeek(addWeeks(now, 2), { weekStartsOn: 1 })
  const weekAfterNextEnd = endOfWeek(addWeeks(now, 2), { weekStartsOn: 1 })
  const nextMonthStart = startOfMonth(addMonths(now, 1))
  const nextMonthEnd = endOfMonth(addMonths(now, 1))

  // Récupération des données en parallèle
  const [
    // Métriques générales
    sitesResult,
    companiesResult,
    activeUsersResult,

    // Réservations temps réel (aujourd'hui)
    todayBookingsResult,

    // Support tickets
    openTicketsResult,
    resolvedTicketsResult,

    // Données pour occupation des sites
    resourcesResult,
    bookingsThisWeekResult,

    // Croissance contrats
    contractsThisMonthResult,
    contractsLastMonthResult,

    // Prévisions - bookings futurs
    bookingsNextWeekResult,
    bookingsWeekAfterNextResult,
    bookingsNextMonthResult,
  ] = await Promise.all([
    // Nombre de sites
    supabase.from("sites").select("*", { count: "exact", head: true }).eq("status", "open"),

    // Nombre d'entreprises
    supabase.from("companies").select("*", { count: "exact", head: true }),

    // Membres actifs
    supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "active"),

    // Réservations aujourd'hui (avec resource_id pour calculer disponibilité par site)
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count, resource:resources!inner(type, site_id)")
      .eq("status", "confirmed")
      .gte("start_date", todayStart.toISOString())
      .lte("start_date", todayEnd.toISOString()),

    // Tickets ouverts (todo ou in_progress)
    supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .in("status", ["todo", "in_progress"]),

    // Tickets résolus
    supabase
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("status", "done"),

    // Ressources par site
    supabase.from("resources").select("id, site_id, type, capacity, site:sites!inner(id, name, status)").eq("sites.status", "open"),

    // Réservations cette semaine par ressource
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", weekStart.toISOString())
      .lte("start_date", weekEnd.toISOString()),

    // Contrats actifs créés ce mois (avec plan pour le type d'offre)
    supabase
      .from("contracts")
      .select("id, status, created_at, plan:plans!inner(recurrence)")
      .eq("status", "active")
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString()),

    // Contrats actifs créés le mois dernier (avec plan pour le type d'offre)
    supabase
      .from("contracts")
      .select("id, status, created_at, plan:plans!inner(recurrence)")
      .eq("status", "active")
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString()),

    // Réservations semaine n+1
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", nextWeekStart.toISOString())
      .lte("start_date", nextWeekEnd.toISOString()),

    // Réservations semaine n+2
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", weekAfterNextStart.toISOString())
      .lte("start_date", weekAfterNextEnd.toISOString()),

    // Réservations mois m+1
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", nextMonthStart.toISOString())
      .lte("start_date", nextMonthEnd.toISOString()),
  ])

  // Calculs des métriques
  const sitesCount = sitesResult.count || 0
  const companiesCount = companiesResult.count || 0
  const activeUsersCount = activeUsersResult.count || 0

  const todayBookings = todayBookingsResult.data || []

  const openTickets = openTicketsResult.count || 0
  const resolvedTickets = resolvedTicketsResult.count || 0
  const totalTickets = openTickets + resolvedTickets
  const ticketResolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0

  // Croissance contrats
  const contractsThisMonth = contractsThisMonthResult.data || []
  const contractsLastMonth = contractsLastMonthResult.data || []

  // Calcul croissance par type d'offre
  type RecurrenceType = "daily" | "weekly" | "monthly"
  const offerLabels: Record<RecurrenceType, string> = {
    daily: "Pass Day",
    weekly: "Pass Week",
    monthly: "Pass Month",
  }

  function countByRecurrence(contracts: typeof contractsThisMonth) {
    const counts: Record<RecurrenceType, number> = { daily: 0, weekly: 0, monthly: 0 }
    contracts.forEach((c) => {
      const plan = c.plan as { recurrence: RecurrenceType | null } | null
      if (plan?.recurrence) {
        counts[plan.recurrence]++
      }
    })
    return counts
  }

  const thisMonthCounts = countByRecurrence(contractsThisMonth)
  const lastMonthCounts = countByRecurrence(contractsLastMonth)

  const offerGrowths = (["daily", "weekly", "monthly"] as RecurrenceType[]).map((recurrence) => {
    const current = thisMonthCounts[recurrence]
    const previous = lastMonthCounts[recurrence]
    const growthRate = previous > 0
      ? Math.round(((current - previous) / previous) * 100)
      : current > 0 ? 100 : 0
    return {
      name: offerLabels[recurrence],
      currentCount: current,
      previousCount: previous,
      growthRate,
    }
  })

  const newContractsThisMonth = contractsThisMonth.length
  const newContractsLastMonth = contractsLastMonth.length
  const globalGrowthRate = newContractsLastMonth > 0
    ? Math.round(((newContractsThisMonth - newContractsLastMonth) / newContractsLastMonth) * 100)
    : newContractsThisMonth > 0 ? 100 : 0

  // Calcul occupation par site
  const resources = resourcesResult.data || []
  const bookingsWeek = bookingsThisWeekResult.data || []

  // Grouper les ressources par site et calculer la capacité totale
  const siteCapacities = new Map<string, { name: string; capacity: number }>()
  resources.forEach((r) => {
    if (r.site_id && r.site) {
      const existing = siteCapacities.get(r.site_id)
      const siteData = r.site as { id: string; name: string; status: string }
      if (existing) {
        existing.capacity += r.capacity || 1
      } else {
        siteCapacities.set(r.site_id, {
          name: siteData.name,
          capacity: r.capacity || 1,
        })
      }
    }
  })

  // Mapper resource_id vers site_id
  const resourceToSite = new Map<string, string>()
  resources.forEach((r) => {
    if (r.site_id) {
      resourceToSite.set(r.id, r.site_id)
    }
  })

  // Calculer les bookings par site pour chaque période
  function calculateOccupancyBySite(bookings: typeof bookingsWeek, periodDays: number) {
    const siteBookings = new Map<string, number>()
    bookings.forEach((b) => {
      if (b.resource_id) {
        const siteId = resourceToSite.get(b.resource_id)
        if (siteId) {
          siteBookings.set(siteId, (siteBookings.get(siteId) || 0) + (b.seats_count || 1))
        }
      }
    })

    const occupancies: { siteId: string; name: string; occupancy: number }[] = []
    siteCapacities.forEach((site, siteId) => {
      const bookingCount = siteBookings.get(siteId) || 0
      // Taux d'occupation = bookings / (capacité * jours) * 100
      const maxPossible = site.capacity * periodDays
      const occupancy = maxPossible > 0 ? Math.round((bookingCount / maxPossible) * 100) : 0
      occupancies.push({ siteId, name: site.name, occupancy: Math.min(occupancy, 100) })
    })

    return occupancies.sort((a, b) => b.occupancy - a.occupancy)
  }

  const weeklyOccupancies = calculateOccupancyBySite(bookingsWeek, 5) // 5 jours ouvrés

  // Taux d'occupation global (semaine)
  const totalCapacity = Array.from(siteCapacities.values()).reduce((sum, s) => sum + s.capacity, 0)
  const totalBookingsWeek = bookingsWeek.reduce((sum, b) => sum + (b.seats_count || 1), 0)
  const globalOccupancyRate = totalCapacity > 0
    ? Math.round((totalBookingsWeek / (totalCapacity * 5)) * 100)
    : 0

  // Calcul disponibilité par site pour aujourd'hui
  type ResourceType = "bench" | "meeting_room" | "flex_desk" | "fixed_desk"

  // Grouper les ressources par site et par type
  const siteResourcesByType = new Map<string, { name: string; benchCapacity: number; meetingRoomCapacity: number }>()
  resources.forEach((r) => {
    if (r.site_id && r.site) {
      const siteData = r.site as { id: string; name: string; status: string }
      const existing = siteResourcesByType.get(r.site_id)
      const capacity = r.capacity || 1
      const resourceType = r.type as ResourceType

      if (existing) {
        if (resourceType === "flex_desk") {
          existing.benchCapacity += capacity
        } else if (resourceType === "meeting_room") {
          existing.meetingRoomCapacity += capacity
        }
      } else {
        siteResourcesByType.set(r.site_id, {
          name: siteData.name,
          benchCapacity: resourceType === "flex_desk" ? capacity : 0,
          meetingRoomCapacity: resourceType === "meeting_room" ? capacity : 0,
        })
      }
    }
  })

  // Compter les réservations d'aujourd'hui par site et par type
  const todayBookingsBySiteAndType = new Map<string, { benchBooked: number; meetingRoomBooked: number }>()
  todayBookings.forEach((b) => {
    const resource = b.resource as { type: ResourceType; site_id: string } | null
    if (resource?.site_id) {
      const existing = todayBookingsBySiteAndType.get(resource.site_id)
      const seatsCount = b.seats_count || 1

      if (existing) {
        if (resource.type === "flex_desk") {
          existing.benchBooked += seatsCount
        } else if (resource.type === "meeting_room") {
          existing.meetingRoomBooked += seatsCount
        }
      } else {
        todayBookingsBySiteAndType.set(resource.site_id, {
          benchBooked: resource.type === "flex_desk" ? seatsCount : 0,
          meetingRoomBooked: resource.type === "meeting_room" ? seatsCount : 0,
        })
      }
    }
  })

  // Calculer disponibilité par site
  const benchAvailabilityBySite: { siteId: string; siteName: string; available: number; total: number }[] = []
  const meetingRoomAvailabilityBySite: { siteId: string; siteName: string; available: number; total: number }[] = []

  siteResourcesByType.forEach((site, siteId) => {
    const bookings = todayBookingsBySiteAndType.get(siteId) || { benchBooked: 0, meetingRoomBooked: 0 }

    if (site.benchCapacity > 0) {
      benchAvailabilityBySite.push({
        siteId,
        siteName: site.name,
        available: Math.max(0, site.benchCapacity - bookings.benchBooked),
        total: site.benchCapacity,
      })
    }

    if (site.meetingRoomCapacity > 0) {
      meetingRoomAvailabilityBySite.push({
        siteId,
        siteName: site.name,
        available: Math.max(0, site.meetingRoomCapacity - bookings.meetingRoomBooked),
        total: site.meetingRoomCapacity,
      })
    }
  })

  // Trier par disponibilité décroissante
  benchAvailabilityBySite.sort((a, b) => b.available - a.available)
  meetingRoomAvailabilityBySite.sort((a, b) => b.available - a.available)

  // Calcul des prévisions
  const bookingsNextWeek = bookingsNextWeekResult.data || []
  const bookingsWeekAfterNext = bookingsWeekAfterNextResult.data || []
  const bookingsNextMonth = bookingsNextMonthResult.data || []

  // Calculer le nombre de jours ouvrés dans le mois prochain (approximation: 22 jours)
  const workingDaysNextMonth = 22

  // Fonction pour calculer les prévisions par site
  function calculateForecastBySite(bookings: typeof bookingsNextWeek, periodDays: number) {
    const siteBookings = new Map<string, number>()
    bookings.forEach((b) => {
      if (b.resource_id) {
        const siteId = resourceToSite.get(b.resource_id)
        if (siteId) {
          siteBookings.set(siteId, (siteBookings.get(siteId) || 0) + (b.seats_count || 1))
        }
      }
    })

    const forecasts: { siteId: string; siteName: string; occupancyRate: number; bookedCount: number; totalCapacity: number }[] = []
    siteCapacities.forEach((site, siteId) => {
      const bookingCount = siteBookings.get(siteId) || 0
      const maxPossible = site.capacity * periodDays
      const occupancyRate = maxPossible > 0 ? Math.round((bookingCount / maxPossible) * 100) : 0
      forecasts.push({
        siteId,
        siteName: site.name,
        occupancyRate: Math.min(occupancyRate, 100),
        bookedCount: bookingCount,
        totalCapacity: maxPossible,
      })
    })

    return forecasts.sort((a, b) => b.occupancyRate - a.occupancyRate)
  }

  // Calculer les prévisions pour chaque période
  const forecastNextWeek = calculateForecastBySite(bookingsNextWeek, 5)
  const forecastWeekAfterNext = calculateForecastBySite(bookingsWeekAfterNext, 5)
  const forecastNextMonth = calculateForecastBySite(bookingsNextMonth, workingDaysNextMonth)

  // Calculer les taux globaux pour chaque période
  function calculateGlobalOccupancy(forecasts: typeof forecastNextWeek) {
    const totalBooked = forecasts.reduce((sum, f) => sum + f.bookedCount, 0)
    const totalCapacity = forecasts.reduce((sum, f) => sum + f.totalCapacity, 0)
    return totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  }

  const forecastPeriods = [
    {
      label: `Semaine du ${format(nextWeekStart, "d MMM", { locale: fr })}`,
      shortLabel: "S+1",
      sites: forecastNextWeek,
      globalOccupancy: calculateGlobalOccupancy(forecastNextWeek),
    },
    {
      label: `Semaine du ${format(weekAfterNextStart, "d MMM", { locale: fr })}`,
      shortLabel: "S+2",
      sites: forecastWeekAfterNext,
      globalOccupancy: calculateGlobalOccupancy(forecastWeekAfterNext),
    },
    {
      label: format(nextMonthStart, "MMMM yyyy", { locale: fr }),
      shortLabel: "M+1",
      sites: forecastNextMonth,
      globalOccupancy: calculateGlobalOccupancy(forecastNextMonth),
    },
  ]

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
          <LayoutDashboard className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="type-h2 text-foreground">Dashboard</h1>
            <span className="inline-flex items-center rounded-sm bg-brand px-2 py-0.5 text-[10px] font-medium uppercase text-brand-foreground">
              Temps réel
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Vue d&apos;ensemble des métriques • {format(now, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
      </div>

      {/* Section principale : Occupation + Réservations */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-5">
        {/* Carte Occupation */}
        <div className="lg:col-span-3 h-full">
          <OccupationCard
            globalOccupancyRate={globalOccupancyRate}
            totalBookings={totalBookingsWeek}
            totalCapacity={totalCapacity * 5}
            siteOccupancies={weeklyOccupancies}
          />
        </div>

        {/* Carte Réservations */}
        <div className="lg:col-span-2">
          <ReservationsCard
            todayBenchBookings={benchAvailabilityBySite.reduce((sum, s) => sum + (s.total - s.available), 0)}
            todayMeetingRoomBookings={meetingRoomAvailabilityBySite.reduce((sum, s) => sum + (s.total - s.available), 0)}
            benchAvailabilityBySite={benchAvailabilityBySite}
            meetingRoomAvailabilityBySite={meetingRoomAvailabilityBySite}
          />
        </div>
      </div>

      {/* Grille métriques secondaires */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        {/* Croissance Contrats */}
        <GrowthCard
          globalGrowthRate={globalGrowthRate}
          newContractsThisMonth={newContractsThisMonth}
          offerGrowths={offerGrowths}
        />

        {/* Colonne droite : Support + Clients */}
        <div className="flex flex-col gap-4">
          {/* Support */}
          <div className="rounded-[20px] bg-card p-5">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-header text-lg uppercase tracking-wide">Support</h2>
              <Headphones className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[14px] uppercase font-medium">Ouverts</span>
                <span className="font-header text-[22px] text-orange-500">{openTickets}</span>
              </div>
              <ProgressBar
                value={openTickets}
                maxValue={Math.max(totalTickets, 1)}
                color="orange"
                showValue={false}
              />
              <div className="flex justify-between items-center">
                <span className="text-[14px] uppercase font-medium">Résolus</span>
                <span className="font-header text-[22px] text-green-600">{resolvedTickets}</span>
              </div>
              <ProgressBar
                value={resolvedTickets}
                maxValue={Math.max(totalTickets, 1)}
                color="green"
                showValue={false}
              />
            </div>
          </div>

          {/* Clients */}
          <div className="rounded-[20px] bg-card p-5">
            <h2 className="font-header text-lg uppercase tracking-wide mb-4">Clients</h2>
            <div className="space-y-4">
              <div>
                <p className="text-[14px] text-muted-foreground uppercase font-medium mb-1">Membres Actifs</p>
                <p className="font-header text-[28px]">{activeUsersCount.toLocaleString("fr-FR")}</p>
              </div>
              <div className="h-px bg-border" />
              <div>
                <p className="text-[14px] text-muted-foreground uppercase font-medium mb-1">Entreprises</p>
                <p className="font-header text-[28px]">{companiesCount}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section Prévisions */}
      <ForecastCard periods={forecastPeriods} />
    </div>
  )
}
