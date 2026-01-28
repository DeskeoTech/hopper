import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { ClientLayoutProvider } from "@/components/client/client-layout-provider"
import { ClientSidebar } from "@/components/client/client-sidebar"
import { ClientHeader } from "@/components/client/client-header"
import { ClientBottomTabs } from "@/components/client/client-bottom-tabs"
import { CompleteProfileModal } from "@/components/client/complete-profile-modal"
import { OnboardingModal } from "@/components/client/onboarding-modal"
import { isUserCompanyInfoComplete } from "@/lib/validations/user-company-info"
import type { UserCredits, UserPlan, Company, CreditMovement, CreditMovementType } from "@/lib/types/database"

interface ClientLayoutProps {
  children: React.ReactNode
  params?: Promise<Record<string, never>>
  searchParams?: Promise<{ site?: string }>
}

export default async function ClientLayout({
  children,
  searchParams,
}: ClientLayoutProps) {
  const authUser = await getUser()

  if (!authUser?.email) {
    redirect("/login")
  }

  const supabase = await createClient()
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const siteParam = resolvedSearchParams.site

  // Fetch user profile with full company data
  const { data: userProfile } = await supabase
    .from("users")
    .select(
      `
      *,
      companies (*)
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
  let creditMovements: CreditMovement[] = []

  if (userProfile.company_id) {
    // Fetch valid credits using the SQL function
    // Credits are valid if:
    // - extras_credit = true: permanent credits (always valid)
    // - extras_credit = false/null: valid for 1 month from created_at
    const { data: creditsResult } = await supabase
      .rpc("get_company_valid_credits", { p_company_id: userProfile.company_id })

    const validCredits = creditsResult ?? 0

    if (validCredits > 0) {
      userCredits = {
        allocated: validCredits,
        remaining: validCredits,
        period: today,
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

    // Fetch credit movements from user's bookings
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        id,
        start_date,
        status,
        credits_used,
        notes,
        resource:resources(name)
      `)
      .eq("user_id", userProfile.id)
      .not("credits_used", "is", null)
      .order("start_date", { ascending: false })
      .limit(50)

    // Transform bookings to credit movements
    const totalCredits = userCredits?.remaining ?? 0
    let runningBalance = totalCredits
    creditMovements = (bookings || []).map((booking) => {
      const isCancelled = booking.status === "cancelled"
      const creditsUsed = booking.credits_used || 0

      let type: CreditMovementType = "reservation"
      let amount = -creditsUsed

      if (isCancelled) {
        type = "cancellation"
        amount = creditsUsed // Credits restored
      }

      const resourceName = (booking.resource as { name: string } | null)?.name || "Ressource"
      const description = isCancelled
        ? `Annulation - ${resourceName}`
        : `Réservation - ${resourceName}`

      const movement: CreditMovement = {
        id: booking.id,
        date: booking.start_date,
        type,
        amount,
        description,
        balance_after: runningBalance,
      }

      // Adjust running balance for display (reverse chronological)
      runningBalance = runningBalance - amount

      return movement
    })
  }

  // Determine main site ID early (needed for site filtering)
  const mainSiteId = userProfile.companies?.main_site_id || null

  // Fetch sites: nomad sites + main site only
  const sitesQuery = supabase
    .from("sites")
    .select(`
      id, name, address, is_nomad,
      opening_hours, opening_days,
      wifi_ssid, wifi_password,
      equipments, instructions, access
    `)
    .eq("status", "open")

  // Filter: nomad sites OR main site
  if (mainSiteId) {
    sitesQuery.or(`is_nomad.eq.true,id.eq.${mainSiteId}`)
  } else {
    sitesQuery.eq("is_nomad", true)
  }

  const { data: sites } = await sitesQuery.order("name")

  // Fetch site photos for site switcher modal
  const { data: sitePhotos } = await supabase
    .from("site_photos")
    .select("site_id, storage_path")
    .order("created_at", { ascending: true })

  // Fetch resource capacities for site switcher modal
  const { data: resources } = await supabase
    .from("resources")
    .select("site_id, capacity")

  // Build site photos map (all photos per site)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const sitePhotosMap: Record<string, string[]> = {}
  sitePhotos?.forEach((photo) => {
    const url = `${supabaseUrl}/storage/v1/object/public/site-photos/${photo.storage_path}`
    if (!sitePhotosMap[photo.site_id]) {
      sitePhotosMap[photo.site_id] = [url]
    } else {
      sitePhotosMap[photo.site_id].push(url)
    }
  })

  // Build site capacity map (min/max from resources)
  const siteCapacityMap: Record<string, { min: number; max: number }> = {}
  resources?.forEach((resource) => {
    if (resource.capacity) {
      const existing = siteCapacityMap[resource.site_id]
      if (!existing) {
        siteCapacityMap[resource.site_id] = {
          min: resource.capacity,
          max: resource.capacity,
        }
      } else {
        siteCapacityMap[resource.site_id] = {
          min: Math.min(existing.min, resource.capacity),
          max: Math.max(existing.max, resource.capacity),
        }
      }
    }
  })

  // Build sitesWithDetails for the site switcher modal
  const sitesWithDetails = (sites || []).map((site) => ({
    id: site.id,
    name: site.name,
    address: site.address || "",
    imageUrl: sitePhotosMap[site.id]?.[0] || null,
    photoUrls: sitePhotosMap[site.id] || [],
    capacityRange: siteCapacityMap[site.id] || null,
    openingHours: site.opening_hours,
    openingDays: site.opening_days,
    wifiSsid: site.wifi_ssid,
    wifiPassword: site.wifi_password,
    equipments: site.equipments,
    instructions: site.instructions,
    access: site.access,
  }))

  const isAdmin = userProfile.role === "admin" || userProfile.role === "deskeo"
  const isDeskeoEmployee =
    authUser.email.endsWith("@deskeo.fr") || authUser.email.endsWith("@deskeo.com")

  // Determine selected site: URL param > main_site_id > first site
  const selectedSiteId = siteParam || mainSiteId || sites?.[0]?.id || null

  // Check if user needs onboarding (no company or onboarding not done)
  // Applies to both "user" and "admin" roles (but not "deskeo" employees)
  const needsOnboarding =
    (userProfile.role === "user" || userProfile.role === "admin") &&
    !isDeskeoEmployee &&
    (!userProfile.company_id ||
      !(userProfile.companies as Company | null)?.onboarding_done)

  // Check if user needs to complete their profile (only for 'user' or 'admin' role with a company, after onboarding)
  const needsProfileCompletion =
    !needsOnboarding &&
    (userProfile.role === "user" || userProfile.role === "admin") &&
    !isDeskeoEmployee &&
    userProfile.company_id &&
    userProfile.companies &&
    !isUserCompanyInfoComplete(userProfile, userProfile.companies as Company)

  return (
    <ClientLayoutProvider
      user={userProfile}
      credits={userCredits}
      creditMovements={creditMovements}
      plan={userPlan}
      sites={sites || []}
      sitesWithDetails={sitesWithDetails}
      selectedSiteId={selectedSiteId}
      isAdmin={isAdmin}
      isDeskeoEmployee={isDeskeoEmployee}
    >
      {needsOnboarding && (
        <OnboardingModal
          userId={userProfile.id}
          existingCompany={userProfile.companies as Company | null}
        />
      )}
      {needsProfileCompletion && (
        <CompleteProfileModal
          user={userProfile}
          company={userProfile.companies as Company}
        />
      )}
      <div className="min-h-screen bg-background">
        <ClientSidebar />
        <div className="flex min-h-screen flex-col md:ml-64">
          <ClientHeader />
          <main className="flex-1 pb-20 md:pb-0">{children}</main>
          <ClientBottomTabs />
        </div>
      </div>
    </ClientLayoutProvider>
  )
}
