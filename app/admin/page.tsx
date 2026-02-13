import { createClient, getAdminProfile } from "@/lib/supabase/server"
import { getNewsPosts } from "@/lib/actions/news"
import { ActiveClientsTable } from "@/components/admin/accueil/active-clients-table"
import { SiteSwitcher } from "@/components/admin/accueil/site-switcher"

import { NewsFeedSection } from "@/components/admin/accueil/news-feed-section"
import {
  Coffee,
  Package,
  ExternalLink,
  Home,
} from "lucide-react"

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
    allSitesResult,
    newsPosts,
  ] = await Promise.all([
    // Clients avec un forfait actif à la date sélectionnée
    supabase
      .from("users")
      .select(`
        id, first_name, last_name,
        companies!inner(name, main_site_id, sites(id, name)),
        contracts!inner(id, status, start_date, end_date)
      `)
      .eq("contracts.status", "active")
      .lte("contracts.start_date", selectedDate)
      .or(`end_date.is.null,end_date.gte.${selectedDate}`, { referencedTable: "contracts" })
      .order("last_name", { ascending: true }),

    // Tous les sites (pour le sélecteur)
    supabase.from("sites").select("id, name").order("name"),

    // Derniers posts d'actualité
    getNewsPosts({ limit: 20 }),
  ])

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

  // Filtrer les clients selon le site sélectionné
  const filteredClients = selectedSiteId === "all"
    ? activeClients
    : activeClients.filter((c) => c.siteId === selectedSiteId)

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
        <SiteSwitcher sites={allSites} currentSiteId={selectedSiteId} />
      </div>

      {/* Tableau des clients avec forfait actif */}
      <ActiveClientsTable clients={filteredClients} selectedDate={selectedDate} />

      {/* Accès rapide */}
      <section className="space-y-4">
        <h2 className="type-h3 text-foreground">Accès rapide</h2>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* Hopper Café */}
          <a
            href="https://hopper-cafe.softr.app/login"
            target="_blank"
            rel="noopener noreferrer"
            className="group block"
          >
            <article className="rounded-lg bg-card p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                  <Coffee className="h-5 w-5 text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-header text-base text-foreground group-hover:text-primary transition-colors">
                    Hopper Café
                  </h3>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
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
            <article className="rounded-lg bg-card p-4 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-sm bg-muted">
                  <Package className="h-5 w-5 text-foreground/60" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-header text-base text-foreground group-hover:text-primary transition-colors">
                    Réception commandes
                  </h3>
                </div>
                <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
              </div>
            </article>
          </a>
        </div>
      </section>

      {/* Fil d'actualité */}
      <section className="space-y-4">
        <h2 className="type-h3 text-foreground">Fil d&apos;actualité</h2>
        <NewsFeedSection posts={newsPosts} />
      </section>
    </div>
  )
}
