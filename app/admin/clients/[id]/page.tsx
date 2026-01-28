import { notFound } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft, Briefcase, Mail, Phone, MapPin, Calendar, CreditCard, Building2, Info } from "lucide-react"
import { EditHeaderModal } from "@/components/admin/company-edit/edit-header-modal"
import { EditContactModal } from "@/components/admin/company-edit/edit-contact-modal"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { UsersList } from "@/components/admin/company-edit/users-list"
import { ReservationsSection } from "@/components/admin/reservations/reservations-section"
import { DetailsTabs } from "@/components/admin/details-tabs"
import { CreditsSection } from "@/components/admin/company-credits/credits-section"
import { cn } from "@/lib/utils"
import type { CreditMovement, CreditMovementType } from "@/lib/types/database"

interface CompanyDetailsPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string | undefined>>
}

export default async function CompanyDetailsPage({ params, searchParams }: CompanyDetailsPageProps) {
  const { id } = await params
  const resolvedSearchParams = await searchParams
  const activeTab = resolvedSearchParams.tab || "info"
  const supabase = await createClient()

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

  // Fetch credit movements from bookings
  const userIds = users?.map((u) => u.id) || []
  let movements: CreditMovement[] = []

  if (userIds.length > 0) {
    const { data: bookings } = await supabase
      .from("bookings")
      .select(`
        id,
        start_date,
        status,
        credits_used,
        notes,
        resource:resources(name)
      `)
      .in("user_id", userIds)
      .not("credits_used", "is", null)
      .order("start_date", { ascending: false })
      .limit(50)

    // Transform bookings to credit movements
    let runningBalance = totalCredits
    movements = (bookings || []).map((booking) => {
      const isConfirmed = booking.status === "confirmed"
      const isCancelled = booking.status === "cancelled"
      const creditsUsed = booking.credits_used || 0

      let type: CreditMovementType = "reservation"
      let amount = -creditsUsed

      if (isCancelled) {
        type = "cancellation"
        amount = creditsUsed // Credits restored
      }

      const resourceName = (booking.resource as { name: string } | null)?.name || "Ressource"
      const description = isCancelled
        ? `Annulation - ${resourceName}`
        : `Réservation - ${resourceName}`

      const movement: CreditMovement = {
        id: booking.id,
        date: booking.start_date,
        type,
        amount,
        description,
        balance_after: runningBalance,
      }

      // Adjust running balance for display (reverse chronological)
      runningBalance = runningBalance - amount

      return movement
    })
  }

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
              <div className="rounded-lg bg-card p-4 sm:p-6">
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
              <UsersList companyId={company.id} initialUsers={users || []} />
            </div>

            {/* Sidebar - Right Column */}
            <div className="space-y-6">
              {/* Subscription */}
              <div className="relative rounded-lg bg-card p-4 sm:p-6">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        type="button"
                        className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[250px]">
                      <p>Le client doit se rendre sur son espace facturation pour modifier son abonnement ou ses informations de facturation.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                  <Calendar className="h-5 w-5" />
                  Abonnement
                </h2>
                <div className="space-y-3">
                  {company.subscription_period && (
                    <div>
                      <span className="text-sm text-muted-foreground">Période</span>
                      <p className="font-medium text-foreground">
                        {company.subscription_period === "month" ? "Mensuel" : "Hebdomadaire"}
                      </p>
                    </div>
                  )}
                  {company.subscription_start_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">Date de début</span>
                      <p className="font-medium text-foreground">
                        {new Date(company.subscription_start_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}
                  {company.subscription_end_date && (
                    <div>
                      <span className="text-sm text-muted-foreground">Date de fin</span>
                      <p className="font-medium text-foreground">
                        {new Date(company.subscription_end_date).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  )}
                  {!company.subscription_period && !company.subscription_start_date && !company.subscription_end_date && (
                    <p className="text-muted-foreground text-sm">Non renseigné</p>
                  )}
                </div>
              </div>

              {/* Stripe */}
              {company.customer_id_stripe && (
                <div className="rounded-lg bg-card p-4 sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
                    <CreditCard className="h-5 w-5" />
                    Stripe
                  </h2>
                  <div>
                    <span className="text-sm text-muted-foreground">Customer ID</span>
                    <p className="font-mono text-sm text-foreground break-all">{company.customer_id_stripe}</p>
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
