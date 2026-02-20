import { createClient, getAdminProfile } from "@/lib/supabase/server"
import { getNewsPosts } from "@/lib/actions/news"
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
      {/* Site Switcher */}
      <div className="flex justify-end">
        <SiteSwitcher sites={allSites} currentSiteId={selectedSiteId} />
      </div>

      {/* Tableau des clients avec forfait actif */}
      <ActiveClientsTable clients={filteredClients} selectedDate={selectedDate} />

      {/* Accès rapide (collapsible) */}
      <QuickAccessSection />

      {/* Fil d'actualité */}
      <section className="space-y-4">
        <h2 className="type-h3 text-foreground">Fil d&apos;actualité</h2>
        <CreateNewsPostForm sites={allSites} defaultSiteId={adminProfile?.site_id || null} />
        <NewsFeedSection posts={newsPosts} />
      </section>
    </div>
  )
}
