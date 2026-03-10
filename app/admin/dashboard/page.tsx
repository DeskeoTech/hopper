import { createClient } from "@/lib/supabase/server"
import Stripe from "stripe"
import { BarChart3 } from "lucide-react"
import { fetchGaMetrics, getAvailableGaAccounts } from "@/lib/google-analytics"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, format, isToday, eachDayOfInterval, isWeekend } from "date-fns"
import { fr } from "date-fns/locale"
import { DateNavigator } from "@/components/admin/accueil/date-navigator"
import { DetailsTabs } from "@/components/admin/details-tabs"
import { OverviewTab } from "@/components/admin/analytics/overview-tab"
import { SalesTab } from "@/components/admin/analytics/sales-tab"
import { MarketingTab } from "@/components/admin/analytics/marketing-tab"
import { ReportsTab } from "@/components/admin/analytics/reports-tab"
import { Suspense } from "react"
import { unstable_cache } from "next/cache"

function countBusinessDays(start: Date, end: Date): number {
  return eachDayOfInterval({ start, end }).filter((d) => !isWeekend(d)).length || 1
}

type ResourceType = "bench" | "meeting_room" | "flex_desk" | "fixed_desk"

interface DashboardPageProps {
  searchParams: Promise<{ date?: string; tab?: string; period?: string; mode?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const today = new Date().toISOString().split("T")[0]
  const selectedDate = params.date || today
  const activeTab = params.tab || "overview"
  const now = new Date(selectedDate + "T12:00:00")
  const isViewingToday = isToday(now)

  const period = params.period || "month"
  const periodMode = params.mode || "calendar"

  let overviewContent = null
  let salesContent = null
  let marketingContent = null
  let reportsContent = null
  if (activeTab === "overview") {
    overviewContent = await loadOverviewData(now, period, periodMode)
  } else if (activeTab === "sales") {
    salesContent = await loadSalesData(now, period, periodMode)
  } else if (activeTab === "marketing") {
    marketingContent = await loadMarketingData(now, period, periodMode)
  } else if (activeTab === "reports") {
    reportsContent = await loadReportsData(now)
  }

  const tabs = [
    {
      value: "overview",
      label: "Vue d'ensemble",
      content: overviewContent ?? <div />,
    },
    {
      value: "sales",
      label: "Ventes",
      content: salesContent ?? <div />,
    },
    {
      value: "marketing",
      label: "Marketing",
      content: marketingContent ?? <div />,
    },
    {
      value: "reports",
      label: "Rapports",
      content: reportsContent ?? <div />,
    },
  ]

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
          <BarChart3 className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="type-h2 text-foreground">Dashboard</h1>
            {isViewingToday && (
              <span className="inline-flex items-center rounded-sm bg-brand px-2 py-0.5 text-[10px] font-medium uppercase text-brand-foreground">
                Temps réel
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Analytique • {format(now, "EEEE d MMMM yyyy", { locale: fr })}
          </p>
        </div>
        <div className="shrink-0">
          <Suspense fallback={null}>
            <DateNavigator currentDate={selectedDate} basePath="/admin/dashboard" />
          </Suspense>
        </div>
      </div>

      {/* Tabs */}
      <DetailsTabs defaultTab={activeTab} tabs={tabs} />
    </div>
  )
}

async function loadOverviewData(now: Date, period: string, periodMode: string = "calendar") {
  const supabase = await createClient()

  const { start: periodStart, end: periodEnd } = getSalesPeriodRange(now, period, periodMode)

  // Previous period of equal length for cancellation trend
  const periodDurationMs = periodEnd.getTime() - periodStart.getTime()
  const prevPeriodEnd = new Date(periodStart.getTime() - 1)
  const prevPeriodStart = new Date(prevPeriodEnd.getTime() - periodDurationMs)

  // Business days in period (excluding weekends)
  const overviewBusinessDays = countBusinessDays(periodStart, periodEnd)

  const [
    companiesResult,
    resourcesResult,
    bookingsPeriodResult,
    bookingsCountResult,
    meetingRoomBookingsResult,
    confirmedResult,
    cancelledResult,
    totalBookingsResult,
    cancelledPrevResult,
    totalBookingsPrevResult,
    // Detail queries
    companiesByTypeResult,
    bookingsWithTypeResult,
    cancelledBookingsDetailResult,
    confirmedBookingsDetailResult,
    bookingsDetailResult,
  ] = await Promise.all([
    supabase.from("companies").select("*", { count: "exact", head: true }),
    // Resources with sites
    supabase
      .from("resources")
      .select("id, site_id, type, capacity, site:sites!inner(id, name, status)")
      .eq("sites.status", "open"),
    // Bookings in period (for occupation calc)
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", periodStart.toISOString())
      .lte("start_date", periodEnd.toISOString()),
    // Bookings count in period
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("start_date", periodStart.toISOString())
      .lte("start_date", periodEnd.toISOString()),
    // Meeting room bookings in period (for top rankings)
    supabase
      .from("bookings")
      .select("id, resource_id, resource:resources!inner(id, name, type, site_id, site:sites!inner(name))")
      .eq("status", "confirmed")
      .eq("resources.type", "meeting_room")
      .gte("start_date", periodStart.toISOString())
      .lte("start_date", periodEnd.toISOString()),
    // Confirmed bookings in period
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "confirmed")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString()),
    // Cancelled in period
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString()),
    // Total bookings in period
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString()),
    // Cancelled previous period
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("status", "cancelled")
      .gte("created_at", prevPeriodStart.toISOString())
      .lte("created_at", prevPeriodEnd.toISOString()),
    // Total previous period
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("created_at", prevPeriodStart.toISOString())
      .lte("created_at", prevPeriodEnd.toISOString()),
    // --- Detail queries ---
    supabase.from("companies").select("name, company_type, meeting_room_only"),
    // Bookings in period with resource type
    supabase
      .from("bookings")
      .select("id, resource:resources!inner(type)")
      .eq("status", "confirmed")
      .gte("start_date", periodStart.toISOString())
      .lte("start_date", periodEnd.toISOString()),
    // Cancelled bookings detail
    supabase
      .from("bookings")
      .select("id, start_date, end_date, created_at, user:users(first_name, last_name), resource:resources!inner(name, type, site:sites!inner(name))")
      .eq("status", "cancelled")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
    // Confirmed bookings detail
    supabase
      .from("bookings")
      .select("id, start_date, end_date, created_at, user:users(first_name, last_name), resource:resources!inner(name, type, site:sites!inner(name))")
      .eq("status", "confirmed")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString())
      .order("created_at", { ascending: false })
      .limit(50),
    // Bookings with full details
    supabase
      .from("bookings")
      .select("id, start_date, end_date, created_at, user:users(first_name, last_name), resource:resources!inner(name, type, site:sites!inner(name))")
      .eq("status", "confirmed")
      .gte("start_date", periodStart.toISOString())
      .lte("start_date", periodEnd.toISOString())
      .order("start_date", { ascending: false })
      .limit(50),
  ])

  // KPIs
  const companiesCount = companiesResult.count || 0
  const bookingsCount = bookingsCountResult.count || 0

  // Booking counts per site (all resource types, capacity-weighted)
  const resources = resourcesResult.data || []
  const bookingsPeriod = bookingsPeriodResult.data || []

  const resourceToSite = new Map<string, string>()
  const siteNames = new Map<string, string>()
  const siteDailyCapacities = new Map<string, number>()
  resources.forEach((r) => {
    if (r.site_id && r.site) {
      const siteData = r.site as { id: string; name: string; status: string }
      resourceToSite.set(r.id, r.site_id)
      siteNames.set(r.site_id, siteData.name)
      siteDailyCapacities.set(r.site_id, (siteDailyCapacities.get(r.site_id) || 0) + (r.capacity || 1))
    }
  })

  const siteBookingCounts = new Map<string, number>()
  bookingsPeriod.forEach((b) => {
    if (b.resource_id) {
      const siteId = resourceToSite.get(b.resource_id)
      if (siteId) siteBookingCounts.set(siteId, (siteBookingCounts.get(siteId) || 0) + (b.seats_count || 1))
    }
  })

  const bookingsBySite: { siteId: string; siteName: string; bookingCount: number; dailyAvg: number; dailyCapacity: number }[] = []
  siteNames.forEach((name, siteId) => {
    const count = siteBookingCounts.get(siteId) || 0
    const dailyCap = siteDailyCapacities.get(siteId) || 0
    const dailyAvg = Math.round((count / overviewBusinessDays) * 10) / 10
    bookingsBySite.push({ siteId, siteName: name, bookingCount: count, dailyAvg, dailyCapacity: dailyCap })
  })
  bookingsBySite.sort((a, b) => b.bookingCount - a.bookingCount)

  const overviewTotalBookingCount = bookingsBySite.reduce((sum, s) => sum + s.bookingCount, 0)

  // Today's availability
  const siteResourcesByType = new Map<string, { benchCap: number; meetingCap: number }>()
  resources.forEach((r) => {
    if (r.site_id) {
      const capacity = r.capacity || 1
      const type = r.type as ResourceType
      const existing = siteResourcesByType.get(r.site_id)
      if (existing) {
        if (type === "flex_desk") existing.benchCap += capacity
        else if (type === "meeting_room") existing.meetingCap += capacity
      } else {
        siteResourcesByType.set(r.site_id, {
          benchCap: type === "flex_desk" ? capacity : 0,
          meetingCap: type === "meeting_room" ? capacity : 0,
        })
      }
    }
  })

  let totalBenchCapacity = 0
  let totalBenchBooked = 0
  let totalMeetingRoomCapacity = 0
  let totalMeetingRoomBooked = 0

  siteResourcesByType.forEach((site) => {
    totalBenchCapacity += site.benchCap
    totalMeetingRoomCapacity += site.meetingCap
  })

  const resourceTypeMap = new Map<string, ResourceType>()
  resources.forEach((r) => {
    resourceTypeMap.set(r.id, r.type as ResourceType)
  })

  bookingsPeriod.forEach((b) => {
    if (b.resource_id) {
      const type = resourceTypeMap.get(b.resource_id)
      const seats = b.seats_count || 1
      if (type === "flex_desk") totalBenchBooked += seats
      else if (type === "meeting_room") totalMeetingRoomBooked += seats
    }
  })

  // Daily average for the period
  totalBenchBooked = Math.round(totalBenchBooked / overviewBusinessDays)
  totalMeetingRoomBooked = Math.round(totalMeetingRoomBooked / overviewBusinessDays)

  // Top meeting rooms
  const meetingRoomBookings = meetingRoomBookingsResult.data || []
  const roomCounts = new Map<string, { id: string; name: string; siteName: string; count: number }>()
  const siteCounts = new Map<string, { siteId: string; siteName: string; count: number }>()

  meetingRoomBookings.forEach((b) => {
    if (!b.resource_id) return
    const resource = b.resource as { id: string; name: string; type: string; site_id: string; site: { name: string } } | null
    if (!resource) return

    const room = roomCounts.get(b.resource_id)
    if (room) room.count++
    else roomCounts.set(b.resource_id, { id: resource.id, name: resource.name, siteName: resource.site.name, count: 1 })

    const site = siteCounts.get(resource.site_id)
    if (site) site.count++
    else siteCounts.set(resource.site_id, { siteId: resource.site_id, siteName: resource.site.name, count: 1 })
  })

  // Also add flex desk bookings to site counts
  bookingsPeriod.forEach((b) => {
    if (b.resource_id) {
      const siteId = resourceToSite.get(b.resource_id)
      if (siteId) {
        const name = siteNames.get(siteId)
        if (name) {
          const existing = siteCounts.get(siteId)
          const seats = b.seats_count || 1
          if (existing) existing.count += seats
          else siteCounts.set(siteId, { siteId, siteName: name, count: seats })
        }
      }
    }
  })

  const topMeetingRooms = Array.from(roomCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((r) => ({ resourceId: r.id, resourceName: r.name, siteName: r.siteName, bookingsCount: r.count }))

  const topSites = Array.from(siteCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((s) => ({ siteId: s.siteId, siteName: s.siteName, bookingsCount: s.count }))

  // Cancellation
  const cancelledThisPeriod = cancelledResult.count || 0
  const totalThisPeriod = totalBookingsResult.count || 0
  const cancellationRate = totalThisPeriod > 0 ? Math.round((cancelledThisPeriod / totalThisPeriod) * 100) : 0

  const cancelledPrev = cancelledPrevResult.count || 0
  const totalPrev = totalBookingsPrevResult.count || 0
  const prevRate = totalPrev > 0 ? Math.round((cancelledPrev / totalPrev) * 100) : 0

  const cancellationTrend = totalPrev > 0 ? cancellationRate - prevRate : undefined

  // Company breakdown
  const allCompanies = companiesByTypeResult.data || []
  const selfEmployedCompanies = allCompanies.filter((c) => c.company_type === "self_employed")
  const multiEmployeeCompanies = allCompanies.filter((c) => c.company_type === "multi_employee")
  const meetingRoomOnlyCompanies = allCompanies.filter((c) => c.meeting_room_only === true)
  const companyBreakdown = {
    selfEmployed: selfEmployedCompanies.length,
    multiEmployee: multiEmployeeCompanies.length,
    meetingRoomOnly: meetingRoomOnlyCompanies.length,
    selfEmployedNames: selfEmployedCompanies.map((c) => c.name || "—").sort(),
    multiEmployeeNames: multiEmployeeCompanies.map((c) => c.name || "—").sort(),
    meetingRoomOnlyNames: meetingRoomOnlyCompanies.map((c) => c.name || "—").sort(),
  }

  // Bookings by type
  const bookingsTyped = bookingsWithTypeResult.data || []
  const bookingsByType = {
    flexDesk: bookingsTyped.filter((b) => {
      const res = b.resource as { type: string } | null
      return res?.type === "flex_desk" || res?.type === "bench"
    }).length,
    meetingRoom: bookingsTyped.filter((b) => {
      const res = b.resource as { type: string } | null
      return res?.type === "meeting_room"
    }).length,
  }

  // Booking detail mapper
  function mapBookingDetail(b: { id: string; start_date: string; resource: unknown; user: unknown }) {
    const resource = b.resource as { name: string; type: string; site: { name: string } } | null
    const user = b.user as { first_name: string | null; last_name: string | null } | null
    return {
      id: b.id,
      startDate: b.start_date,
      resourceName: resource?.name || "—",
      resourceType: resource?.type || "—",
      siteName: resource?.site?.name || "—",
      userName: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "—" : "—",
    }
  }

  const cancelledBookingsDetail = (cancelledBookingsDetailResult.data || []).map(mapBookingDetail)
  const confirmedBookingsDetail = (confirmedBookingsDetailResult.data || []).map(mapBookingDetail)
  const allBookingsDetail = (bookingsDetailResult.data || []).map(mapBookingDetail)
  const flexDeskBookings = allBookingsDetail.filter((b) => b.resourceType === "flex_desk" || b.resourceType === "bench")
  const meetingRoomBookingsDetail = allBookingsDetail.filter((b) => b.resourceType === "meeting_room")

  return (
    <OverviewTab
      companiesCount={companiesCount}
      bookingsCount={bookingsCount}
      bookingsBySite={bookingsBySite}
      totalBookingCount={overviewTotalBookingCount}
      totalBenchAvailable={Math.max(0, totalBenchCapacity - totalBenchBooked)}
      totalBenchCapacity={totalBenchCapacity}
      totalMeetingRoomAvailable={Math.max(0, totalMeetingRoomCapacity - totalMeetingRoomBooked)}
      totalMeetingRoomCapacity={totalMeetingRoomCapacity}
      cancellationRate={cancellationRate}
      cancelledCount={cancelledThisPeriod}
      totalBookings={totalThisPeriod}
      topMeetingRooms={topMeetingRooms}
      topSites={topSites}
      companyBreakdown={companyBreakdown}
      bookingsByType={bookingsByType}
      cancelledBookings={cancelledBookingsDetail}
      confirmedBookings={confirmedBookingsDetail}
      flexDeskBookings={flexDeskBookings}
      meetingRoomBookings={meetingRoomBookingsDetail}
      period={period}
      periodMode={periodMode}
    />
  )
}

// Serializable charge shape (Stripe.Charge has non-serializable methods)
interface CachedCharge {
  id: string
  created: number
  amount: number
  status: string
  description: string | null
  customer: string | null
  billingName: string | null
  billingEmail: string | null
  receiptEmail: string | null
  refunded: boolean
  amountRefunded: number
  bookingType: string | null
  paymentIntent: string | null
}

interface CachedSession {
  paymentIntentId: string
  productId: string
  productName: string
}

interface CachedProduct {
  id: string
  name: string
  unitPrice: number | null
}

// Cached Stripe products fetch — revalidates every hour (products change rarely)
const fetchStripeProductsCached = unstable_cache(
  async (account: string): Promise<CachedProduct[]> => {
    const secretKey = account === "coworking"
      ? process.env.STRIPE_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY_2
    if (!secretKey) return []
    try {
      const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" })
      const products = await stripe.products.list({
        limit: 100,
        active: true,
        expand: ["data.default_price"],
      })
      return products.data.map((p) => ({
        id: p.id,
        name: p.name,
        unitPrice:
          p.default_price && typeof p.default_price !== "string" && p.default_price.unit_amount
            ? p.default_price.unit_amount / 100
            : null,
      }))
    } catch (error) {
      console.error(`Stripe products fetch error (${account}):`, error)
      return []
    }
  },
  ["stripe-sales-products"],
  { revalidate: 3600 }
)

// Cached Stripe fetch — revalidates every 5 minutes
const fetchStripeChargesCached = unstable_cache(
  async (account: string, createdGte: number, createdLte: number): Promise<CachedCharge[]> => {
    const secretKey = account === "coworking"
      ? process.env.STRIPE_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY_2
    if (!secretKey) return []
    try {
      const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" })
      const charges = await stripe.charges.list({
        created: { gte: createdGte, lte: createdLte },
        limit: 100,
      })
      return charges.data.map((c) => ({
        id: c.id,
        created: c.created,
        amount: c.amount,
        status: c.status,
        description: c.description,
        customer: typeof c.customer === "string" ? c.customer : null,
        billingName: c.billing_details?.name || null,
        billingEmail: c.billing_details?.email || null,
        receiptEmail: c.receipt_email || null,
        refunded: c.refunded,
        amountRefunded: c.amount_refunded || 0,
        bookingType: c.metadata?.bookingType || null,
        paymentIntent: typeof c.payment_intent === "string" ? c.payment_intent : null,
      }))
    } catch (error) {
      console.error(`Stripe charges fetch error (${account}):`, error)
      return []
    }
  },
  ["stripe-sales-charges"],
  { revalidate: 300 }
)

// Cached Stripe checkout sessions fetch — maps payment_intent → product
const fetchStripeSessionsCached = unstable_cache(
  async (account: string, createdGte: number, createdLte: number): Promise<CachedSession[]> => {
    const secretKey = account === "coworking"
      ? process.env.STRIPE_SECRET_KEY
      : process.env.STRIPE_SECRET_KEY_2
    if (!secretKey) return []
    try {
      const stripe = new Stripe(secretKey, { apiVersion: "2024-12-18.acacia" })
      const sessions = await stripe.checkout.sessions.list({
        created: { gte: createdGte, lte: createdLte },
        limit: 100,
        expand: ["data.line_items"],
      })
      const result: CachedSession[] = []
      for (const session of sessions.data) {
        const piId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id
        if (!piId || !session.line_items?.data?.length) continue

        const firstItem = session.line_items.data[0]
        const productId = typeof firstItem.price?.product === "string"
          ? firstItem.price.product
          : undefined

        if (productId) {
          result.push({
            paymentIntentId: piId,
            productId,
            productName: firstItem.description || "Unknown",
          })
        }
      }
      return result
    } catch (error) {
      console.error(`Stripe sessions fetch error (${account}):`, error)
      return []
    }
  },
  ["stripe-sales-sessions"],
  { revalidate: 300 }
)

// Compute KPIs from cached charges (amounts in cents)
function computeAccountKpis(charges: CachedCharge[]) {
  const succeeded = charges.filter((c) => c.status === "succeeded")
  const totalRevenue = succeeded.reduce((sum, c) => sum + c.amount, 0) / 100
  const totalRefunded = charges.reduce((sum, c) => sum + (c.amountRefunded || 0), 0) / 100
  const netRevenue = totalRevenue - totalRefunded
  const count = succeeded.length
  return {
    totalRevenue,
    totalRefunded,
    netRevenue,
    transactionCount: count,
    avgTransaction: count > 0 ? totalRevenue / count : 0,
  }
}

function getSalesPeriodRange(now: Date, period: string, mode: string = "calendar"): { start: Date; end: Date } {
  if (mode === "rolling") {
    switch (period) {
      case "today":
        return { start: startOfDay(now), end: endOfDay(now) }
      case "week": {
        const start = new Date(now)
        start.setDate(start.getDate() - 6)
        return { start: startOfDay(start), end: endOfDay(now) }
      }
      case "month": {
        const start = new Date(now)
        start.setDate(start.getDate() - 29)
        return { start: startOfDay(start), end: endOfDay(now) }
      }
      case "3months":
        return { start: startOfDay(subMonths(now, 3)), end: endOfDay(now) }
      case "year":
        return { start: startOfDay(subMonths(now, 12)), end: endOfDay(now) }
      case "3years":
        return { start: startOfDay(subMonths(now, 36)), end: endOfDay(now) }
      case "all":
        return { start: new Date(2020, 0, 1), end: endOfDay(now) }
      default:
        return { start: startOfDay(subMonths(now, 1)), end: endOfDay(now) }
    }
  }

  // Calendar mode (default)
  switch (period) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) }
    case "week":
      return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) }
    case "month":
      return { start: startOfMonth(now), end: endOfMonth(now) }
    case "3months":
      return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) }
    case "year":
      return { start: startOfMonth(subMonths(now, 11)), end: endOfMonth(now) }
    case "3years":
      return { start: startOfMonth(subMonths(now, 35)), end: endOfMonth(now) }
    case "all":
      return { start: new Date(2020, 0, 1), end: endOfDay(now) }
    default:
      return { start: startOfMonth(now), end: endOfMonth(now) }
  }
}

