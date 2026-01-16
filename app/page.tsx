import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { ClientHomePage } from "@/components/client/client-home-page"
import type { BookingWithDetails, ResourceType, UserCredits, UserPlan } from "@/lib/types/database"

export default async function HomePage() {
  const authUser = await getUser()

  if (!authUser?.email) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch user profile with company (including main_site_id)
  const { data: userProfile } = await supabase
    .from("users")
    .select(
      `
      *,
      companies (id, name, main_site_id)
    `
    )
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    redirect("/login")
  }

  // Fetch user's credits and plan (via company -> contract -> credits/plan)
  const today = new Date().toISOString().split("T")[0]
  let userCredits: UserCredits | null = null
  let userPlan: UserPlan | null = null

  if (userProfile.company_id) {
    // Fetch credits
    const { data: creditsData } = await supabase
      .from("credits")
      .select(
        `
        allocated_credits,
        remaining_credits,
        period,
        contracts!inner (company_id, status)
      `
      )
      .eq("contracts.company_id", userProfile.company_id)
      .eq("contracts.status", "active")
      .lte("period", today)
      .order("period", { ascending: false })
      .limit(1)
      .single()

    if (creditsData) {
      userCredits = {
        allocated: creditsData.allocated_credits,
        remaining: creditsData.remaining_credits,
        period: creditsData.period,
      }
    }

    // Fetch plan from active contract
    const { data: contractData } = await supabase
      .from("contracts")
      .select(
        `
        plans (name, price_per_seat_month, credits_per_month)
      `
      )
      .eq("company_id", userProfile.company_id)
      .eq("status", "active")
      .single()

    if (contractData?.plans) {
      // Supabase returns plans as an object (not array) for single foreign key relation
      const plan = contractData.plans as unknown as {
        name: string
        price_per_seat_month: number | null
        credits_per_month: number | null
      }
      userPlan = {
        name: plan.name,
        pricePerSeatMonth: plan.price_per_seat_month,
        creditsPerMonth: plan.credits_per_month,
      }
    }
  }

  // Fetch all open sites for booking
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name")
    .eq("status", "open")
    .order("name")

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
        site_id,
        sites!left (id, name)
      )
    `
    )
    .eq("user_id", userProfile.id)
    .order("start_date", { ascending: false })
    .limit(50)

  // Transform bookings to flat structure with details
  const transformedBookings: BookingWithDetails[] =
    bookings?.map((b) => {
      const resource = b.resources as {
        id: string
        name: string
        type: ResourceType
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
        site_id: resource?.site_id || null,
        site_name: resource?.sites?.name || null,
        user_first_name: userProfile.first_name,
        user_last_name: userProfile.last_name,
        user_email: userProfile.email,
        company_id: userProfile.company_id,
        company_name: userProfile.companies?.name || null,
      }
    }) || []

  const isAdmin =
    userProfile.role === "admin" || userProfile.role === "deskeo"

  return (
    <ClientHomePage
      user={userProfile}
      bookings={transformedBookings}
      isAdmin={isAdmin}
      credits={userCredits}
      plan={userPlan}
      sites={sites || []}
      mainSiteId={userProfile.companies?.main_site_id || null}
    />
  )
}
