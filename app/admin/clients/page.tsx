import { Suspense } from "react"
import { createClient, getUser } from "@/lib/supabase/server"
import { CompaniesTable } from "@/components/admin/companies-table"
import { ClientsFilters } from "@/components/admin/company-search"
import { CreateCompanyModal } from "@/components/admin/company-edit/create-company-modal"
import { getSubscriptionStatus } from "@/components/admin/abonnements/subscription-status-badge"
import { Briefcase } from "lucide-react"

interface ClientsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    period?: string
    site?: string
  }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { search, status: statusParam, period, site } = await searchParams
  // Par défaut, afficher uniquement les clients actifs
  const status = statusParam ?? "actif"
  const supabase = await createClient()
  const authUser = await getUser()
  const isTechAdmin = authUser?.email === "tech@deskeo.fr"

  // Build query for companies with main site
  let query = supabase.from("companies").select("*, main_site:sites!main_site_id(id, name)").order("name")

  // Search: also match users by first_name, last_name or email
  let matchingCompanyIds: string[] = []
  if (search) {
    // Sanitize search input: strip PostgREST reserved characters to prevent filter injection
    const sanitizedSearch = search.replace(/[,().]/g, "")

    const { data: matchingUsers } = await supabase
      .from("users")
      .select("company_id")
      .not("company_id", "is", null)
      .or(`first_name.ilike.%${sanitizedSearch}%,last_name.ilike.%${sanitizedSearch}%,email.ilike.%${sanitizedSearch}%`)

    matchingCompanyIds = [...new Set(
      (matchingUsers || []).map((u) => u.company_id).filter(Boolean)
    )] as string[]
  }

  // Apply search filter (company name OR matching user's company)
  if (search) {
    const sanitizedSearch = search.replace(/[,().]/g, "")
    if (matchingCompanyIds.length > 0) {
      query = query.or(`name.ilike.%${sanitizedSearch}%,id.in.(${matchingCompanyIds.join(",")})`)
    } else {
      query = query.ilike("name", `%${sanitizedSearch}%`)
    }
  }

  // Apply period filter
  if (period && period !== "all") {
    query = query.eq("subscription_period", period)
  }

  // Apply site filter
  if (site && site !== "all") {
    query = query.eq("main_site_id", site)
  }

  // Fetch companies, user counts, and sites in parallel
  const [companiesResult, userCountsResult, sitesResult] = await Promise.all([
    query,
    supabase.from("users").select("company_id").not("company_id", "is", null),
    supabase.from("sites").select("id, name").order("name"),
  ])

  const { data: companies, error } = companiesResult
  const { data: userCounts } = userCountsResult
  const { data: sites } = sitesResult

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des clients: {error.message}</p>
      </div>
    )
  }

  // Build user count map
  const userCountMap: Record<string, number> = {}
  userCounts?.forEach((user) => {
    userCountMap[user.company_id] = (userCountMap[user.company_id] || 0) + 1
  })

  // Transform companies with subscription status and apply status filter client-side
  let transformedCompanies = (companies || []).map((company) => ({
    ...company,
    userCount: userCountMap[company.id] || 0,
    mainSiteName: company.main_site?.name || null,
    subscriptionStatus: getSubscriptionStatus(company.subscription_end_date),
  }))

  // Apply status filter
  if (status && status !== "all") {
    transformedCompanies = transformedCompanies.filter((c) => c.subscriptionStatus === status)
  }

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-h2 text-foreground">Clients</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {transformedCompanies.length} entreprise{transformedCompanies.length !== 1 ? "s" : ""}
          </p>
        </div>
        <CreateCompanyModal sites={sites || []} />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
        <ClientsFilters sites={sites || []} />
      </Suspense>

      {/* Companies Table */}
      {transformedCompanies && transformedCompanies.length > 0 ? (
        <CompaniesTable companies={transformedCompanies} isTechAdmin={isTechAdmin} />
      ) : (
        <div className="rounded-[20px] bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            {search || status || period || site ? "Aucun client ne correspond à vos critères" : "Aucun client trouvé"}
          </p>
        </div>
      )}
    </div>
  )
}