async function loadSalesData(now: Date, period: string, periodMode: string = "calendar") {
  const supabase = await createClient()
  const { start: periodStart, end: periodEnd } = getSalesPeriodRange(now, period, periodMode)

  const createdGte = Math.floor(periodStart.getTime() / 1000)
  const createdLte = Math.floor(periodEnd.getTime() / 1000)

  // Business days in period (excluding weekends)
  const salesBusinessDays = countBusinessDays(periodStart, periodEnd)

  // Fetch companies lookup + both Stripe accounts + products + sessions + bookings data in parallel
  const [companiesStripeResult, coworkingCharges, collectionsCharges, coworkingProducts, collectionsProducts, coworkingSessions, collectionsSessions, resourcesResult, bookingsPeriodResult] = await Promise.all([
    supabase
      .from("companies")
      .select("id, name, customer_id_stripe, main_site_id")
      .not("customer_id_stripe", "is", null),
    fetchStripeChargesCached("coworking", createdGte, createdLte),
    fetchStripeChargesCached("collections", createdGte, createdLte),
    fetchStripeProductsCached("coworking"),
    fetchStripeProductsCached("collections"),
    fetchStripeSessionsCached("coworking", createdGte, createdLte),
    fetchStripeSessionsCached("collections", createdGte, createdLte),
    supabase
      .from("resources")
      .select("id, site_id, type, capacity, site:sites!inner(id, name, status)")
      .eq("sites.status", "open"),
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", periodStart.toISOString())
      .lte("start_date", periodEnd.toISOString()),
  ])

  // Build Stripe customer → company lookup
  const stripeCustomerToCompany = new Map<string, { id: string; name: string; siteId: string | null }>()
  ;(companiesStripeResult.data || []).forEach((c) => {
    if (c.customer_id_stripe) {
      stripeCustomerToCompany.set(c.customer_id_stripe, { id: c.id, name: c.name, siteId: c.main_site_id })
    }
  })

  // Merge all charges, products and sessions from both accounts
  const allCharges = [...coworkingCharges, ...collectionsCharges]
  // Sort products by name length (longest first) to avoid partial matches
  const allProducts = [...coworkingProducts, ...collectionsProducts].sort(
    (a, b) => b.name.length - a.name.length
  )

  // Build payment_intent → product mapping from checkout sessions
  const piToProduct = new Map<string, { productId: string; productName: string }>()
  for (const s of [...coworkingSessions, ...collectionsSessions]) {
    piToProduct.set(s.paymentIntentId, { productId: s.productId, productName: s.productName })
  }

  // Total KPIs
  const totalKpis = computeAccountKpis(allCharges)

  // Normalize product variants into groups (e.g. all "Hopper Pass Day (1 Jour) - Site X" → "Hopper Pass Day")
  function normalizeToGroup(match: { productId: string; productName: string }): { productId: string; productName: string } {
    const n = match.productName.toLowerCase()
    if (n.includes("pass day") || n.includes("pass jour")) return { productId: "__group_pass_day", productName: "Hopper Pass Day" }
    if (n.includes("pass week") || n.includes("pass semaine")) return { productId: "__group_pass_week", productName: "Hopper Pass Week" }
    if (n.includes("pass month") || n.includes("pass mois") || n.includes("pass mensuel")) return { productId: "__group_pass_month", productName: "Hopper Pass Month" }
    if (n.includes("crédit") || n.includes("credit")) return { productId: "__group_credits", productName: "Crédits Hopper" }
    if (n.includes("café") || n.includes("coffee") || n.includes("espresso") || n.includes("latte") || n.includes("juice")) return { productId: "__group_cafe", productName: "Café, Food & Beverage" }
    return match
  }

  // Match charge to raw product (before normalization)
  function matchChargeToRawProduct(charge: CachedCharge): { productId: string; productName: string } {
    // 1. Try payment intent → checkout session → product (most reliable)
    if (charge.paymentIntent) {
      const sessionMatch = piToProduct.get(charge.paymentIntent)
      if (sessionMatch) {
        const product = allProducts.find((p) => p.id === sessionMatch.productId)
        if (product) return { productId: product.id, productName: product.name }
        return sessionMatch
      }
    }
    // 2. Fallback: description matching
    const desc = (charge.description || "").toLowerCase()
    for (const product of allProducts) {
      if (desc.includes(product.name.toLowerCase())) {
        return { productId: product.id, productName: product.name }
      }
    }
    // 3. Fallback: bookingType metadata
    if (charge.bookingType) {
      if (charge.bookingType.includes("Day")) return { productId: "__pass_day", productName: "Hopper Pass Day" }
      if (charge.bookingType.includes("Week")) return { productId: "__pass_week", productName: "Hopper Pass Week" }
      if (charge.bookingType.includes("Month")) return { productId: "__pass_month", productName: "Hopper Pass Month" }
    }
    return { productId: "__other", productName: "Pass & Abonnements" }
  }

  // Match + normalize into groups, with amount-based fallback
  function matchChargeToProduct(charge: CachedCharge): { productId: string; productName: string } {
    const result = normalizeToGroup(matchChargeToRawProduct(charge))
    // Amount-based fallback: < 71€ and not a multiple of 36€ → Café, Food & Beverage
    if (result.productId === "__other" && charge.amount > 0 && charge.amount < 7100 && charge.amount % 3600 !== 0) {
      return { productId: "__group_cafe", productName: "Café, Food & Beverage" }
    }
    return result
  }

  // Find unit price for a group — looks through all products matching the group
  function findGroupUnitPrice(groupId: string): number | null {
    // For grouped products, find unit price from any constituent product
    const groupKeywords: Record<string, string[]> = {
      "__group_pass_day": ["pass day"],
      "__group_pass_week": ["pass week"],
      "__group_pass_month": ["pass month", "pass mois", "pass mensuel"],
      "__group_credits": ["crédit", "credit"],
      "__group_cafe": ["café", "coffee", "espresso", "latte", "juice"],
    }
    const keywords = groupKeywords[groupId]
    if (keywords) {
      const match = allProducts.find((p) => keywords.some((kw) => p.name.toLowerCase().includes(kw)))
      return match?.unitPrice ?? null
    }
    // For non-grouped, direct lookup
    const product = allProducts.find((p) => p.id === groupId)
    return product?.unitPrice ?? null
  }

  // Group charges by product
  const chargesByProduct = new Map<string, { productName: string; unitPrice: number | null; charges: CachedCharge[] }>()
  for (const c of allCharges) {
    const { productId, productName } = matchChargeToProduct(c)
    const existing = chargesByProduct.get(productId)
    if (existing) {
      existing.charges.push(c)
    } else {
      chargesByProduct.set(productId, {
        productName,
        unitPrice: findGroupUnitPrice(productId),
        charges: [c],
      })
    }
  }

  const productKpis = Array.from(chargesByProduct.entries())
    .map(([productId, data]) => ({
      productId,
      productName: data.productName,
      unitPrice: data.unitPrice,
      kpis: computeAccountKpis(data.charges),
    }))
    .filter((p) => p.kpis.transactionCount > 0)
    .sort((a, b) => b.kpis.totalRevenue - a.kpis.totalRevenue)

  // Map charges to StripePayment format
  function mapCharges(charges: CachedCharge[]) {
    return charges.map((c) => {
      const company = c.customer ? stripeCustomerToCompany.get(c.customer) : null
      const raw = matchChargeToRawProduct(c)
      const matched = matchChargeToProduct(c)
      return {
        id: c.id,
        date: new Date(c.created * 1000).toISOString(),
        amount: c.amount,
        status: c.status as "succeeded" | "pending" | "failed",
        description: c.description || "Paiement Stripe",
        companyId: company?.id || "",
        companyName: company?.name || c.billingName || "—",
        customerEmail: c.billingEmail || c.receiptEmail || null,
        refunded: c.refunded,
        amountRefunded: c.amountRefunded,
        productId: matched.productId,
        productName: matched.productName,
        originalProductName: raw.productName,
        companySiteId: company?.siteId || "",
      }
    })
  }

  const payments = mapCharges(allCharges)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // Deduplicate companies for filter
  const companiesMap = new Map<string, string>()
  payments.forEach((p) => {
    if (p.companyId && p.companyName !== "—") {
      companiesMap.set(p.companyId, p.companyName)
    }
  })
  const companies = Array.from(companiesMap.entries())
    .map(([id, name]) => ({ value: id, label: name }))
    .sort((a, b) => a.label.localeCompare(b.label))

  // Booking counts per site (all resource types, capacity-weighted)
  const resources = resourcesResult.data || []
  const bookingsPeriod = bookingsPeriodResult.data || []

  // Map all resources to their site (not just flex_desk/bench)
  const salesResourceToSite = new Map<string, string>()
  const salesSiteNames = new Map<string, string>()
  const salesSiteDailyCapacities = new Map<string, number>()
  resources.forEach((r) => {
    if (r.site_id && r.site) {
      const siteData = r.site as { id: string; name: string; status: string }
      salesResourceToSite.set(r.id, r.site_id)
      salesSiteNames.set(r.site_id, siteData.name)
      salesSiteDailyCapacities.set(r.site_id, (salesSiteDailyCapacities.get(r.site_id) || 0) + (r.capacity || 1))
    }
  })

  // Count bookings per site (seats_count = capacity of the resource booked)
  const salesSiteBookingCounts = new Map<string, number>()
  bookingsPeriod.forEach((b) => {
    if (b.resource_id) {
      const siteId = salesResourceToSite.get(b.resource_id)
      if (siteId) salesSiteBookingCounts.set(siteId, (salesSiteBookingCounts.get(siteId) || 0) + (b.seats_count || 1))
    }
  })

  const bookingsBySite: { siteId: string; siteName: string; bookingCount: number; dailyAvg: number; dailyCapacity: number }[] = []
  salesSiteNames.forEach((name, siteId) => {
    const count = salesSiteBookingCounts.get(siteId) || 0
    const dailyCap = salesSiteDailyCapacities.get(siteId) || 0
    const dailyAvg = Math.round((count / salesBusinessDays) * 10) / 10
    bookingsBySite.push({ siteId, siteName: name, bookingCount: count, dailyAvg, dailyCapacity: dailyCap })
  })
  bookingsBySite.sort((a, b) => b.bookingCount - a.bookingCount)

  const totalBookingCount = bookingsBySite.reduce((sum, s) => sum + s.bookingCount, 0)

  return (
    <SalesTab
      totalKpis={totalKpis}
      productKpis={productKpis}
      payments={payments}
      companies={companies}
      period={period}
      periodMode={periodMode}
      periodStartDate={format(periodStart, "d MMM yyyy", { locale: fr })}
      periodEndDate={format(periodEnd, "d MMM yyyy", { locale: fr })}
      bookings={{ total: totalBookingCount, bySite: bookingsBySite }}
    />
  )
}

