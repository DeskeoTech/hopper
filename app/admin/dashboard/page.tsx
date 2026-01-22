import { createClient } from "@/lib/supabase/server"
import { LayoutDashboard, TrendingUp, TrendingDown, Users, Building2, Calendar, CreditCard, Headphones, Armchair, DoorOpen, MapPin } from "lucide-react"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
        "rounded-lg bg-card p-4 sm:p-5 border border-border/50",
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
        <span className="font-header text-lg">{Math.round(percentage)}%</span>
        <span className="text-[8px] text-muted-foreground uppercase">{label}</span>
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

// Composant élément de site
function SiteOccupancyItem({
  name,
  occupancy,
  rank,
  isLeast = false,
}: {
  name: string
  occupancy: number
  rank?: number
  isLeast?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        {rank && (
          <span className={cn(
            "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
            rank === 1 && "bg-yellow-100 text-yellow-700",
            rank === 2 && "bg-gray-100 text-gray-600",
            rank === 3 && "bg-orange-100 text-orange-700",
          )}>
            {rank}
          </span>
        )}
        {isLeast && (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-600">
            <TrendingDown className="h-3 w-3" />
          </span>
        )}
        <span className="text-sm font-medium truncate max-w-[150px]">{name}</span>
      </div>
      <span className={cn(
        "text-sm font-bold",
        occupancy >= 80 && "text-green-600",
        occupancy >= 50 && occupancy < 80 && "text-orange-500",
        occupancy < 50 && "text-red-500"
      )}>
        {occupancy}%
      </span>
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

  // Récupération des données en parallèle
  const [
    // Métriques générales
    sitesResult,
    companiesResult,
    activeUsersResult,

    // Réservations temps réel (aujourd'hui)
    todayBenchBookingsResult,
    todayMeetingRoomBookingsResult,

    // Support tickets
    openTicketsResult,
    resolvedTicketsResult,

    // Crédits
    creditsResult,

    // Données pour occupation des sites
    resourcesResult,
    bookingsThisWeekResult,
    bookingsThisMonthResult,
    bookingsTodayResult,

    // Croissance abonnements
    companiesThisMonthResult,
    companiesLastMonthResult,
  ] = await Promise.all([
    // Nombre de sites
    supabase.from("sites").select("*", { count: "exact", head: true }).eq("status", "open"),

    // Nombre d'entreprises
    supabase.from("companies").select("*", { count: "exact", head: true }),

    // Membres actifs
    supabase.from("users").select("*", { count: "exact", head: true }).eq("status", "active"),

    // Réservations benchs aujourd'hui
    supabase
      .from("bookings")
      .select("id, resource:resources!inner(type)", { count: "exact" })
      .eq("status", "confirmed")
      .eq("resources.type", "bench")
      .gte("start_date", todayStart.toISOString())
      .lte("start_date", todayEnd.toISOString()),

    // Réservations salles aujourd'hui
    supabase
      .from("bookings")
      .select("id, resource:resources!inner(type)", { count: "exact" })
      .eq("status", "confirmed")
      .eq("resources.type", "meeting_room")
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

    // Crédits
    supabase.from("credits").select("allocated_credits, remaining_credits"),

    // Ressources par site
    supabase.from("resources").select("id, site_id, type, capacity, site:sites!inner(id, name, status)").eq("sites.status", "open"),

    // Réservations cette semaine par ressource
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", weekStart.toISOString())
      .lte("start_date", weekEnd.toISOString()),

    // Réservations ce mois par ressource
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", monthStart.toISOString())
      .lte("start_date", monthEnd.toISOString()),

    // Réservations aujourd'hui par ressource
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", todayStart.toISOString())
      .lte("start_date", todayEnd.toISOString()),

    // Nouvelles entreprises ce mois
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString())
      .lte("created_at", monthEnd.toISOString()),

    // Nouvelles entreprises le mois dernier
    supabase
      .from("companies")
      .select("*", { count: "exact", head: true })
      .gte("created_at", lastMonthStart.toISOString())
      .lte("created_at", lastMonthEnd.toISOString()),
  ])

  // Calculs des métriques
  const sitesCount = sitesResult.count || 0
  const companiesCount = companiesResult.count || 0
  const activeUsersCount = activeUsersResult.count || 0

  const todayBenchBookings = todayBenchBookingsResult.count || 0
  const todayMeetingRoomBookings = todayMeetingRoomBookingsResult.count || 0

  const openTickets = openTicketsResult.count || 0
  const resolvedTickets = resolvedTicketsResult.count || 0
  const totalTickets = openTickets + resolvedTickets
  const ticketResolutionRate = totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100) : 0

  // Calcul du taux d'utilisation des crédits
  const credits = creditsResult.data || []
  const totalAllocated = credits.reduce((sum, c) => sum + (c.allocated_credits || 0), 0)
  const totalRemaining = credits.reduce((sum, c) => sum + (c.remaining_credits || 0), 0)
  const totalUsed = totalAllocated - totalRemaining
  const creditUsageRate = totalAllocated > 0 ? Math.round((totalUsed / totalAllocated) * 100) : 0

  // Croissance abonnements
  const newCompaniesThisMonth = companiesThisMonthResult.count || 0
  const newCompaniesLastMonth = companiesLastMonthResult.count || 0
  const subscriptionGrowth = newCompaniesLastMonth > 0
    ? Math.round(((newCompaniesThisMonth - newCompaniesLastMonth) / newCompaniesLastMonth) * 100)
    : newCompaniesThisMonth > 0 ? 100 : 0

  // Calcul occupation par site
  const resources = resourcesResult.data || []
  const bookingsWeek = bookingsThisWeekResult.data || []
  const bookingsMonth = bookingsThisMonthResult.data || []
  const bookingsToday = bookingsTodayResult.data || []

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
  const monthlyOccupancies = calculateOccupancyBySite(bookingsMonth, 22) // ~22 jours ouvrés
  const dailyOccupancies = calculateOccupancyBySite(bookingsToday, 1)

  // Site le plus occupé par période
  const mostOccupiedDay = dailyOccupancies.length > 0 ? dailyOccupancies[0] : null
  const mostOccupiedWeek = weeklyOccupancies.length > 0 ? weeklyOccupancies[0] : null
  const mostOccupiedMonth = monthlyOccupancies.length > 0 ? monthlyOccupancies[0] : null

  // Site le moins occupé par période
  const leastOccupiedWeek = weeklyOccupancies.length > 0 ? weeklyOccupancies[weeklyOccupancies.length - 1] : null
  const leastOccupiedMonth = monthlyOccupancies.length > 0 ? monthlyOccupancies[monthlyOccupancies.length - 1] : null
  const leastOccupiedDay = dailyOccupancies.length > 0 ? dailyOccupancies[dailyOccupancies.length - 1] : null

  // Taux d'occupation global (semaine)
  const totalCapacity = Array.from(siteCapacities.values()).reduce((sum, s) => sum + s.capacity, 0)
  const totalBookingsWeek = bookingsWeek.reduce((sum, b) => sum + (b.seats_count || 1), 0)
  const globalOccupancyRate = totalCapacity > 0
    ? Math.round((totalBookingsWeek / (totalCapacity * 5)) * 100)
    : 0

  return (
    <div className="space-y-6">
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

      {/* Section principale : Occupation + Clients */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        {/* Carte Occupation - grande */}
        <div className="lg:col-span-2 rounded-lg bg-card p-5 sm:p-6 border border-border/50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h2 className="font-header text-lg uppercase tracking-wide">Occupation</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Taux de présence cette semaine</p>
              <div className="flex items-baseline gap-2 mt-3">
                <span className="font-header text-4xl sm:text-5xl">{globalOccupancyRate}%</span>
                {globalOccupancyRate > 0 && (
                  <span className="text-green-600 text-sm font-medium flex items-center">
                    <TrendingUp className="h-4 w-4 mr-0.5" />
                    actif
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {totalBookingsWeek} réservations / {totalCapacity * 5} places disponibles
              </p>
            </div>
            <CircularGauge value={globalOccupancyRate} label="global" size="lg" />
          </div>
        </div>

        {/* Carte Clients */}
        <div className="rounded-lg bg-card p-5 border border-border/50">
          <h2 className="font-header text-sm uppercase tracking-wide mb-4">Clients</h2>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Membres Actifs</p>
              <p className="font-header text-2xl">{activeUsersCount.toLocaleString("fr-FR")}</p>
            </div>
            <div className="h-px bg-border" />
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Entreprises</p>
              <p className="font-header text-2xl">{companiesCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Section Réservations temps réel */}
      <div className="rounded-lg bg-card p-5 border border-border/50">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-header text-sm uppercase tracking-wide">Réservations</h2>
          <span className="text-[10px] bg-brand text-brand-foreground px-2 py-0.5 rounded-full font-medium">
            TEMPS RÉEL
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <Armchair className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="font-header text-xl">{todayBenchBookings}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">Benchs</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <DoorOpen className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="font-header text-xl">{todayMeetingRoomBookings}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">Salles</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <Calendar className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="font-header text-xl">{todayBenchBookings + todayMeetingRoomBookings}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">Total Jour</p>
          </div>
          <div className="bg-muted/50 p-4 rounded-lg text-center">
            <Building2 className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
            <p className="font-header text-xl">{sitesCount}</p>
            <p className="text-[9px] text-muted-foreground uppercase font-medium">Sites Actifs</p>
          </div>
        </div>
      </div>

      {/* Grille métriques secondaires */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {/* Crédits */}
        <div className="rounded-lg bg-card p-5 border border-border/50">
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-header text-sm uppercase tracking-wide">Crédits</h2>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Usage Global</p>
          <p className="font-header text-2xl mb-3">{creditUsageRate}%</p>
          <ProgressBar value={creditUsageRate} color="default" showValue={false} />
          <p className="text-[9px] text-muted-foreground mt-2">
            {totalUsed.toLocaleString("fr-FR")} / {totalAllocated.toLocaleString("fr-FR")} crédits utilisés
          </p>
        </div>

        {/* Support */}
        <div className="rounded-lg bg-card p-5 border border-border/50">
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-header text-sm uppercase tracking-wide">Support</h2>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-medium">Ouverts</span>
              <span className="font-header text-lg text-orange-500">{openTickets}</span>
            </div>
            <ProgressBar
              value={openTickets}
              maxValue={Math.max(totalTickets, 1)}
              color="orange"
              showValue={false}
            />
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-medium">Résolus</span>
              <span className="font-header text-lg text-green-600">{resolvedTickets}</span>
            </div>
            <ProgressBar
              value={resolvedTickets}
              maxValue={Math.max(totalTickets, 1)}
              color="green"
              showValue={false}
            />
          </div>
        </div>

        {/* Croissance Abonnements */}
        <div className="rounded-lg bg-card p-5 border border-border/50">
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-header text-sm uppercase tracking-wide">Croissance</h2>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Abonnements</p>
          <div className="flex items-baseline gap-2">
            <span className="font-header text-2xl">{subscriptionGrowth > 0 ? "+" : ""}{subscriptionGrowth}%</span>
            {subscriptionGrowth > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : subscriptionGrowth < 0 ? (
              <TrendingDown className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
          <p className="text-[9px] text-muted-foreground mt-2">
            {newCompaniesThisMonth} nouvelle{newCompaniesThisMonth !== 1 ? "s" : ""} entreprise{newCompaniesThisMonth !== 1 ? "s" : ""} ce mois
          </p>
        </div>

        {/* Sites Actifs */}
        <div className="rounded-lg bg-card p-5 border border-border/50">
          <div className="flex items-start justify-between mb-3">
            <h2 className="font-header text-sm uppercase tracking-wide">Sites</h2>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] text-muted-foreground uppercase font-medium mb-1">Actifs</p>
          <p className="font-header text-2xl mb-2">{sitesCount}</p>
          <Link
            href="/admin/sites"
            className="text-xs text-brand hover:underline"
          >
            Voir tous les sites →
          </Link>
        </div>
      </div>

      {/* Section Sites : Top 3 + Moins occupé */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Site le plus occupé */}
        <div className="rounded-lg bg-card p-5 border border-border/50">
          <h2 className="font-header text-sm uppercase tracking-wide mb-4">
            Site le plus occupé
          </h2>
          <div className="space-y-4">
            {/* Aujourd'hui */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Aujourd&apos;hui</p>
              {mostOccupiedDay ? (
                <SiteOccupancyItem
                  name={mostOccupiedDay.name}
                  occupancy={mostOccupiedDay.occupancy}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Cette semaine */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Cette semaine</p>
              {mostOccupiedWeek ? (
                <SiteOccupancyItem
                  name={mostOccupiedWeek.name}
                  occupancy={mostOccupiedWeek.occupancy}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Ce mois */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Ce mois</p>
              {mostOccupiedMonth ? (
                <SiteOccupancyItem
                  name={mostOccupiedMonth.name}
                  occupancy={mostOccupiedMonth.occupancy}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </div>
          </div>
        </div>

        {/* Site le moins occupé */}
        <div className="rounded-lg bg-card p-5 border border-border/50">
          <h2 className="font-header text-sm uppercase tracking-wide mb-4">
            Site le moins occupé
          </h2>
          <div className="space-y-4">
            {/* Aujourd'hui */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Aujourd&apos;hui</p>
              {leastOccupiedDay ? (
                <SiteOccupancyItem
                  name={leastOccupiedDay.name}
                  occupancy={leastOccupiedDay.occupancy}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Cette semaine */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Cette semaine</p>
              {leastOccupiedWeek ? (
                <SiteOccupancyItem
                  name={leastOccupiedWeek.name}
                  occupancy={leastOccupiedWeek.occupancy}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </div>

            <div className="h-px bg-border" />

            {/* Ce mois */}
            <div>
              <p className="text-[10px] text-muted-foreground uppercase font-medium mb-2">Ce mois</p>
              {leastOccupiedMonth ? (
                <SiteOccupancyItem
                  name={leastOccupiedMonth.name}
                  occupancy={leastOccupiedMonth.occupancy}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Aucune donnée</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
