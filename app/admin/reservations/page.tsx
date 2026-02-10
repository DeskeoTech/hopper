import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ReservationsFilters } from "@/components/admin/reservations/reservations-filters"
import { ReservationsCalendar } from "@/components/admin/reservations/reservations-calendar"
import { ReservationsHeader } from "@/components/admin/reservations/reservations-header"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  parseISO,
} from "date-fns"
import type { BookingWithDetails, ResourceType } from "@/lib/types/database"

type ViewMode = "week" | "month" | "list"

interface ReservationsPageProps {
  searchParams: Promise<{
    view?: string
    date?: string
    startDate?: string
    endDate?: string
    site?: string
    company?: string
    status?: string
    type?: string
    user?: string
    search?: string
  }>
}

export default async function ReservationsPage({
  searchParams,
}: ReservationsPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  // Determine view and reference date
  const view = (params.view || "week") as ViewMode
  const referenceDate = params.date ? parseISO(params.date) : new Date()

  // Calculate date range based on view
  let startDate: Date
  let endDate: Date

  if (view === "list") {
    // List view uses explicit startDate/endDate params, defaults to current week
    if (params.startDate && params.endDate) {
      startDate = parseISO(params.startDate)
      endDate = parseISO(params.endDate)
    } else {
      startDate = startOfWeek(new Date(), { weekStartsOn: 1 })
      endDate = endOfWeek(new Date(), { weekStartsOn: 1 })
    }
  } else if (view === "week") {
    startDate = startOfWeek(referenceDate, { weekStartsOn: 1 })
    endDate = endOfWeek(referenceDate, { weekStartsOn: 1 })
  } else if (view === "month") {
    startDate = startOfMonth(referenceDate)
    endDate = endOfMonth(referenceDate)
  } else {
    startDate = referenceDate
    endDate = addDays(referenceDate, 30)
  }

  // Build bookings query with joins - only meeting rooms
  let query = supabase
    .from("bookings")
    .select(
      `
      *,
      resources!inner (
        id,
        name,
        type,
        site_id,
        sites!left (id, name)
      ),
      users!left (
        id,
        first_name,
        last_name,
        email,
        company_id,
        companies!left (id, name)
      )
    `
    )
    .eq("resources.type", "meeting_room")
    .gte("start_date", startDate.toISOString())
    .lte("start_date", endDate.toISOString())
    .order("start_date")
    .neq("status", "cancelled")

  // Apply filters
  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  const { data: bookings, error: bookingsError } = await query

  // Fetch filter options
  const [sitesResult, openSitesResult, companiesResult, usersResult] = await Promise.all([
    supabase.from("sites").select("id, name").order("name"),
    supabase.from("sites").select("id, name").eq("status", "open").order("name"),
    supabase.from("companies").select("id, name").order("name"),
    supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .order("last_name"),
  ])

  const sites = sitesResult.data || []
  const openSites = openSitesResult.data || []
  const companies = companiesResult.data || []
  const users = usersResult.data || []

  // Transform bookings to flat structure with details
  let transformedBookings: BookingWithDetails[] =
    bookings?.map((b) => {
      const resource = b.resources as {
        id: string
        name: string
        type: ResourceType
        site_id: string
        sites: { id: string; name: string } | null
      } | null
      const user = b.users as {
        id: string
        first_name: string | null
        last_name: string | null
        email: string | null
        company_id: string | null
        companies: { id: string; name: string | null } | null
      } | null

      return {
        id: b.id,
        airtable_id: b.airtable_id,
        user_id: b.user_id,
        resource_id: b.resource_id,
        start_date: b.start_date,
        end_date: b.end_date,
        status: b.status,
        seats_count: b.seats_count,
        credits_used: b.credits_used,
        notes: b.notes,
        hubspot_deal_id: b.hubspot_deal_id,
        netsuite_invoice_id: b.netsuite_invoice_id,
        created_at: b.created_at,
        updated_at: b.updated_at,
        resource_name: resource?.name || null,
        resource_type: resource?.type || null,
        site_id: resource?.site_id || null,
        site_name: resource?.sites?.name || null,
        user_first_name: user?.first_name || null,
        user_last_name: user?.last_name || null,
        user_email: user?.email || null,
        company_id: user?.company_id || null,
        company_name: user?.companies?.name || null,
      }
    }) || []

  // Apply client-side filters that require joined data
  if (params.site && params.site !== "all") {
    const selectedSites = params.site.split(",").filter(Boolean)
    if (selectedSites.length > 0) {
      transformedBookings = transformedBookings.filter(
        (b) => b.site_id && selectedSites.includes(b.site_id)
      )
    }
  }
  if (params.company && params.company !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.company_id === params.company
    )
  }
  if (params.type && params.type !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.resource_type === params.type
    )
  }
  if (params.user && params.user !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.user_id === params.user
    )
  }
  if (params.search) {
    const searchLower = params.search.toLowerCase()
    transformedBookings = transformedBookings.filter(
      (b) =>
        b.user_first_name?.toLowerCase().includes(searchLower) ||
        b.user_last_name?.toLowerCase().includes(searchLower) ||
        b.user_email?.toLowerCase().includes(searchLower) ||
        b.resource_name?.toLowerCase().includes(searchLower)
    )
  }

  if (bookingsError) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">
          Erreur lors du chargement des reservations: {bookingsError.message}
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Header */}
      <ReservationsHeader sites={openSites} users={users} />

      {/* Filters */}
      <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-muted" />}>
        <ReservationsFilters
          sites={sites}
          companies={companies}
          users={users}
          hiddenFilters={["type"]}
        />
      </Suspense>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {transformedBookings.length} reservation
        {transformedBookings.length !== 1 ? "s" : ""} trouvee
        {transformedBookings.length !== 1 ? "s" : ""}
      </p>

      {/* Calendar */}
      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <ReservationsCalendar
          bookings={transformedBookings}
          view={view}
          referenceDate={referenceDate.toISOString()}
        />
      </Suspense>
    </div>
  )
}
