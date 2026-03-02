import { createClient, getAdminProfile } from "@/lib/supabase/server"
import { getNewsPosts } from "@/lib/actions/news"
import { getCompanyPaymentStatuses, getSubscriptionStatuses, type CompanyPaymentStatus, type StripeSubscriptionStatus } from "@/lib/actions/stripe"
import { ActiveClientsTable } from "@/components/admin/accueil/active-clients-table"
import { SiteSwitcher } from "@/components/admin/accueil/site-switcher"

import { NewsFeedSection } from "@/components/admin/accueil/news-feed-section"
import { CreateNewsPostForm } from "@/components/admin/accueil/create-news-post-form"
import { QuickAccessSection } from "@/components/admin/accueil/quick-access-section"

interface AccueilPageProps {
  searchParams: Promise<{ date?: string; site?: string }>
}

export default async function AccueilPage({ searchParams }: AccueilPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const selectedDate = params.date || today
  const adminProfile = await getAdminProfile()
  const selectedSiteId = params.site || adminProfile?.site_id || "all"

  // Récupération des données en parallèle
  const [
    activeClientsResult,
    subscriptionClientsResult,
    offPlatformClientsResult,
    allSitesResult,
    newsPosts,
  ] = await Promise.all([
    // Clients avec un forfait actif à la date sélectionnée
    supabase
      .from("users")
      .select(`
        id, first_name, last_name, company_id,
        companies!inner(name, main_site_id, customer_id_stripe, sites(id, name)),
        contracts!inner(id, status, start_date, end_date, Subscription_ID)
      `)
      .eq("contracts.status", "active")
      .lte("contracts.start_date", selectedDate)
      .or(`end_date.is.null,end_date.gte.${selectedDate}`, { referencedTable: "contracts" })
      .order("last_name", { ascending: true }),

    // Clients avec abonnement actif (plateforme via subscription_start_date)
    supabase
      .from("users")
      .select(`
        id, first_name, last_name, company_id,
        companies!inner(name, main_site_id, customer_id_stripe, subscription_start_date, subscription_end_date, sites(id, name))
      `)
      .not("companies.subscription_start_date", "is", null)
      .lte("companies.subscription_start_date", selectedDate)
      .or(`subscription_end_date.is.null,subscription_end_date.gte.${selectedDate}`, { referencedTable: "companies" })
      .order("last_name", { ascending: true }),

    // Clients hors plateforme actifs (from_spacebring avec spacebring_start_date)
    supabase
      .from("users")
      .select(`
        id, first_name, last_name, company_id,
        companies!inner(name, main_site_id, customer_id_stripe, from_spacebring, spacebring_start_date, sites(id, name))
      `)
      .eq("companies.from_spacebring", true)
      .not("companies.spacebring_start_date", "is", null)
      .lte("companies.spacebring_start_date", selectedDate)
      .order("last_name", { ascending: true }),

    // Tous les sites (pour le sélecteur)
    supabase.from("sites").select("id, name").order("name"),

    // Derniers posts d'actualité (filtrés par site)
    getNewsPosts({
      limit: 20,
      ...(selectedSiteId !== "all" ? { siteId: selectedSiteId } : {}),
    }),
  ])

  // Transformer les clients actifs (contrats + spacebring, dédupliqués)
  type CompanyData = { name: string | null; main_site_id: string | null; customer_id_stripe: string | null; sites: { id: string; name: string } | null }
  type ContractData = { id: string; status: string; start_date: string; end_date: string | null; Subscription_ID: string | null }

  const seenUserIds = new Set<string>()
  // Map companyId -> subscription ID (first active contract with subscription)
  const companySubscriptionMap = new Map<string, string>()
  const activeClients: { id: string; firstName: string | null; lastName: string | null; companyId: string | null; companyName: string | null; customerIdStripe: string | null; siteId: string | null; siteName: string | null }[] = []

  for (const u of activeClientsResult.data || []) {
    if (seenUserIds.has(u.id)) continue
    seenUserIds.add(u.id)
    const company = u.companies as unknown as CompanyData | null
    // Extract subscription ID from contract
    const contracts = u.contracts as unknown as ContractData | ContractData[] | null
    const contractArr = Array.isArray(contracts) ? contracts : contracts ? [contracts] : []
    const subId = contractArr.find((c) => c.Subscription_ID)?.Subscription_ID
    if (subId && u.company_id && !companySubscriptionMap.has(u.company_id)) {
      companySubscriptionMap.set(u.company_id, subId)
    }
    activeClients.push({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      companyId: u.company_id,
      companyName: company?.name || null,
      customerIdStripe: company?.customer_id_stripe || null,
      siteId: company?.sites?.id || null,
      siteName: company?.sites?.name || null,
    })
  }

  for (const u of subscriptionClientsResult.data || []) {
    if (seenUserIds.has(u.id)) continue
    seenUserIds.add(u.id)
    const company = u.companies as unknown as CompanyData | null
    activeClients.push({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      companyId: u.company_id,
      companyName: company?.name || null,
      customerIdStripe: company?.customer_id_stripe || null,
      siteId: company?.sites?.id || null,
      siteName: company?.sites?.name || null,
    })
  }

  for (const u of offPlatformClientsResult.data || []) {
    if (seenUserIds.has(u.id)) continue
    seenUserIds.add(u.id)
    const company = u.companies as unknown as CompanyData | null
    activeClients.push({
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      companyId: u.company_id,
      companyName: company?.name || null,
      customerIdStripe: company?.customer_id_stripe || null,
      siteId: company?.sites?.id || null,
      siteName: company?.sites?.name || null,
    })
  }

  activeClients.sort((a, b) => (a.lastName || "").localeCompare(b.lastName || "", "fr"))

  const allSites = (allSitesResult.data || []).map((s) => ({
    id: s.id,
    name: s.name,
  }))

  // Filtrer les clients selon le site sélectionné
  const filteredClients = selectedSiteId === "all"
    ? activeClients
    : activeClients.filter((c) => c.siteId === selectedSiteId)

  // Fetch payment statuses and subscription statuses in parallel
  const uniqueStripeIds = [...new Set(
    filteredClients
      .filter((c) => c.customerIdStripe)
      .map((c) => c.customerIdStripe!)
  )]
  const uniqueSubIds = [...new Set(companySubscriptionMap.values())]

  const [paymentResult, subResult] = await Promise.all([
    uniqueStripeIds.length > 0
      ? getCompanyPaymentStatuses(uniqueStripeIds)
      : null,
    uniqueSubIds.length > 0
      ? getSubscriptionStatuses(uniqueSubIds)
      : null,
  ])

  const paymentStatuses: Record<string, CompanyPaymentStatus> =
    paymentResult && "statuses" in paymentResult ? paymentResult.statuses : {}
  const subscriptionStatuses: Record<string, StripeSubscriptionStatus> =
    subResult && "statuses" in subResult ? subResult.statuses : {}

  // Build companyId -> subscription status mapping
  const companySubStatuses: Record<string, StripeSubscriptionStatus> = {}
  for (const [companyId, subId] of companySubscriptionMap) {
    if (subscriptionStatuses[subId]) {
      companySubStatuses[companyId] = subscriptionStatuses[subId]
    }
  }

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Site Switcher */}
      <div className="flex justify-end">
        <SiteSwitcher sites={allSites} currentSiteId={selectedSiteId} />
      </div>

      {/* Tableau des clients avec forfait actif */}
      <ActiveClientsTable clients={filteredClients} selectedDate={selectedDate} paymentStatuses={paymentStatuses} subscriptionStatuses={companySubStatuses} />

      {/* Accès rapide (collapsible) */}
      <QuickAccessSection />

      {/* Fil d'actualité */}
      <section className="space-y-4">
        <h2 className="type-h3 text-foreground">Fil d&apos;actualité</h2>
        <CreateNewsPostForm sites={allSites} defaultSiteId={adminProfile?.site_id || null} />
        <NewsFeedSection posts={newsPosts} sites={allSites} />
      </section>
    </div>
  )
}
