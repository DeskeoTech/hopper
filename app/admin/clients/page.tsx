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
  const { search, status, period, site } = await searchParams
  const supabase = await createClient()
  const authUser = await getUser()
  const isTechAdmin = authUser?.email === "tech@deskeo.fr"

  // Build query for companies with main site
  let query = supabase.from("companies").select("*, main_site:sites!main_site_id(id, name)").order("name")

  // Apply search filter (name only)
  if (search) {
    query = query.ilike("name", `%${search}%`)
  }

  // Apply period filter
  if (period && period !== "all") {
    query = query.eq("subscription_period", period)
  }

  // Apply site filter
  if (site && site !== "all") {
    query = query.eq("main_site_id", site)
  }

  const { data: companies, error } = await query

  // Fetch user counts per company
  const { data: userCounts } = await supabase
    .from("users")
    .select("company_id")

  // Fetch all sites for the filter
  const { data: sites } = await supabase.from("sites").select("id, name").order("name")

  // Build user count map
  const userCountMap: Record<string, number> = {}
  userCounts?.forEach((user) => {
    if (user.company_id) {
      userCountMap[user.company_id] = (userCountMap[user.company_id] || 0) + 1
    }
  })

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des clients: {error.message}</p>
      </div>
    )
  }

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
            <Briefcase className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="type-h2 text-foreground">Clients</h1>
            <p className="mt-1 text-muted-foreground">Gérez vos entreprises clientes et leurs abonnements</p>
          </div>
        </div>
        <CreateCompanyModal />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
        <ClientsFilters sites={sites || []} />
      </Suspense>

      {/* Companies Table */}
      {transformedCompanies && transformedCompanies.length > 0 ? (
        <CompaniesTable companies={transformedCompanies} isTechAdmin={isTechAdmin} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {search || status || period || site ? "Aucun client ne correspond à vos critères" : "Aucun client trouvé"}
          </p>
        </div>
      )}
    </div>
  )
}
