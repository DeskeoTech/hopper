import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { ClientLayoutProvider } from "@/components/client/client-layout-provider"
import { ClientSidebar } from "@/components/client/client-sidebar"
import { ClientMobileNav } from "@/components/client/client-mobile-nav"
import { CompleteProfileModal } from "@/components/client/complete-profile-modal"
import { isUserCompanyInfoComplete } from "@/lib/validations/user-company-info"
import type { UserCredits, UserPlan, Company } from "@/lib/types/database"

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

  const isAdmin = userProfile.role === "admin" || userProfile.role === "deskeo"

  // Determine selected site: URL param > main_site_id > first site
  const mainSiteId = userProfile.companies?.main_site_id || null
  const selectedSiteId = siteParam || mainSiteId || sites?.[0]?.id || null

  // Check if user needs to complete their profile (only for 'user' role with a company)
  const needsProfileCompletion =
    userProfile.role === "user" &&
    userProfile.company_id &&
    userProfile.companies &&
    !isUserCompanyInfoComplete(userProfile, userProfile.companies as Company)

  return (
    <ClientLayoutProvider
      user={userProfile}
      credits={userCredits}
      plan={userPlan}
      sites={sites || []}
      selectedSiteId={selectedSiteId}
      isAdmin={isAdmin}
    >
      {needsProfileCompletion && (
        <CompleteProfileModal
          user={userProfile}
          company={userProfile.companies as Company}
        />
      )}
      <div className="flex min-h-screen bg-background">
        <ClientSidebar />
        <div className="flex flex-1 flex-col">
          <div className="flex h-14 items-center px-4 md:hidden">
            <ClientMobileNav />
          </div>
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ClientLayoutProvider>
  )
}
