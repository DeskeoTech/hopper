import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ClientLayoutProvider } from "@/components/client/client-layout-provider"
import { ClientHeader } from "@/components/client/client-header"
import { ClientFooter } from "@/components/client/client-footer"
import { CompleteProfileModal } from "@/components/client/complete-profile-modal"
import { OnboardingModal } from "@/components/client/onboarding-modal"
import { ExpiredContractBanner } from "@/components/client/expired-contract-banner"
import { PwaInstallPrompt } from "@/components/client/pwa-install-prompt"
import { NoContractModal } from "@/components/client/no-contract-modal"
import { CguAcceptanceModal } from "@/components/client/cgu-acceptance-modal"
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
    redirect("/login?error=not_connected")
  }

  const supabase = await createClient()
  const resolvedSearchParams = searchParams ? await searchParams : {}
  const siteParam = resolvedSearchParams.site

  // Phase 1: Fetch user profile (required before all other queries)
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

  const today = new Date().toISOString().split("T")[0]
  const hasCompany = !!userProfile.company_id
  const companyData = userProfile.companies as Company | null
  const isMeetingRoomOnly = companyData?.meeting_room_only === true
  const companyMainSiteId = companyData?.main_site_id || null

  // Phase 2: Run ALL independent queries in parallel
  const siteColumns = `
    id, name, address, is_nomad, is_coworking, is_meeting_room,
    opening_hours, opening_days,
    wifi_ssid, wifi_password,
    equipments, description, description_en,
    instructions, instructions_en, access, access_en, transportation_lines
  `

  const [
    sitesResult,
    photosResult,
    resourcesResult,
    creditsResult,
    planResult,
    creditBookingsResult,
    adminResult,
  ] = await Promise.all([
    // 1. Sites: meeting_room_only companies only see their main site (even if closed)
    isMeetingRoomOnly && companyMainSiteId
      ? supabase
          .from("sites")
          .select(siteColumns)
          .eq("id", companyMainSiteId)
      : supabase
          .from("sites")
          .select(siteColumns)
          .eq("status", "open")
          .order("name"),

    // 2. Site photos
    supabase
      .from("site_photos")
      .select("site_id, storage_path")
      .order("created_at", { ascending: true }),

    // 3. Resources
    supabase
      .from("resources")
      .select("site_id, capacity, type"),

    // 4. Credits (company-dependent)
    hasCompany
      ? supabase.rpc("get_company_valid_credits", { p_company_id: userProfile.company_id! })
      : Promise.resolve({ data: null } as { data: number | null }),

    // 5. Plan from active contract (company-dependent)
    hasCompany
      ? supabase
          .from("contracts")
          .select(`plans (name, price_per_seat_month, credits_per_person_month)`)
          .eq("company_id", userProfile.company_id!)
          .eq("status", "active")
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null } as { data: null }),

    // 6. Credit movements (bookings with credits_used)
    hasCompany
      ? supabase
          .from("bookings")
          .select(`id, start_date, status, credits_used, resource:resources(name)`)
          .eq("user_id", userProfile.id)
          .not("credits_used", "is", null)
          .order("start_date", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: null } as { data: null }),

    // 7. Company admin (for non-admin users)
    hasCompany && userProfile.role === "user"
      ? supabase
          .from("users")
          .select("first_name, last_name, email")
          .eq("company_id", userProfile.company_id!)
          .eq("role", "admin")
          .limit(1)
          .single()
      : Promise.resolve({ data: null } as { data: null }),
  ])

  // Process credits
  let userCredits: UserCredits | null = null
  const validCredits = (creditsResult.data as number | null) ?? 0
  if (validCredits > 0) {
    userCredits = {
      allocated: validCredits,
      remaining: validCredits,
      period: today,
    }
  }

  // Process plan
  let userPlan: UserPlan | null = null
  if (planResult.data && (planResult.data as Record<string, unknown>).plans) {
    const plan = (planResult.data as Record<string, unknown>).plans as unknown as {
      name: string
      price_per_seat_month: number | null
      credits_per_person_month: number | null
    }
    userPlan = {
      name: plan.name,
      pricePerSeatMonth: plan.price_per_seat_month,
      creditsPerMonth: plan.credits_per_person_month,
    }
  }

  // Spacebring fallback for plan
  const company = userProfile.companies as Company | null
  if (!userPlan && company?.from_spacebring && company.spacebring_plan_name) {
    userPlan = {
      name: company.spacebring_plan_name,
      pricePerSeatMonth: company.spacebring_monthly_price,
      creditsPerMonth: company.spacebring_monthly_credits,
    }
  }

  // Process credit movements
  let creditMovements: CreditMovement[] = []
  if (creditBookingsResult.data) {
    const totalCredits = userCredits?.remaining ?? 0
    let runningBalance = totalCredits
    creditMovements = (creditBookingsResult.data as Array<Record<string, unknown>>).map((booking) => {
      const isCancelled = booking.status === "cancelled"
      const creditsUsed = (booking.credits_used as number) || 0

      let type: CreditMovementType = "reservation"
      let amount = -creditsUsed

      if (isCancelled) {
        type = "cancellation"
        amount = creditsUsed
      }

      const resourceName = (booking.resource as { name: string } | null)?.name || "Ressource"
      const description = isCancelled
        ? `Annulation - ${resourceName}`
        : `Réservation - ${resourceName}`

      const movement: CreditMovement = {
        id: booking.id as string,
        date: booking.start_date as string,
        type,
        amount,
        description,
        balance_after: runningBalance,
      }

      runningBalance = runningBalance - amount
      return movement
    })
  }

  // Process sites
  const allSites = sitesResult.data || []
  const sitePhotos = photosResult.data
  const resources = resourcesResult.data
  const mainSiteId = userProfile.companies?.main_site_id || null

  // Build site photos map
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

  // Build site capacity map and workstation count
  const siteCapacityMap: Record<string, { min: number; max: number }> = {}
  const siteWorkstationCount: Record<string, number> = {}
  const workstationTypes = ["bench", "flex_desk", "fixed_desk"]

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
    if (workstationTypes.includes(resource.type)) {
      siteWorkstationCount[resource.site_id] = (siteWorkstationCount[resource.site_id] || 0) + 1
    }
  })

  // Build sitesWithDetails
  const sitesWithDetails = allSites.map((site) => ({
    id: site.id,
    name: site.name,
    address: site.address || "",
    imageUrl: sitePhotosMap[site.id]?.[0] || null,
    photoUrls: sitePhotosMap[site.id] || [],
    capacityRange: siteCapacityMap[site.id] || null,
    totalWorkstations: siteWorkstationCount[site.id] || 0,
    openingHours: site.opening_hours,
    openingDays: site.opening_days,
    wifiSsid: site.wifi_ssid,
    wifiPassword: site.wifi_password,
    equipments: site.equipments,
    instructions: site.instructions,
    access: site.access,
    transportationLines: site.transportation_lines,
    isCoworking: site.is_coworking ?? true,
    isMeetingRoom: site.is_meeting_room ?? true,
  }))

  const isAdmin = userProfile.role === "admin"
  const isHopperAdmin = userProfile.is_hopper_admin === true

  const companyAdmin = adminResult.data as { first_name: string | null; last_name: string | null; email: string | null } | null

  // Determine selected site
  const selectedSiteId = siteParam || mainSiteId || allSites[0]?.id || null

  // Modal checks
  const isFromSpacebring = (userProfile.companies as Company | null)?.from_spacebring === true
  const needsCguAcceptance = !userProfile.cgu_accepted_at
  const needsOnboarding =
    (userProfile.role === "user" || userProfile.role === "admin") &&
    (!userProfile.company_id ||
      !(userProfile.companies as Company | null)?.onboarding_done) &&
    !isFromSpacebring &&
    !isMeetingRoomOnly
  const needsProfileCompletion =
    !needsOnboarding &&
    (userProfile.role === "user" || userProfile.role === "admin") &&
    userProfile.company_id &&
    userProfile.companies &&
    !isUserCompanyInfoComplete(userProfile, userProfile.companies as Company)
  const needsContractAssignment =
    !needsOnboarding &&
    !needsProfileCompletion &&
    userProfile.role === "user" &&
    userProfile.company_id &&
    !userProfile.contract_id &&
    !isFromSpacebring &&
    !isMeetingRoomOnly

  // Auto-update Onboarding flag for users whose company already completed onboarding
  if (
    !needsOnboarding &&
    userProfile.company_id &&
    (userProfile.companies as Company | null)?.onboarding_done &&
    !(userProfile as Record<string, unknown>).Onboarding
  ) {
    const adminSupabase = createAdminClient()
    adminSupabase
      .from("users")
      .update({ Onboarding: true, updated_at: new Date().toISOString() })
      .eq("id", userProfile.id)
      .then(({ error }) => {
        if (error) console.error("Error auto-updating user onboarding flag:", error)
      })
  }

  return (
    <ClientLayoutProvider
      user={userProfile}
      credits={userCredits}
      creditMovements={creditMovements}
      plan={userPlan}
      sites={allSites}
      allSites={allSites.map((s) => ({ id: s.id, name: s.name, is_coworking: s.is_coworking, is_meeting_room: s.is_meeting_room }))}
      sitesWithDetails={sitesWithDetails}
      selectedSiteId={selectedSiteId}
      isAdmin={isAdmin}
      isDeskeoEmployee={isHopperAdmin}
      companyAdmin={companyAdmin}
      isMeetingRoomOnly={isMeetingRoomOnly}
    >
      {needsOnboarding && (
        <OnboardingModal
          userId={userProfile.id}
          existingCompany={userProfile.companies as Company | null}
        />
      )}
      {!needsOnboarding && needsProfileCompletion && (
        <CompleteProfileModal
          user={userProfile}
          company={userProfile.companies as Company}
        />
      )}
      {!needsOnboarding && !needsProfileCompletion && needsCguAcceptance && (
        <CguAcceptanceModal />
      )}
      {!needsOnboarding && !needsProfileCompletion && !needsCguAcceptance && needsContractAssignment && (
        <NoContractModal open />
      )}
      <ExpiredContractBanner />
      <PwaInstallPrompt />
      <div className="client-layout min-h-screen bg-background overflow-x-hidden">
        <div className="flex min-h-screen flex-col overflow-x-hidden">
          <ClientHeader />
          <main className="flex-1 overflow-x-hidden">{children}</main>
          <ClientFooter />
        </div>
      </div>
    </ClientLayoutProvider>
  )
}
