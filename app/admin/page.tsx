import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getNewsPosts } from "@/lib/actions/news"
import { ActiveClientsTable } from "@/components/admin/accueil/active-clients-table"
import { CollapsibleSection } from "@/components/admin/accueil/collapsible-section"
import { NewsFeedSection } from "@/components/admin/accueil/news-feed-section"
import {
  Building2,
  Calendar,
  Briefcase,
  Plus,
  ArrowRight,
  Coffee,
  Package,
  ExternalLink,
  Home,
} from "lucide-react"
import { startOfWeek, endOfWeek } from "date-fns"

export default async function AccueilPage() {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  // Récupération des données en parallèle
  const [sitesResult, companiesResult, bookingsResult, activeClientsResult, allSitesResult] = await Promise.all([
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

    // Clients avec un forfait actif aujourd'hui
    supabase
      .from("users")
      .select(`
        id, first_name, last_name,
        companies!inner(name, main_site_id, sites(id, name)),
        contracts!inner(id, status, start_date, end_date)
      `)
      .eq("contracts.status", "active")
      .lte("contracts.start_date", today)
      .or(`end_date.is.null,end_date.gte.${today}`, { referencedTable: "contracts" })
      .order("last_name", { ascending: true }),

    // Sites ouverts (pour le filtre)
    supabase.from("sites").select("id, name").eq("status", "open").order("name"),
  ])

  const sitesCount = sitesResult.count || 0
  const companiesCount = companiesResult.count || 0
  const bookingsCount = bookingsResult.count || 0

  // Transformer les clients actifs
  const activeClients = (activeClientsResult.data || []).map((u) => {
    const company = u.companies as unknown as { name: string | null; main_site_id: string | null; sites: { id: string; name: string } | null } | null
    return {
      id: u.id,
      firstName: u.first_name,
      lastName: u.last_name,
      companyName: company?.name || null,
      siteId: company?.sites?.id || null,
      siteName: company?.sites?.name || null,
    }
  })

  const allSites = (allSitesResult.data || []).map((s) => ({
    id: s.id,
    name: s.name,
  }))

  // Fetch latest news posts (admin sees all posts)
  const newsPosts = await getNewsPosts({ limit: 20 })

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
          <Home className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="type-h2 text-foreground">Accueil</h1>
          <p className="mt-1 text-muted-foreground">Bienvenue sur votre espace d&apos;administration</p>
        </div>
      </div>

      {/* Tableau des clients avec forfait actif */}
      <ActiveClientsTable clients={activeClients} sites={allSites} />

      {/* Accès rapide */}
      <CollapsibleSection title="Accès rapide">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
          {/* Nouvelle réservation */}
          <Link href="/admin/reservations" className="group block">
            <article className="rounded-lg bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
                  <Plus className="h-6 w-6 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-header text-xl text-foreground group-hover:text-primary transition-colors">
                    Nouvelle réservation
                  </h3>
                  <p className="text-base text-muted-foreground">
                    Réservez un espace pour un client
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </Link>

          {/* Sites */}
          <Link href="/admin/sites" className="group block">
            <article className="rounded-lg bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
                  <Building2 className="h-6 w-6 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-header text-xl text-foreground group-hover:text-primary transition-colors">
                    Sites
                  </h3>
                  <p className="text-base text-muted-foreground">
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
                  <h3 className="font-header text-xl text-foreground group-hover:text-primary transition-colors">
                    Réservations
                  </h3>
                  <p className="text-base text-muted-foreground">
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
                  <h3 className="font-header text-xl text-foreground group-hover:text-primary transition-colors">
                    Clients
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {companiesCount} entreprise{companiesCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </Link>

          {/* App Client Hopper Café */}
          <a
            href="https://hopper-cafe.softr.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <article className="rounded-lg bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
                  <Coffee className="h-6 w-6 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-header text-xl text-foreground group-hover:text-primary transition-colors">
                    Hopper Café
                  </h3>
                  <p className="text-base text-muted-foreground">
                    Accès à l&apos;application Hopper Café
                  </p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </a>

          {/* Réception des commandes */}
          <a
            href="https://achats-deskeo.softr.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <article className="rounded-lg bg-card p-5 transition-all hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-muted">
                  <Package className="h-6 w-6 text-foreground/60" />
                </div>
                <div className="flex-1">
                  <h3 className="font-header text-xl text-foreground group-hover:text-primary transition-colors">
                    Réception des commandes
                  </h3>
                  <p className="text-base text-muted-foreground">
                    Gestion des achats Deskeo
                  </p>
                </div>
                <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </a>
        </div>
      </CollapsibleSection>

      {/* Fil d'actualité */}
      <CollapsibleSection title="Fil d'actualité">
        <NewsFeedSection posts={newsPosts} />
      </CollapsibleSection>
    </div>
  )
}
