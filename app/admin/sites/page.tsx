import { createClient } from "@/lib/supabase/server"
import { SiteCard } from "@/components/admin/site-card"
import { SitesSearch } from "@/components/admin/sites/sites-search"
import { Building2 } from "lucide-react"

interface SitesPageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function SitesPage({ searchParams }: SitesPageProps) {
  const params = await searchParams
  const searchQuery = params.search || ""
  const supabase = await createClient()

  const { data: sites, error } = await supabase.from("sites").select("*").order("name")

  // Fetch all site photos (first photo per site)
  const { data: sitePhotos } = await supabase
    .from("site_photos")
    .select("site_id, storage_path")
    .order("created_at", { ascending: true })

  // Build a map of site_id -> first photo URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const siteImageMap: Record<string, string> = {}
  sitePhotos?.forEach((photo) => {
    if (!siteImageMap[photo.site_id]) {
      siteImageMap[photo.site_id] = `${supabaseUrl}/storage/v1/object/public/site-photos/${photo.storage_path}`
    }
  })

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des sites: {error.message}</p>
      </div>
    )
  }

  // Filter sites based on search query
  let filteredSites = sites || []
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase()
    filteredSites = filteredSites.filter(
      (site) =>
        site.name?.toLowerCase().includes(searchLower) ||
        site.address?.toLowerCase().includes(searchLower)
    )
  }

  return (
    <div className="space-y-8">
      {/* Sites List */}
      <section>
        <h2 className="type-h3 text-foreground mb-4">Tous les sites Hopper</h2>

        <div className="mb-6">
          <SitesSearch />
        </div>

        {filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                imageUrl={siteImageMap[site.id]}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12">
            <Building2 className="mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchQuery ? "Aucun site ne correspond à votre recherche" : "Aucun site trouvé"}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
