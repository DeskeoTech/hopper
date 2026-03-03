import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient, getUser } from "@/lib/supabase/server"
import { ArrowLeft, Briefcase, Mail, Phone, MapPin, CreditCard, Building2, FileText, Users, Coins, ChevronRight, Clock } from "lucide-react"
import { EditHeaderModal } from "@/components/admin/company-edit/edit-header-modal"
import { EditMainSiteModal } from "@/components/admin/company-edit/edit-main-site-modal"
import { EditContactModal } from "@/components/admin/company-edit/edit-contact-modal"
import { StripeDashboardButton } from "@/components/admin/company-edit/stripe-actions"
import { getCompanyPaymentStatus, getSubscriptionStatuses, getCustomerPayments } from "@/lib/actions/stripe"
import type { StripeSubscriptionStatus } from "@/lib/actions/stripe"
import { CompanyPaymentStatusBadge } from "@/components/admin/companies/company-payment-status-badge"
import { DocumentsSection } from "@/components/admin/company-edit/documents-section"
import { UsersList } from "@/components/admin/company-edit/users-list"
import { ReservationsSection } from "@/components/admin/reservations/reservations-section"
import { DetailsTabs } from "@/components/admin/details-tabs"
import { CreditsSection } from "@/components/admin/company-credits/credits-section"
import { PassesSection } from "@/components/admin/company-passes/passes-section"
import { SpacebringSubscriptionCard } from "@/components/admin/company-edit/spacebring-subscription-card"
import { PaymentHistorySection } from "@/components/admin/company-payments/payment-history-section"
import { cn } from "@/lib/utils"
import type { CreditMovement, AdminPassForDisplay, ContractStatus, PlanRecurrence } from "@/lib/types/database"