function getDateGrouping(period: string): "hour" | "day" | "week" | "month" {
  switch (period) {
    case "today": return "hour"
    case "week": return "day"
    case "month": return "day"
    case "3months": return "week"
    case "year": return "month"
    case "3years": return "month"
    case "all": return "month"
    default: return "day"
  }
}


async function loadMarketingData(now: Date, period: string, periodMode: string = "calendar") {
  const supabase = await createClient()
  const { start: periodStart, end: periodEnd } = getSalesPeriodRange(now, period, periodMode)

  const createdGte = Math.floor(periodStart.getTime() / 1000)
  const createdLte = Math.floor(periodEnd.getTime() / 1000)

  const [
    newCompaniesResult,
    allCompaniesResult,
    bookingsResult,
    sitesResult,
    coworkingCharges,
    collectionsCharges,
  ] = await Promise.all([
    // 1. New companies in period
    supabase
      .from("companies")
      .select("id, name, created_at, company_type, from_spacebring, onboarding_done, meeting_room_only, customer_id_stripe, main_site_id, utm_source, utm_medium, utm_campaign")
      .gte("created_at", periodStart.toISOString())
      .lte("created_at", periodEnd.toISOString()),
    // 2. All companies
    supabase
      .from("companies")
      .select("id, name, company_type, from_spacebring, onboarding_done, meeting_room_only, created_at, customer_id_stripe, main_site_id, utm_source, utm_medium, utm_campaign"),
    // 3. Bookings in period with user → company + resource → site
    supabase
      .from("bookings")
      .select(`id, created_at, start_date, status, seats_count, referral,
        user:users!left(id, first_name, last_name, email, company_id, company:companies!left(id, name, from_spacebring)),
        resource:resources!inner(id, type, site_id, site:sites!inner(id, name))`)
      .gte("start_date", periodStart.toISOString())
      .lte("start_date", periodEnd.toISOString())
      .limit(10000),
    // 4. Sites for filter
    supabase.from("sites").select("id, name").eq("status", "open"),
    // 5. Stripe charges
    fetchStripeChargesCached("coworking", createdGte, createdLte),
    fetchStripeChargesCached("collections", createdGte, createdLte),
  ])

  const newCompanies = newCompaniesResult.data || []
  const allCompanies = allCompaniesResult.data || []
  const bookings = bookingsResult.data || []
  const sites = (sitesResult.data || []).map((s) => ({ value: s.id, label: s.name })).sort((a, b) => a.label.localeCompare(b.label))

  // KPIs
  const newCompaniesCount = newCompanies.length
  // All companies are considered "Direct" (Spacebring = Direct)

  // Signups by site chart data
  const dateGrouping = getDateGrouping(period)
  const siteNameMap = new Map<string, string>()
  ;(sitesResult.data || []).forEach((s) => siteNameMap.set(s.id, s.name))

  // Collect all site names used by new companies
  const siteNamesInSignups = new Set<string>()
  newCompanies.forEach((c) => {
    if (c.main_site_id) {
      const name = siteNameMap.get(c.main_site_id)
      if (name) siteNamesInSignups.add(name)
    }
  })
  const signupSiteNames = Array.from(siteNamesInSignups).sort()

  // Group by date and site
  const signupsBySiteMap = new Map<string, Map<string, number>>()
  for (const c of newCompanies) {
    const d = new Date(c.created_at)
    let key: string
    switch (dateGrouping) {
      case "hour": key = `${d.getHours()}h`; break
      case "day": key = format(d, "dd/MM", { locale: fr }); break
      case "week": key = format(startOfWeek(d, { weekStartsOn: 1 }), "dd/MM", { locale: fr }); break
      case "month": key = format(d, "MMM yy", { locale: fr }); break
    }
    const siteName = c.main_site_id ? (siteNameMap.get(c.main_site_id) || "Autre") : "Autre"
    const existing = signupsBySiteMap.get(key) || new Map<string, number>()
    existing.set(siteName, (existing.get(siteName) || 0) + 1)
    signupsBySiteMap.set(key, existing)
  }

  const signupsBySite = Array.from(signupsBySiteMap.entries()).map(([label, siteCounts]) => {
    const entry: Record<string, string | number> = { label }
    for (const name of signupSiteNames) {
      entry[name] = siteCounts.get(name) || 0
    }
    if (!signupSiteNames.includes("Autre") && siteCounts.has("Autre")) {
      entry["Autre"] = siteCounts.get("Autre") || 0
    }
    return entry
  })

  // Segmentation pie
  const segmentation = {
    selfEmployed: allCompanies.filter((c) => c.company_type === "self_employed" && !c.meeting_room_only).length,
    multiEmployee: allCompanies.filter((c) => c.company_type === "multi_employee" && !c.meeting_room_only).length,
    meetingRoomOnly: allCompanies.filter((c) => c.meeting_room_only).length,
  }

  // Stripe revenue by company
  const allCharges = [...coworkingCharges, ...collectionsCharges]
  const stripeCustomerToCompanyId = new Map<string, string>()
  allCompanies.forEach((c) => {
    if (c.customer_id_stripe) stripeCustomerToCompanyId.set(c.customer_id_stripe, c.id)
  })

  const revenueByCompany = new Map<string, number>()
  for (const charge of allCharges) {
    if (charge.status !== "succeeded" || !charge.customer) continue
    const companyId = stripeCustomerToCompanyId.get(charge.customer)
    if (companyId) {
      revenueByCompany.set(companyId, (revenueByCompany.get(companyId) || 0) + charge.amount / 100)
    }
  }

  // Booking counts by company
  const bookingCountByCompany = new Map<string, number>()
  for (const b of bookings) {
    if (b.status !== "confirmed") continue
    const user = b.user as { company_id: string | null } | null
    if (user?.company_id) {
      bookingCountByCompany.set(user.company_id, (bookingCountByCompany.get(user.company_id) || 0) + 1)
    }
  }

  // Source logic for bookings
  type BookingSource = "Direct" | "M&E"
  function getBookingSource(booking: { referral: string | null; user: unknown }): BookingSource {
    if (booking.referral === "M&E") return "M&E"
    return "Direct"
  }

  // Map bookings for table
  const bookingsTable = bookings.map((b) => {
    const user = b.user as { id: string; first_name: string | null; last_name: string | null; email: string | null; company_id: string | null; company: { id: string; name: string; from_spacebring: boolean | null } | null } | null
    const resource = b.resource as { id: string; type: string; site_id: string; site: { id: string; name: string } } | null
    return {
      id: b.id,
      date: b.start_date,
      clientName: user ? `${user.first_name || ""} ${user.last_name || ""}`.trim() || "—" : "—",
      clientEmail: user?.email || null,
      companyName: user?.company?.name || "—",
      siteName: resource?.site?.name || "—",
      siteId: resource?.site_id || "",
      resourceType: resource?.type || "—",
      source: getBookingSource(b) as string,
      status: b.status as string,
      seatsCount: b.seats_count || 1,
    }
  })

  // Map companies for table
  const companiesTable = allCompanies.map((c) => ({
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
    companyType: c.company_type || "—",
    source: "Direct" as string,
    meetingRoomOnly: c.meeting_room_only || false,
    bookingsCount: bookingCountByCompany.get(c.id) || 0,
    revenue: revenueByCompany.get(c.id) || 0,
    utmSource: c.utm_source || null,
    utmMedium: c.utm_medium || null,
    utmCampaign: c.utm_campaign || null,
  }))

  // Fetch Google Analytics metrics for all available accounts
  const gaStartDate = format(periodStart, "yyyy-MM-dd")
  const gaEndDate = format(periodEnd, "yyyy-MM-dd")
  const gaAccounts = getAvailableGaAccounts()
  const gaResults = await Promise.all(
    gaAccounts.map(async (acc) => ({
      key: acc.key,
      label: acc.label,
      metrics: await fetchGaMetrics(gaStartDate, gaEndDate, acc.key),
    }))
  )
  const gaData = gaResults as { key: string; label: string; metrics: NonNullable<typeof gaResults[0]["metrics"]> | null }[]

  return (
    <MarketingTab
      kpis={{
        newCompaniesCount,
        newCompanies: newCompanies
          .map((c) => ({ name: c.name, createdAt: c.created_at, utmSource: c.utm_source || null }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
      }}
      signupsBySite={signupsBySite}
      signupSiteNames={signupSiteNames}
      segmentation={segmentation}
      bookings={bookingsTable}
      companies={companiesTable}
      sites={sites}
      period={period}
      periodMode={periodMode}
      periodStartDate={format(periodStart, "d MMM yyyy", { locale: fr })}
      periodEndDate={format(periodEnd, "d MMM yyyy", { locale: fr })}
      gaData={gaData}
    />
  )
}

async function loadReportsData(now: Date) {
  const supabase = await createClient()
  const twelveMonthsAgo = subMonths(now, 12)
  const createdGte = Math.floor(twelveMonthsAgo.getTime() / 1000)
  const createdLte = Math.floor(now.getTime() / 1000)

  const [
    usersResult,
    companiesResult,
    bookingsResult,
    sitesResult,
    coworkingCharges,
    collectionsCharges,
  ] = await Promise.all([
    // 1. All users with company + site
    supabase.from("users").select(`id, first_name, last_name, email, phone, role, status,
      created_at, cgu_accepted_at,
      company:companies!left(id, name, company_type, from_spacebring, meeting_room_only),
      site:sites!left(id, name)`),
    // 2. All companies with main site
    supabase.from("companies").select(`id, name, company_type, from_spacebring, onboarding_done,
      meeting_room_only, created_at, customer_id_stripe, main_site_id,
      spacebring_plan_name, spacebring_monthly_price, spacebring_monthly_credits, spacebring_seats,
      site:sites!left(id, name)`),
    // 3. Bookings last 12 months
    supabase.from("bookings").select(`id, user_id, start_date, status, seats_count,
      user:users!left(company_id),
      resource:resources!inner(type)`)
      .gte("start_date", twelveMonthsAgo.toISOString())
      .lte("start_date", now.toISOString()),
    // 4. Sites for filters
    supabase.from("sites").select("id, name").eq("status", "open"),
    // 5. Stripe charges 12 months
    fetchStripeChargesCached("coworking", createdGte, createdLte),
    fetchStripeChargesCached("collections", createdGte, createdLte),
  ])

  const allUsers = usersResult.data || []
  const allCompanies = companiesResult.data || []
  const allBookings = bookingsResult.data || []
  const sites = (sitesResult.data || []).map((s) => ({ value: s.id, label: s.name })).sort((a, b) => a.label.localeCompare(b.label))
  const allCharges = [...coworkingCharges, ...collectionsCharges]

  // Revenue by company via Stripe customer mapping
  const stripeCustomerToCompanyId = new Map<string, string>()
  allCompanies.forEach((c) => {
    if (c.customer_id_stripe) stripeCustomerToCompanyId.set(c.customer_id_stripe, c.id)
  })

  const revenueByCompany = new Map<string, number>()
  for (const charge of allCharges) {
    if (charge.status !== "succeeded" || !charge.customer) continue
    const companyId = stripeCustomerToCompanyId.get(charge.customer)
    if (companyId) {
      revenueByCompany.set(companyId, (revenueByCompany.get(companyId) || 0) + charge.amount / 100)
    }
  }

  // Booking counts by company
  const bookingCountByCompany = new Map<string, number>()
  for (const b of allBookings) {
    if (b.status !== "confirmed") continue
    const user = b.user as { company_id: string | null } | null
    if (user?.company_id) {
      bookingCountByCompany.set(user.company_id, (bookingCountByCompany.get(user.company_id) || 0) + 1)
    }
  }

  // Map users for table
  const usersTable = allUsers.map((u) => {
    const company = u.company as { id: string; name: string; company_type: string | null; from_spacebring: boolean | null; meeting_room_only: boolean | null } | null
    const site = u.site as { id: string; name: string } | null
    return {
      id: u.id,
      firstName: u.first_name || "",
      lastName: u.last_name || "",
      email: u.email || "",
      phone: u.phone || "",
      role: u.role || "user",
      status: u.status || "active",
      companyName: company?.name || "—",
      companyType: company?.company_type || "—",
      siteName: site?.name || "—",
      siteId: site?.id || "",
      createdAt: u.created_at || "",
      hasCgu: !!u.cgu_accepted_at,
    }
  })

  // Map companies for table
  const companiesTable = allCompanies.map((c) => {
    const site = c.site as { id: string; name: string } | null
    return {
      id: c.id,
      name: c.name || "—",
      companyType: c.company_type || "—",
      source: "Direct",
      meetingRoomOnly: c.meeting_room_only || false,
      onboardingDone: c.onboarding_done || false,
      siteName: site?.name || "—",
      siteId: site?.id || "",
      planName: c.spacebring_plan_name || "—",
      monthlyPrice: c.spacebring_monthly_price || null,
      monthlyCredits: c.spacebring_monthly_credits || null,
      seats: c.spacebring_seats || null,
      bookingsCount: bookingCountByCompany.get(c.id) || 0,
      revenue: revenueByCompany.get(c.id) || 0,
      createdAt: c.created_at || "",
    }
  })

  // Monthly recap (12 months)
  const bookingsByMonth = new Map<string, { confirmed: number; cancelled: number; meetingRoom: number; flexDesk: number }>()
  for (const b of allBookings) {
    const monthKey = format(new Date(b.start_date), "yyyy-MM")
    const entry = bookingsByMonth.get(monthKey) || { confirmed: 0, cancelled: 0, meetingRoom: 0, flexDesk: 0 }
    if (b.status === "confirmed") {
      entry.confirmed++
      const resourceType = (b.resource as { type: string } | null)?.type
      if (resourceType === "meeting_room") entry.meetingRoom++
      else if (resourceType === "flex_desk" || resourceType === "bench") entry.flexDesk++
    } else if (b.status === "cancelled") {
      entry.cancelled++
    }
    bookingsByMonth.set(monthKey, entry)
  }

  const newCompaniesByMonth = new Map<string, number>()
  for (const c of allCompanies) {
    if (!c.created_at) continue
    const monthKey = format(new Date(c.created_at), "yyyy-MM")
    if (monthKey >= format(twelveMonthsAgo, "yyyy-MM")) {
      newCompaniesByMonth.set(monthKey, (newCompaniesByMonth.get(monthKey) || 0) + 1)
    }
  }

  const revenueByMonth = new Map<string, number>()
  for (const charge of allCharges) {
    if (charge.status !== "succeeded") continue
    const monthKey = format(new Date(charge.created * 1000), "yyyy-MM")
    revenueByMonth.set(monthKey, (revenueByMonth.get(monthKey) || 0) + charge.amount / 100)
  }

  const monthlyRecap = []
  for (let i = 0; i < 12; i++) {
    const d = subMonths(now, i)
    const monthKey = format(d, "yyyy-MM")
    const monthLabel = format(d, "MMMM yyyy", { locale: fr })
    const bData = bookingsByMonth.get(monthKey) || { confirmed: 0, cancelled: 0, meetingRoom: 0, flexDesk: 0 }
    const total = bData.confirmed + bData.cancelled
    monthlyRecap.push({
      month: monthLabel,
      monthKey,
      newCompanies: newCompaniesByMonth.get(monthKey) || 0,
      confirmedBookings: bData.confirmed,
      cancelledBookings: bData.cancelled,
      cancellationRate: total > 0 ? Math.round((bData.cancelled / total) * 100) : 0,
      meetingRoomBookings: bData.meetingRoom,
      flexDeskBookings: bData.flexDesk,
      revenue: revenueByMonth.get(monthKey) || 0,
    })
  }

  return (
    <ReportsTab
      users={usersTable}
      companies={companiesTable}
      monthlyRecap={monthlyRecap}
      sites={sites}
    />
  )
}
