import { createClient, getAdminProfile } from "@/lib/supabase/server"
import { getNewsPosts } from "@/lib/actions/news"
import { getCompanyPaymentStatuses, getSubscriptionStatuses, type CompanyPaymentStatus, type StripeSubscriptionStatus } from "@/lib/actions/stripe"
import { ActiveClientsTable } from "@/components/admin/accueil/active-clients-table"
import { SiteSwitcher } from "@/components/admin/accueil/site-switcher"
import { AccueilDatePicker } from "@/components/admin/accueil/date-picker"
import { KpiSection } from "@/components/admin/accueil/kpi-section"
import { MeetingRoomBookings } from "@/components/admin/accueil/meeting-room-bookings"
import { NewsFeedSection } from "@/components/admin/accueil/news-feed-section"
import { CreateNewsPostForm } from "@/components/admin/accueil/create-news-post-form"
import { startOfDay, endOfDay, format, isToday as isTodayFn } from "date-fns"
import { fr } from "date-fns/locale"

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

  const now = new Date(selectedDate + "T12:00:00")
  const todayStart = startOfDay(now).toISOString()
  const todayEnd = endOfDay(now).toISOString()

  // Récupération des données en parallèle
  const [
    activeClientsResult,
    subscriptionClientsResult,
    offPlatformClientsResult,
    allSitesResult,
    newsPosts,
    todayBookingsResult,
  ] = await Promise.all([
    // Clients avec un forfait actif à la date sélectionnée
    supabase
      .from("users")
      .select(`
        id, first_name, last_name, company_id,
        companies!inner(name, main_site_id, customer_id_stripe, sites(id, name)),
        contracts!inner(id, status, start_date, end_date, Subscription_ID, plans(name))
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

    // Réservations du jour avec info ressource + détails pour salles de réunion
    supabase
      .from("bookings")
      .select(`
        id, resource_id, seats_count, start_date, end_date, notes,
        resource:resources!inner(id, name, type, site_id),
        user:users(first_name, last_name, company_id, companies(name))
      `)
      .eq("status", "confirmed")
      .gte("start_date", todayStart)
      .lte("start_date", todayEnd),
  ])

  // Transformer les clients actifs (contrats + spacebring, dédupliqués)
  type CompanyData = { name: string | null; main_site_id: string | null; customer_id_stripe: string | null; sites: { id: string; name: string } | null }
  type ContractData = { id: string; status: string; start_date: string; end_date: string | null; Subscription_ID: string | null; plans: { name: string } | null }

  const seenUserIds = new Set<string>()
  // Map companyId -> subscription ID (first active contract with subscription)
  const companySubscriptionMap = new Map<string, string>()
  // Map companyId -> plan name (first contract's plan)
  const companyPlanMap = new Map<string, string>()
  const activeClients: { id: string; firstName: string | null; lastName: string | null; companyId: string | null; companyName: string | null; customerIdStripe: string | null; siteId: string | null; siteName: string | null; planName: string | null }[] = []

  for (const u of activeClientsResult.data || []) {
    if (seenUserIds.has(u.id)) continue
    seenUserIds.add(u.id)
    const company = u.companies as unknown as CompanyData | null
    // Extract subscription ID and plan name from contract
    const contracts = u.contracts as unknown as ContractData | ContractData[] | null
    const contractArr = Array.isArray(contracts) ? contracts : contracts ? [contracts] : []
    const subId = contractArr.find((c) => c.Subscription_ID)?.Subscription_ID
    if (subId && u.company_id && !companySubscriptionMap.has(u.company_id)) {
      companySubscriptionMap.set(u.company_id, subId)
    }
    const planName = contractArr.find((c) => c.plans?.name)?.plans?.name || null
    if (planName && u.company_id && !companyPlanMap.has(u.company_id)) {
      companyPlanMap.set(u.company_id, planName)
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
      planName,
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
      planName: u.company_id ? companyPlanMap.get(u.company_id) || null : null,
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
      planName: u.company_id ? companyPlanMap.get(u.company_id) || null : null,
    })
  }

  activeClients.sort((a, b) => (a.lastName || "").localeCompare(b.lastName || "", "fr"))

  const allSites = (allSitesResult.data || []).map((s) => ({
    id: s.id,
    name: s.name,
  }))

  // Filtrer les clients selon le site sélectionné (exclure Deskeo des stats)
  const filteredClients = (selectedSiteId === "all"
    ? activeClients
    : activeClients.filter((c) => c.siteId === selectedSiteId)
  ).filter((c) => !c.companyName?.toLowerCase().includes("deskeo"))

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

  // Compute KPIs
  const todayBookings = todayBookingsResult.data || []

  type ResourceInfo = { id: string; name: string; type: string; site_id: string }
  type UserInfo = { first_name: string | null; last_name: string | null; company_id: string | null; companies: { name: string | null } | null }

  const siteTodayBookings = selectedSiteId === "all"
    ? todayBookings
    : todayBookings.filter(b => {
      const resource = b.resource as unknown as ResourceInfo | null
      return resource?.site_id === selectedSiteId
    })

  // Meeting room bookings today (detailed)
  const meetingRoomBookings = siteTodayBookings
    .filter(b => {
      const resource = b.resource as unknown as ResourceInfo | null
      return resource?.type === "meeting_room"
    })
    .map(b => {
      const resource = b.resource as unknown as ResourceInfo
      const user = b.user as unknown as UserInfo | null
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      const durationHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10
      return {
        id: b.id,
        roomName: resource.name,
        startDate: b.start_date,
        endDate: b.end_date,
        startTime: format(start, "HH:mm"),
        endTime: format(end, "HH:mm"),
        durationHours,
        companyName: user?.companies?.name || null,
        userName: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
        notes: b.notes,
      }
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate))

  const meetingRoomBookingsToday = meetingRoomBookings.length

  // Site name for display
  const currentSiteName = selectedSiteId === "all"
    ? null
    : allSites.find(s => s.id === selectedSiteId)?.name || null

  const welcomeSiteName = currentSiteName || adminProfile?.sites?.name || "HOPPER Coworking"

  const isToday = isTodayFn(now)
  const dateLabel = isToday
    ? "aujourd'hui"
    : format(now, "EEEE d MMMM", { locale: fr })

  return (
    <div className="mx-auto max-w-[1325px] space-y-8 px-2 lg:px-3">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <AccueilDatePicker currentDate={selectedDate} />
        <SiteSwitcher sites={allSites} currentSiteId={selectedSiteId} />
      </div>

      {/* KPI Cards + Content */}
      <KpiSection
        clientsCount={filteredClients.length}
        meetingRoomCount={meetingRoomBookingsToday}
        dateLabel={dateLabel}
        clientsContent={
          <ActiveClientsTable
            clients={filteredClients}
            selectedDate={selectedDate}
            dateLabel={dateLabel}
            paymentStatuses={paymentStatuses}
            subscriptionStatuses={companySubStatuses}
            siteName={currentSiteName || welcomeSiteName}
          />
        }
        meetingRoomsContent={
          <MeetingRoomBookings
            bookings={meetingRoomBookings}
            dateLabel={dateLabel}
            siteName={currentSiteName || welcomeSiteName}
          />
        }
      />

      {/* Fil d'actualité */}
      <section className="space-y-4">
        <h2 className="type-h3 text-foreground">Fil d&apos;actualité</h2>
        <CreateNewsPostForm sites={allSites} defaultSiteId={adminProfile?.site_id || null} />
        <NewsFeedSection posts={newsPosts} sites={allSites} />
      </section>
    </div>
  )
}