interface CompanyDetailsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function CompanyDetailsPage({ params, searchParams }: CompanyDetailsPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const activeTab = resolvedSearchParams.tab || "info"
  const supabase = await createClient()
  const authUser = await getUser()
  const isTechAdmin = authUser?.email === "tech@deskeo.fr"

  // Phase 1: Fetch company, users, credits, transactions, passes, and sites in parallel
  // (all depend only on company id, not on each other)
  const [
    { data: company, error },
    { data: users },
    { data: creditsResult },
    { data: creditTransactions },
    { data: passesData },
    { data: allSites },
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("*, main_site:sites!main_site_id(id, name, address, status)")
      .eq("id", id)
      .single(),
    supabase
      .from("users")
      .select("*")
      .eq("company_id", id)
      .order("last_name")
      .order("first_name"),
    supabase.rpc("get_company_valid_credits", { p_company_id: id }),
    supabase
      .from("credit_transactions")
      .select(`
        id,
        transaction_type,
        amount,
        balance_after,
        reason,
        created_at,
        booking_id,
        booking:bookings(
          resource:resources(name)
        )
      `)
      .eq("company_id", id)
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("contracts")
      .select(`
        id,
        status,
        start_date,
        end_date,
        Number_of_seats,
        Subscription_ID,
        plans (name, recurrence, price_per_seat_month)
      `)
      .eq("company_id", id)
      .order("start_date", { ascending: false }),
    supabase
      .from("sites")
      .select("id, name")
      .order("name"),
  ])

  if (error || !company) {
    notFound()
  }

  const totalCredits = creditsResult ?? 0

  // Fetch company payment status and subscription statuses from Stripe
  const uniqueSubscriptionIds = [...new Set(
    (passesData || [])
      .map((c) => c.Subscription_ID as string | null)
      .filter((id): id is string => !!id)
  )]

  const [companyPaymentStatus, subscriptionStatusesResult, customerChargesResult] = await Promise.all([
    company.customer_id_stripe
      ? getCompanyPaymentStatus(company.customer_id_stripe)
      : null,
    uniqueSubscriptionIds.length > 0
      ? getSubscriptionStatuses(uniqueSubscriptionIds)
      : null,
    company.customer_id_stripe
      ? getCustomerPayments(company.customer_id_stripe)
      : null,
  ])

  const subscriptionStatuses: Record<string, StripeSubscriptionStatus> =
    subscriptionStatusesResult && "statuses" in subscriptionStatusesResult
      ? subscriptionStatusesResult.statuses
      : {}

  const customerPayments = customerChargesResult && "payments" in customerChargesResult
    ? customerChargesResult.payments
    : []

  // Phase 2: Fetch bookings (depends on user IDs)
  const userIds = users?.map((u) => u.id) || []
  const { data: bookings } = userIds.length > 0
    ? await supabase
        .from("bookings")
        .select(`
          id,
          start_date,
          status,
          credits_used,
          resource:resources(name)
        `)
        .in("user_id", userIds)
        .not("credits_used", "is", null)
        .gt("credits_used", 0)
        .order("start_date", { ascending: false })
        .limit(100)
    : { data: [] as never[] }

  // Transform passes for admin display
  const contractUserCounts: Record<string, number> = {}
  for (const user of users || []) {
    if (user.contract_id) {
      contractUserCounts[user.contract_id] = (contractUserCounts[user.contract_id] || 0) + 1
    }
  }

  const adminPasses: AdminPassForDisplay[] = (passesData || []).map((c) => {
    const plan = c.plans as unknown as { name: string; recurrence: PlanRecurrence | null; price_per_seat_month: number | null } | null
    return {
      id: c.id,
      status: c.status as ContractStatus,
      start_date: c.start_date,
      end_date: c.end_date,
      plan_name: plan?.name || "Pass",
      plan_recurrence: plan?.recurrence || null,
      price_per_seat_month: plan?.price_per_seat_month ?? null,
      number_of_seats: c.Number_of_seats ? Number(c.Number_of_seats) : null,
      assigned_users_count: contractUserCounts[c.id] || 0,
      subscription_id: (c.Subscription_ID as string | null) || null,
    }
  })

  // Get booking IDs that already have credit_transactions
  const bookingIdsWithTransactions = new Set(
    (creditTransactions || [])
      .filter((tx) => tx.booking_id)
      .map((tx) => tx.booking_id)
  )

  // Transform credit_transactions to CreditMovement format
  const transactionMovements: CreditMovement[] = (creditTransactions || []).map((tx) => {
    // Map transaction_type to CreditMovementType
    const typeMapping: Record<string, CreditMovement["type"]> = {
      consumption: "reservation",
      refund: "cancellation",
      allocation: "allocation",
      expiration: "expiration",
      adjustment: "adjustment",
    }
    const movementType = typeMapping[tx.transaction_type] || "adjustment"

    // Get resource name from booking if available
    const resourceName = (tx.booking as unknown as { resource: { name: string } | null } | null)?.resource?.name

    // Determine display amount (negative for consumption, positive for refund/allocation)
    let displayAmount: number
    if (tx.transaction_type === "consumption") {
      displayAmount = -Math.abs(tx.amount)
    } else if (tx.transaction_type === "refund" || tx.transaction_type === "allocation") {
      displayAmount = Math.abs(tx.amount)
    } else if (tx.transaction_type === "expiration") {
      displayAmount = -Math.abs(tx.amount)
    } else {
      // adjustment: keep the sign as-is from the database
      displayAmount = tx.amount
    }

    // Build description
    let description: string
    if (tx.reason) {
      description = tx.reason
    } else {
      switch (tx.transaction_type) {
        case "consumption":
          description = resourceName ? `Réservation - ${resourceName}` : "Consommation de crédits"
          break
        case "refund":
          description = resourceName ? `Annulation - ${resourceName}` : "Remboursement de crédits"
          break
        case "allocation":
          description = "Attribution de crédits"
          break
        case "expiration":
          description = "Expiration de crédits"
          break
        default:
          description = displayAmount > 0 ? "Ajout de crédits" : "Retrait de crédits"
      }
    }

    return {
      id: tx.id,
      date: tx.created_at,
      type: movementType,
      amount: displayAmount,
      description,
      balance_after: tx.balance_after,
    }
  })

  // Transform historical bookings (without credit_transactions) to CreditMovement format
  const bookingMovements: CreditMovement[] = (bookings || [])
    .filter((booking) => !bookingIdsWithTransactions.has(booking.id))
    .flatMap((booking) => {
      const creditsUsed = booking.credits_used || 0
      const resourceName = (booking.resource as unknown as { name: string } | null)?.name || "Ressource"
      const movements: CreditMovement[] = []

      // Add consumption movement for the booking
      movements.push({
        id: `booking-${booking.id}`,
        date: booking.start_date,
        type: "reservation" as const,
        amount: -creditsUsed,
        description: `Réservation - ${resourceName}`,
        balance_after: 0, // Historical data - balance unknown
      })

      // If cancelled, also add refund movement
      if (booking.status === "cancelled") {
        movements.push({
          id: `refund-${booking.id}`,
          date: booking.start_date, // Use same date as booking
          type: "cancellation" as const,
          amount: creditsUsed,
          description: `Annulation - ${resourceName}`,
          balance_after: 0, // Historical data - balance unknown
        })
      }

      return movements
    })

  // Merge and sort by date (most recent first)
  const allMovements = [...transactionMovements, ...bookingMovements].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Calculate running balance starting from current total credits
  // Work backwards through movements to compute balance_after for each
  let runningBalance = totalCredits
  const movements = allMovements.map((movement) => {
    const balanceAfter = runningBalance
    // For next (older) movement: balance_before = balance_after - amount
    runningBalance = runningBalance - movement.amount
    return {
      ...movement,
      balance_after: balanceAfter,
    }
  })

  // Determine subscription status
  const now = new Date()
  const endDate = company.subscription_end_date ? new Date(company.subscription_end_date) : null
  const isActive = !endDate || endDate > now
  const companyTypeLabel = company.company_type === "self_employed" ? "Indépendant" : "Multi-employés"

  // Computed stats for header
  const usersCount = users?.length ?? 0
  const activePassesCount = adminPasses.filter((p) => p.status === "active").length

  // Initials for avatar
  const initials = (company.name || "?")
    .split(/\s+/)
    .map((w: string) => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="mx-auto max-w-[1325px] space-y-8 px-2 lg:px-3">
      {/* Back Button */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux clients
      </Link>

      {/* Hero Profile Section */}
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-[16px] bg-card text-2xl font-bold text-foreground/60">
            {initials}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold uppercase tracking-tight text-foreground">{company.name || "Sans nom"}</h1>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase",
                  isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                )}
              >
                {isActive ? "Actif" : "Inactif"}
              </span>
              {company.from_spacebring && (
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                  Hors plateforme
                </span>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {company.company_type && (
                <span>{companyTypeLabel}</span>
              )}
              {company.registration_date && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  Inscrit le {new Date(company.registration_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <EditHeaderModal
            companyId={company.id}
            initialName={company.name}
            initialType={company.company_type}
            isActive={isActive}
          />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex items-center gap-4 rounded-[20px] bg-card p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Users className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Utilisateurs</p>
            <p className="text-2xl font-bold text-foreground">{usersCount}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[20px] bg-card p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-50">
            <Coins className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Crédits</p>
            <p className="text-2xl font-bold text-foreground">{totalCredits}</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-[20px] bg-card p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-purple-50">
            <FileText className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Passes actifs</p>
            <p className="text-2xl font-bold text-foreground">{activePassesCount}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <DetailsTabs
        defaultTab={activeTab}
        tabs={[
          {
            value: "info",
            label: "Informations générales",
            content: (
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Main Content - Left Column */}
                <div className="min-w-0 space-y-6 lg:col-span-2">
                  {/* Informations Générales Card */}
                  <div className="rounded-[20px] bg-card overflow-hidden">
                    <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                      <h3 className="font-bold text-foreground">Informations Générales</h3>
                      <div className="flex gap-2">
                        <EditContactModal
                          companyId={company.id}
                          initialAddress={company.address}
                          initialPhone={company.phone}
                          initialEmail={company.contact_email}
                        />
                        <EditMainSiteModal
                          companyId={company.id}
                          initialSiteId={company.main_site_id}
                          sites={allSites || []}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 gap-y-5 gap-x-10 p-6 md:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                        <p className="text-sm font-medium text-foreground">{company.contact_email || "—"}</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Téléphone</label>
                        <p className="text-sm font-medium text-foreground">{company.phone || "—"}</p>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Site Principal</label>
                        {company.main_site ? (
                          <Link
                            href={`/admin/sites/${company.main_site.id}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:underline"
                          >
                            <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                            {company.main_site.name}
                          </Link>
                        ) : (
                          <p className="text-sm text-muted-foreground">—</p>
                        )}
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-muted-foreground">Adresse</label>
                        <p className="text-sm font-medium text-foreground break-words">{company.address || "—"}</p>
                      </div>
                    </div>
                  </div>

                  {/* Users */}
                  <UsersList companyId={company.id} initialUsers={users || []} isTechAdmin={isTechAdmin} isDeskeoCompany={!!company.name?.toLowerCase().includes("deskeo")} />

                  {/* Credits */}
                  <CreditsSection
                    companyId={company.id}
                    companyName={company.name || undefined}
                    totalCredits={totalCredits}
                    movements={movements}
                  />
                </div>

                {/* Sidebar - Right Column */}
                <div className="space-y-6">
                  {/* Abonnement hors plateforme */}
                  <SpacebringSubscriptionCard
                    companyId={company.id}
                    isFromSpacebring={company.from_spacebring ?? false}
                    planName={company.spacebring_plan_name}
                    monthlyPrice={company.spacebring_monthly_price}
                    monthlyCredits={company.spacebring_monthly_credits}
                    seats={company.spacebring_seats}
                    startDate={company.spacebring_start_date}
                  />

                  {/* Documents */}
                  <DocumentsSection
                    companyId={company.id}
                    kbisStoragePath={company.kbis_storage_path}
                    identityDocumentStoragePath={company.identity_document_storage_path ?? null}
                    ribStoragePath={company.rib_storage_path ?? null}
                    companyType={company.company_type}
                  />

                  {/* Passes */}
                  <PassesSection
                    passes={adminPasses}
                    companyId={company.id}
                    stripeCustomerId={company.customer_id_stripe}
                    stripeCustomerEmail={company.contact_email}
                    companyName={company.name || undefined}
                    subscriptionStatuses={subscriptionStatuses}
                  />

                  {/* Stripe */}
                  {company.customer_id_stripe && !company.from_spacebring && (
                    <div className="rounded-[20px] bg-[#f0f0ff] p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-5 w-5 text-[#635BFF]" />
                          <span className="text-sm font-bold text-foreground">Stripe</span>
                        </div>
                        {companyPaymentStatus && "status" in companyPaymentStatus && (
                          <CompanyPaymentStatusBadge status={companyPaymentStatus.status} />
                        )}
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Customer ID</span>
                          <span className="font-mono text-xs text-foreground">{company.customer_id_stripe.slice(0, 18)}...</span>
                        </div>
                      </div>
                      <div className="mt-3">
                        <StripeDashboardButton customerId={company.customer_id_stripe} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ),
          },
          {
            value: "reservations",
            label: "Réservations",
            content: (
              <ReservationsSection
                context={{ type: "company", companyId: company.id, companyName: company.name || "" }}
                searchParams={resolvedSearchParams}
              />
            ),
          },
          {
            value: "paiements",
            label: "Historique des paiements",
            content: (
              <PaymentHistorySection payments={customerPayments} />
            ),
          },
        ]}
      />
    </div>
  )
}
