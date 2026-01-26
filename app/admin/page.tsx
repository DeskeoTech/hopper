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
  User,
} from "lucide-react"
import { startOfWeek, endOfWeek } from "date-fns"

export default async function AccueilPage() {
  const supabase = await createClient()

  // Récupération des données en parallèle
  const [sitesResult, companiesResult, bookingsResult] = await Promise.all([
    // Nombre de sites
    supabase.from("sites").select("*", { count: "exact", head: true }),

    // Nombre de companies
    supabase.from("companies").select("*", { count: "exact", head: true }),

    // Réservations de la semaine courante (passées, présentes et futures)
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .gte("start_date", startOfWeek(new Date(), { weekStartsOn: 1 }).toISOString())
      .lte("start_date", endOfWeek(new Date(), { weekStartsOn: 1 }).toISOString())
      .eq("status", "confirmed"),
  ])

  const sitesCount = sitesResult.count || 0
  const companiesCount = companiesResult.count || 0
  const bookingsCount = bookingsResult.count || 0

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
        <Button asChild size="sm" className="shrink-0 self-start">
          <Link href="/compte">
            <User className="mr-2 size-4" />
            Dashboard Utilisateur
          </Link>
        </Button>
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

      {/* Fil d'actualité */}
      <section>
        <h2 className="type-h3 text-foreground mb-4">Fil d'actualité</h2>
        <div className="rounded-lg bg-card p-8 text-center">
          <p className="text-muted-foreground">
            Aucune actualité pour le moment.
          </p>
        </div>
      </section>
    </div>
  )
}
