import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient, getUser } from "@/lib/supabase/server"
import { ArrowLeft, Briefcase, Mail, Phone, MapPin, CreditCard, Building2 } from "lucide-react"
import { EditHeaderModal } from "@/components/admin/company-edit/edit-header-modal"
import { EditMainSiteModal } from "@/components/admin/company-edit/edit-main-site-modal"
import { EditContactModal } from "@/components/admin/company-edit/edit-contact-modal"
import { StripeDashboardButton } from "@/components/admin/company-edit/stripe-actions"
import { UsersList } from "@/components/admin/company-edit/users-list"
import { ReservationsSection } from "@/components/admin/reservations/reservations-section"
import { DetailsTabs } from "@/components/admin/details-tabs"
import { CreditsSection } from "@/components/admin/company-credits/credits-section"
import { PassesSection } from "@/components/admin/company-passes/passes-section"
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

  // Fetch company data with main site
  const { data: company, error } = await supabase
    .from("companies")
    .select("*, main_site:sites!main_site_id(id, name, address, status)")
    .eq("id", id)
    .single()

  if (error || !company) {
    notFound()
  }

  // Fetch users for this company
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .eq("company_id", id)
    .order("last_name")
    .order("first_name")

  // Fetch valid credits using the SQL function
  // Credits are valid if:
  // - extras_credit = true: permanent credits (always valid)
  // - extras_credit = false/null: valid for 1 month from created_at
  const { data: creditsResult } = await supabase
    .rpc("get_company_valid_credits", { p_company_id: id })

  const totalCredits = creditsResult ?? 0

  // Fetch user IDs for this company (needed for bookings query)
  const userIds = users?.map((u) => u.id) || []

  // Fetch credit movements from credit_transactions table
  const creditTransactionsPromise = supabase
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
    .limit(100)

  // Fetch bookings with credits_used (for historical data without credit_transactions)
  const bookingsPromise = userIds.length > 0
    ? supabase
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
    : Promise.resolve({ data: [] })

  // Fetch company passes (contracts with plan details)
  const passesPromise = supabase
    .from("contracts")
    .select(`
      id,
      status,
      start_date,
      end_date,
      commitment_end_date,
      renewal_end_date,
      Number_of_seats,
      plans (name, recurrence, price_per_seat_month)
    `)
    .eq("company_id", id)
    .order("start_date", { ascending: false })

  // Fetch all sites for the main site selector
  const sitesPromise = supabase
    .from("sites")
    .select("id, name")
    .order("name")

  const [{ data: creditTransactions }, { data: bookings }, { data: passesData }, { data: allSites }] = await Promise.all([
    creditTransactionsPromise,
    bookingsPromise,
    passesPromise,
    sitesPromise,
  ])

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
      commitment_end_date: c.commitment_end_date,
      renewal_end_date: c.renewal_end_date,
      plan_name: plan?.name || "Pass",
      plan_recurrence: plan?.recurrence || null,
      price_per_seat_month: plan?.price_per_seat_month ?? null,
      number_of_seats: c.Number_of_seats ? Number(c.Number_of_seats) : null,
      assigned_users_count: contractUserCounts[c.id] || 0,
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
    const resourceName = (tx.booking as { resource: { name: string } | null } | null)?.resource?.name

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
      const resourceName = (booking.resource as { name: string } | null)?.name || "Ressource"
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

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link
        href="/admin/clients"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux clients
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
          <Briefcase className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h1 className="type-h2 text-foreground">{company.name || "Sans nom"}</h1>
            <span
              className={cn(
                "rounded-sm px-2 py-0.5 text-xs font-medium",
                isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              )}
            >
              {isActive ? "Actif" : "Inactif"}
            </span>
            <EditHeaderModal
              companyId={company.id}
              initialName={company.name}
              initialType={company.company_type}
              isActive={isActive}
            />
          </div>
          {company.company_type && (
            <p className="mt-1 text-muted-foreground">{companyTypeLabel}</p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <DetailsTabs
        defaultTab={activeTab}
        infoContent={
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main Content - Left Column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Contact Info */}
              <div className="relative rounded-lg bg-card p-4 sm:p-6">
                <EditContactModal
                  companyId={company.id}
                  initialAddress={company.address}
                  initialPhone={company.phone}
                  initialEmail={company.contact_email}
                />
                <h2 className="mb-4 flex items-center gap-2 type-h3 text-foreground">
                  <Mail className="h-5 w-5" />
                  Informations de contact
                </h2>
                {company.address || company.phone || company.contact_email ? (
                  <div className="space-y-3">
                    {company.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="text-sm text-muted-foreground">Adresse</span>
                          <p className="text-foreground">{company.address}</p>
                        </div>
                      </div>
                    )}
                    {company.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-sm text-muted-foreground">Téléphone</span>
                          <p className="text-foreground">{company.phone}</p>
                        </div>
                      </div>
                    )}
                    {company.contact_email && (
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                        <div>
                          <span className="text-sm text-muted-foreground">Email</span>
                          <p className="text-foreground">{company.contact_email}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Non renseigné</p>
                )}
              </div>

              {/* Site principal */}
              <div className="relative rounded-lg bg-card p-4 sm:p-6">
                <EditMainSiteModal
                  companyId={company.id}
                  initialSiteId={company.main_site_id}
                  sites={allSites || []}
                />
                <h2 className="mb-4 flex items-center gap-2 type-h3 text-foreground">
                  <Building2 className="h-5 w-5" />
                  Site principal
                </h2>
                {company.main_site ? (
                  <Link
                    href={`/admin/sites/${company.main_site.id}`}
                    className="flex items-center justify-between rounded-sm border border-border p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{company.main_site.name}</p>
                      <p className="text-sm text-muted-foreground">{company.main_site.address}</p>
                    </div>
                    <span
                      className={cn(
                        "rounded-sm px-2 py-0.5 text-xs font-medium",
                        company.main_site.status === "open"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      )}
                    >
                      {company.main_site.status === "open" ? "Ouvert" : "Fermé"}
                    </span>
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucun site associé</p>
                )}
              </div>

              {/* Users */}
              <UsersList companyId={company.id} initialUsers={users || []} isTechAdmin={isTechAdmin} />
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Pass */}
              <PassesSection
                passes={adminPasses}
                stripeCustomerId={company.customer_id_stripe}
                stripeCustomerEmail={company.contact_email}
                companyName={company.name || undefined}
              />

              {/* Stripe */}
              {company.customer_id_stripe && (
                <div className="rounded-lg bg-card p-4 sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                    <CreditCard className="h-5 w-5" />
                    Stripe
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Customer ID</span>
                      <p className="font-mono text-sm text-foreground break-all">{company.customer_id_stripe}</p>
                    </div>
                    <StripeDashboardButton customerId={company.customer_id_stripe} />
                  </div>
                </div>
              )}

              {/* Registration Info */}
              <div className="rounded-lg bg-card p-4 sm:p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">Informations</h2>
                <div className="space-y-3 text-sm">
                  {company.registration_date && (
                    <div>
                      <span className="text-muted-foreground">Date d'inscription</span>
                      <p className="text-foreground">
                        {new Date(company.registration_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">Créé le</span>
                    <p className="text-foreground">
                      {new Date(company.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Dernière mise à jour</span>
                    <p className="text-foreground">
                      {new Date(company.updated_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Credits */}
              <CreditsSection
                companyId={company.id}
                companyName={company.name || undefined}
                totalCredits={totalCredits}
                movements={movements}
              />
            </div>
          </div>
        }
        reservationsContent={
          <ReservationsSection
            context={{ type: "company", companyId: company.id, companyName: company.name || "" }}
            searchParams={resolvedSearchParams}
          />
        }
      />
    </div>
  )
}
