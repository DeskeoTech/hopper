import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-h2 text-foreground">Clients</h1>
          <p className="mt-1 text-muted-foreground">Gérez vos entreprises clientes et leurs abonnements</p>
        </div>
        <CreateCompanyModal />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
        <ClientsFilters sites={sites || []} />
      </Suspense>

      {/* Results count */}
      {transformedCompanies && (
        <p className="text-sm text-muted-foreground">
          {transformedCompanies.length} client{transformedCompanies.length !== 1 ? "s" : ""} trouvé{transformedCompanies.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Companies Table */}
      {transformedCompanies && transformedCompanies.length > 0 ? (
        <CompaniesTable companies={transformedCompanies} />
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
