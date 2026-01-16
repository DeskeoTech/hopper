import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import {
  Home,
  Building2,
  Calendar,
  Briefcase,
  Plus,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { addDays, differenceInDays, format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

export default async function AccueilPage() {
  const supabase = await createClient()

  // Récupération des données en parallèle
  const [sitesResult, companiesResult, bookingsResult, expiringResult] =
    await Promise.all([
      // Nombre de sites
      supabase.from("sites").select("*", { count: "exact", head: true }),

      // Nombre de companies
      supabase.from("companies").select("*", { count: "exact", head: true }),

      // Réservations des 7 prochains jours (confirmées)
      supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .gte("start_date", new Date().toISOString())
        .lte("start_date", addDays(new Date(), 7).toISOString())
        .eq("status", "confirmed"),

      // Abonnements expirant dans 30 jours
      supabase
        .from("companies")
        .select("id, name, contact_email, subscription_end_date")
        .gte("subscription_end_date", new Date().toISOString())
        .lte("subscription_end_date", addDays(new Date(), 30).toISOString())
        .order("subscription_end_date", { ascending: true })
        .limit(10),
    ])

  const sitesCount = sitesResult.count || 0
  const companiesCount = companiesResult.count || 0
  const bookingsCount = bookingsResult.count || 0
  const expiringCompanies = expiringResult.data || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
          <Home className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="type-h2 text-foreground">Bienvenue sur Hopper</h1>
          <p className="mt-1 text-muted-foreground">
            Gérez vos espaces de coworking et vos réservations
          </p>
        </div>
      </div>

      {/* CTA Créer une réservation */}
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="type-h3 text-foreground">Créer une réservation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Réservez un espace pour un client rapidement
            </p>
          </div>
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/admin/reservations">
              <Plus className="h-5 w-5" />
              Nouvelle réservation
            </Link>
          </Button>
        </div>
      </div>

      {/* Accès rapide */}
      <section>
        <h2 className="type-h3 text-foreground mb-4">Accès rapide</h2>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {/* Sites */}
          <Link href="/admin/sites" className="group block">
            <article className="rounded-lg bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
                  <Building2 className="h-6 w-6 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-header text-lg text-foreground group-hover:text-primary transition-colors">
                    Sites
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {sitesCount} site{sitesCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </Link>

          {/* Réservations */}
          <Link href="/admin/reservations" className="group block">
            <article className="rounded-lg bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
                  <Calendar className="h-6 w-6 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-header text-lg text-foreground group-hover:text-primary transition-colors">
                    Réservations
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {bookingsCount} cette semaine
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </Link>

          {/* Clients */}
          <Link href="/admin/clients" className="group block">
            <article className="rounded-lg bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
                  <Briefcase className="h-6 w-6 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-header text-lg text-foreground group-hover:text-primary transition-colors">
                    Clients
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {companiesCount} entreprise{companiesCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </Link>
        </div>
      </section>

      {/* Abonnements expirant bientôt */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="type-h3 text-foreground flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            Abonnements expirant bientôt
          </h2>
          <Link
            href="/admin/clients"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Voir tout
          </Link>
        </div>

        {expiringCompanies.length > 0 ? (
          <div className="rounded-lg bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Entreprise
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground hidden sm:table-cell">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                      Fin d&apos;abonnement
                    </th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                      Jours restants
                    </th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {expiringCompanies.map((company) => {
                    const endDate = new Date(company.subscription_end_date!)
                    const daysLeft = differenceInDays(endDate, new Date())
                    const isUrgent = daysLeft <= 7

                    return (
                      <tr
                        key={company.id}
                        className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <span className="font-medium text-foreground">
                            {company.name || "Sans nom"}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden sm:table-cell">
                          <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                            {company.contact_email || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-foreground">
                            {format(endDate, "d MMM yyyy", { locale: fr })}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium",
                              isUrgent
                                ? "bg-destructive/10 text-destructive"
                                : "bg-amber-500/10 text-amber-600"
                            )}
                          >
                            {daysLeft} jour{daysLeft !== 1 ? "s" : ""}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/admin/clients/${company.id}`}
                            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Voir
                          </Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="rounded-lg bg-card p-8 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              Aucun abonnement n&apos;expire dans les 30 prochains jours
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
