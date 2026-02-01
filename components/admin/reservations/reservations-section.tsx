import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { ReservationsSectionClient } from "./reservations-section-client"
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfDay,
  endOfDay,
  addDays,
  parseISO,
} from "date-fns"
import type { BookingWithDetails, ResourceType, MeetingRoomResource } from "@/lib/types/database"
import type { HiddenFilter } from "./reservations-filters"
import type { ViewMode } from "./view-toggle"
import { Calendar } from "lucide-react"

export type ReservationContext =
  | { type: "site"; siteId: string; siteName: string }
  | { type: "company"; companyId: string; companyName: string }

interface ReservationsSectionProps {
  context: ReservationContext
  searchParams: Record<string, string | undefined>
  paramPrefix?: string
  showHeader?: boolean
}

export async function ReservationsSection({
  context,
  searchParams,
  paramPrefix = "res_",
  showHeader = true,
}: ReservationsSectionProps) {
  const supabase = await createClient()

  // Helper to get prefixed param
  const getParam = (key: string) => searchParams[`${paramPrefix}${key}`]

  // Determine view and reference date
  const view = (getParam("view") || "week") as ViewMode
  const referenceDate = getParam("date") ? parseISO(getParam("date")!) : new Date()

  // Calculate date range based on view
  let startDate: Date
  let endDate: Date

  if (view === "list") {
    // List view uses explicit startDate/endDate params, defaults to current week
    const startDateParam = getParam("startDate")
    const endDateParam = getParam("endDate")
    if (startDateParam && endDateParam) {
      startDate = parseISO(startDateParam)
      endDate = parseISO(endDateParam)
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
  } else if (view === "rooms") {
    // Rooms view shows a single day
    startDate = startOfDay(referenceDate)
    endDate = endOfDay(referenceDate)
  } else {
    startDate = referenceDate
    endDate = addDays(referenceDate, 30)
  }

  // Build bookings query with joins
  const { data: bookings, error: bookingsError } = await supabase
    .from("bookings")
    .select(
      `
      *,
      resources!left (
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
    .gte("start_date", startDate.toISOString())
    .lte("start_date", endDate.toISOString())
    .order("start_date")

  // Fetch filter options
  const [sitesResult, companiesResult, usersResult] = await Promise.all([
    supabase.from("sites").select("id, name").order("name"),
    supabase.from("companies").select("id, name").order("name"),
    supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .order("last_name"),
  ])

  const sites = sitesResult.data || []
  const companies = companiesResult.data || []
  const users = usersResult.data || []

  // Fetch meeting rooms for site context (for rooms view)
  let meetingRooms: MeetingRoomResource[] = []
  if (context.type === "site") {
    const { data: rooms } = await supabase
      .from("resources")
      .select("id, name, capacity, floor, hourly_credit_rate, equipments, status")
      .eq("site_id", context.siteId)
      .eq("type", "meeting_room")
      .eq("status", "available")
      .order("name")

    if (rooms && rooms.length > 0) {
      // Fetch photos for all rooms
      const roomIds = rooms.map((r) => r.id)
      const { data: photos } = await supabase
        .from("resource_photos")
        .select("resource_id, storage_path")
        .in("resource_id", roomIds)
        .order("created_at", { ascending: true })

      // Build photo URLs map
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const photosByRoom: Record<string, string[]> = {}
      photos?.forEach((photo) => {
        const url = `${supabaseUrl}/storage/v1/object/public/resource-photos/${photo.storage_path}`
        if (!photosByRoom[photo.resource_id]) {
          photosByRoom[photo.resource_id] = [url]
        } else {
          photosByRoom[photo.resource_id].push(url)
        }
      })

      // Add photos to rooms
      meetingRooms = rooms.map((room) => ({
        ...room,
        photoUrls: photosByRoom[room.id] || [],
      })) as MeetingRoomResource[]
    }
  }

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

  // Apply context-based pre-filter
  if (context.type === "site") {
    transformedBookings = transformedBookings.filter(
      (b) => b.site_id === context.siteId
    )
  } else if (context.type === "company") {
    transformedBookings = transformedBookings.filter(
      (b) => b.company_id === context.companyId
    )
  }

  // Apply additional client-side filters from URL params
  const statusParam = getParam("status")
  if (statusParam && statusParam !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.status === statusParam
    )
  }

  const typeParam = getParam("type")
  if (typeParam && typeParam !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.resource_type === typeParam
    )
  }

  const userParam = getParam("user")
  if (userParam && userParam !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.user_id === userParam
    )
  }

  // Site filter only applies if not already pre-filtered by site context
  const siteParam = getParam("site")
  if (context.type !== "site" && siteParam && siteParam !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.site_id === siteParam
    )
  }

  // Company filter only applies if not already pre-filtered by company context
  const companyParam = getParam("company")
  if (context.type !== "company" && companyParam && companyParam !== "all") {
    transformedBookings = transformedBookings.filter(
      (b) => b.company_id === companyParam
    )
  }

  const searchParam = getParam("search")
  if (searchParam) {
    const searchLower = searchParam.toLowerCase()
    transformedBookings = transformedBookings.filter(
      (b) =>
        b.user_first_name?.toLowerCase().includes(searchLower) ||
        b.user_last_name?.toLowerCase().includes(searchLower) ||
        b.user_email?.toLowerCase().includes(searchLower) ||
        b.resource_name?.toLowerCase().includes(searchLower)
    )
  }

  // Determine which filters to hide based on context
  const hiddenFilters: HiddenFilter[] = []
  if (context.type === "site") {
    hiddenFilters.push("site")
  } else if (context.type === "company") {
    hiddenFilters.push("company")
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
    <div className="rounded-lg bg-card p-6">
      {showHeader && (
        <div className="mb-6">
          <h2 className="flex items-center gap-2 type-h3 text-foreground">
            <Calendar className="h-5 w-5" />
            Reservations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {transformedBookings.length} reservation
            {transformedBookings.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-muted" />}>
        <ReservationsSectionClient
          bookings={transformedBookings}
          sites={sites}
          companies={companies}
          users={users}
          view={view}
          referenceDate={referenceDate.toISOString()}
          hiddenFilters={hiddenFilters}
          paramPrefix={paramPrefix}
          meetingRooms={meetingRooms}
          showRoomsView={context.type === "site"}
        />
      </Suspense>
    </div>
  )
}
