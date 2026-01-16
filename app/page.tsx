import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { ClientHomePage } from "@/components/client/client-home-page"
import type { BookingWithDetails, ResourceType } from "@/lib/types/database"

export default async function HomePage() {
  const authUser = await getUser()

  if (!authUser?.email) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch user profile with company
  const { data: userProfile } = await supabase
    .from("users")
    .select(
      `
      *,
      companies (id, name)
    `
    )
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    redirect("/login")
  }

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
    />
  )
}
