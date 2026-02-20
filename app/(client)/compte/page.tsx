import { createClient, getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AccountPage } from "@/components/client/account-page"
import { getNewsPosts } from "@/lib/actions/news"
import type { BookingWithDetails, ContractForDisplay, ResourceType, PlanRecurrence, FloorLevel } from "@/lib/types/database"

export default async function ComptePage() {
  const authUser = await getUser()

  if (!authUser?.email) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch user profile with company_id, role, contract_id, and company Spacebring fields
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, company_id, role, contract_id, companies (main_site_id, from_spacebring, spacebring_plan_name, spacebring_seats, spacebring_start_date)")
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    redirect("/login")
  }

  // Determine if user is admin
  const isAdmin = userProfile.role === "admin"

  // Fetch user's bookings with resource and site details
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      *,
      resources!left (
        id,
        name,
        type,
        capacity,
        floor,
        site_id,
        sites!left (id, name)
      )
    `
    )
    .eq("user_id", userProfile.id)
    .not("resource_id", "is", null)
    .order("start_date", { ascending: false })
    .limit(50)

  // Fetch contracts based on user role
  // Admin: all company contracts
  // User: only their assigned contract
  let contracts: ContractForDisplay[] = []
  if (userProfile.company_id) {
    let query = supabase
      .from("contracts")
      .select(`
        id,
        status,
        start_date,
        end_date,
        Number_of_seats,
        plans (name, recurrence)
      `)
      .eq("company_id", userProfile.company_id)

    // Regular user: filter by their assigned contract
    if (!isAdmin && userProfile.contract_id) {
      query = query.eq("id", userProfile.contract_id)
    }

    const { data: contractsData } = await query
      .order("start_date", { ascending: false })
      .limit(50)

    contracts = (contractsData || []).map((c) => {
      const plan = c.plans as unknown as { name: string; recurrence: PlanRecurrence | null } | null
      return {
        id: c.id,
        status: c.status as "active" | "suspended" | "terminated",
        start_date: c.start_date,
        end_date: c.end_date,
        plan_name: plan?.name || "Pass",
        plan_recurrence: plan?.recurrence || null,
        site_name: null,
        number_of_seats: c.Number_of_seats ? Number(c.Number_of_seats) : null,
      }
    })
    // If user has no contract_id, contracts remains empty
  }

  // For Spacebring companies with no contracts, create a synthetic contract from Spacebring subscription
  const company = userProfile.companies as { main_site_id: string | null; from_spacebring: boolean | null; spacebring_plan_name: string | null; spacebring_seats: number | null; spacebring_start_date: string | null } | null
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

  // Fetch news posts for the user's main site
  const mainSiteId = company?.main_site_id || null
  const posts = await getNewsPosts({ mainSiteId })

  // Transform bookings to flat structure with details
  const transformedBookings: BookingWithDetails[] =
    bookings?.map((b) => {
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
    }) || []

  return (
    <AccountPage
      bookings={transformedBookings}
      contracts={contracts}
      posts={posts}
      isAdmin={isAdmin}
    />
  )
}
