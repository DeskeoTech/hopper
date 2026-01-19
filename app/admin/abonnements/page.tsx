import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { AbonnementsFilters } from "@/components/admin/abonnements/abonnements-filters"
import { AbonnementsTable, type SubscriptionRow } from "@/components/admin/abonnements/abonnements-table"
import { CreateSubscriptionModal } from "@/components/admin/abonnements/create-subscription-modal"
import { getSubscriptionStatus } from "@/components/admin/abonnements/subscription-status-badge"
import { CreditCard } from "lucide-react"

interface AbonnementsPageProps {
  searchParams: Promise<{
    search?: string
    status?: string
    period?: string
    site?: string
  }>
}

export default async function AbonnementsPage({ searchParams }: AbonnementsPageProps) {
  const { search, status, period, site } = await searchParams
  const supabase = await createClient()

  // Fetch all companies with their main site
  const { data: companies, error } = await supabase
    .from("companies")
    .select("*, main_site:sites!main_site_id(id, name)")
    .order("name")

  // Fetch all sites for the filter
  const { data: sites } = await supabase.from("sites").select("id, name").order("name")

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des abonnements: {error.message}</p>
      </div>
    )
  }

  // Transform companies into subscription rows with status
  let subscriptions: SubscriptionRow[] = (companies || [])
    .filter((company) => company.subscription_period !== null)
    .map((company) => ({
      id: company.id,
      name: company.name,
      contactEmail: company.contact_email,
      subscriptionPeriod: company.subscription_period,
      subscriptionStartDate: company.subscription_start_date,
      subscriptionEndDate: company.subscription_end_date,
      mainSiteName: company.main_site?.name || null,
      status: getSubscriptionStatus(company.subscription_end_date),
    }))

  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase()
    subscriptions = subscriptions.filter(
      (s) =>
        s.name?.toLowerCase().includes(searchLower) ||
        s.contactEmail?.toLowerCase().includes(searchLower)
    )
  }

  // Apply status filter
  if (status && status !== "all") {
    subscriptions = subscriptions.filter((s) => s.status === status)
  }

  // Apply period filter
  if (period && period !== "all") {
    subscriptions = subscriptions.filter((s) => s.subscriptionPeriod === period)
  }

  // Apply site filter
  if (site && site !== "all") {
    subscriptions = subscriptions.filter((s) => {
      const company = companies?.find((c) => c.id === s.id)
      return company?.main_site_id === site
    })
  }

  // Get companies without subscription for the create modal
  const companiesWithoutSubscription = (companies || [])
    .filter((c) => c.subscription_period === null)
    .map((c) => ({ id: c.id, name: c.name }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="type-h2 text-foreground">Abonnements</h1>
          <p className="mt-1 text-muted-foreground">
            Gerez les abonnements de vos entreprises clientes
          </p>
        </div>
        <CreateSubscriptionModal companiesWithoutSubscription={companiesWithoutSubscription} />
      </div>

      {/* Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
        <AbonnementsFilters sites={sites || []} />
      </Suspense>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {subscriptions.length} abonnement{subscriptions.length !== 1 ? "s" : ""} trouve
        {subscriptions.length !== 1 ? "s" : ""}
      </p>

      {/* Table or empty state */}
      {subscriptions.length > 0 ? (
        <AbonnementsTable subscriptions={subscriptions} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12">
          <CreditCard className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {search || status !== "all" || period !== "all" || site !== "all"
              ? "Aucun abonnement ne correspond a vos criteres"
              : "Aucun abonnement trouve"}
          </p>
        </div>
      )}
    </div>
  )
}
