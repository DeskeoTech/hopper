import { createClient, getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountPage } from "@/components/client/account-page"
import { getNewsPosts } from "@/lib/actions/news"
import type { BookingWithDetails, ContractForDisplay, ResourceType, PlanRecurrence, FloorLevel } from "@/lib/types/database"

export default async function ComptePage() {
  const authUser = await getUser()

  if (!authUser?.email) {
    redirect("/login?error=not_connected")
  }

  const supabase = await createClient()

  // Fetch user profile (required before other queries)
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, company_id, role, contract_id, companies (main_site_id, from_spacebring, spacebring_plan_name, spacebring_seats, spacebring_start_date)")
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    redirect("/login")
  }

  const isAdmin = userProfile.role === "admin"
  const company = userProfile.companies as { main_site_id: string | null; from_spacebring: boolean | null; spacebring_plan_name: string | null; spacebring_seats: number | null; spacebring_start_date: string | null } | null
  const mainSiteId = company?.main_site_id || null

  // Build contracts query (conditional on role)
  const contractsQueryBuilder = userProfile.company_id
    ? (() => {
        let query = supabase
          .from("contracts")
          .select(`id, status, start_date, end_date, Number_of_seats, plans (name, recurrence)`)
          .eq("company_id", userProfile.company_id!)
        if (!isAdmin && userProfile.contract_id) {
          query = query.eq("id", userProfile.contract_id)
        }
        return query.order("start_date", { ascending: false }).limit(50)
      })()
    : Promise.resolve({ data: null } as { data: null })

  // Run bookings, contracts, news, and unread notifications in parallel
  const [bookingsResult, contractsResult, posts, unreadNotifsResult] = await Promise.all([
    // Only fetch upcoming/ongoing bookings (server-side filter instead of client-side)
    supabase
      .from("bookings")
      .select(`
        *,
        resources!left (
          id, name, type, capacity, floor, site_id,
          sites!left (id, name)
        )
      `)
      .eq("user_id", userProfile.id)
      .not("resource_id", "is", null)
      .gte("end_date", new Date().toISOString())
      .order("start_date", { ascending: true })
      .limit(20),

    contractsQueryBuilder,

    getNewsPosts({ mainSiteId }),

    supabase
      .from("client_notifications")
      .select("id, source_id, user_id")
      .eq("user_id", userProfile.id),
  ])

  // Process contracts
  let contracts: ContractForDisplay[] = ((contractsResult.data as Array<Record<string, unknown>>) || []).map((c) => {
    const plan = c.plans as unknown as { name: string; recurrence: PlanRecurrence | null } | null
    return {
      id: c.id as string,
      status: c.status as "active" | "suspended" | "terminated",
      start_date: c.start_date as string | null,
      end_date: c.end_date as string | null,
      plan_name: plan?.name || "Pass",
      plan_recurrence: plan?.recurrence || null,
      site_name: null,
      number_of_seats: c.Number_of_seats ? Number(c.Number_of_seats) : null,
    }
  })

  // Spacebring fallback
  if (contracts.length === 0 && company?.from_spacebring && company.spacebring_plan_name) {
    contracts = [{
      id: "spacebring",
      status: "active",
      start_date: company.spacebring_start_date,
      end_date: null,
      plan_name: company.spacebring_plan_name,
      plan_recurrence: null,
      site_name: null,
      number_of_seats: company.spacebring_seats,
    }]
  }

  // Transform bookings to flat structure
  const transformedBookings: BookingWithDetails[] =
    (bookingsResult.data || []).map((b) => {
      const resource = b.resources as {
        id: string
        name: string
        type: ResourceType
        capacity: number | null
        floor: FloorLevel | null
        site_id: string
        sites: { id: string; name: string } | null
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
        stripe_checkout_session_id: b.stripe_checkout_session_id,
        referral: b.referral,
        created_at: b.created_at,
        updated_at: b.updated_at,
        resource_name: resource?.name || null,
        resource_type: resource?.type || null,
        resource_capacity: resource?.capacity || null,
        resource_floor: resource?.floor || null,
        site_id: resource?.site_id || null,
        site_name: resource?.sites?.name || null,
        user_first_name: null,
        user_last_name: null,
        user_email: null,
        company_id: null,
        company_name: null,
      }
    })

  return (
    <AccountPage
      bookings={transformedBookings}
      contracts={contracts}
      posts={posts}
      isAdmin={isAdmin}
      unreadNotifications={unreadNotifsResult.data ?? []}
    />
  )
}
