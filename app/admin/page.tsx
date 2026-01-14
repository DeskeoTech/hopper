import type React from "react"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { SiteCard } from "@/components/admin/site-card"
import { Building2, MapPin, CheckCircle2, XCircle } from "lucide-react"

export default async function AdminDashboardPage() {
  const supabase = await getSupabaseServerClient()

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

  // Stats
  const totalSites = sites?.length || 0
  const openSites = sites?.filter((s) => s.status === "open").length || 0
  const closedSites = sites?.filter((s) => s.status === "closed").length || 0

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des sites: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sites"
          value={totalSites}
          icon={Building2}
          bgColor="bg-brand"
          textColor="text-brand-foreground"
        />
        <StatCard
          title="Sites Ouverts"
          value={openSites}
          icon={CheckCircle2}
          bgColor="bg-success"
          textColor="text-success-foreground"
        />
        <StatCard title="Sites Fermés" value={closedSites} icon={XCircle} bgColor="bg-destructive" textColor="text-destructive-foreground" />
        <StatCard
          title="Ressources"
          value={resourceCounts?.length || 0}
          icon={MapPin}
          bgColor="bg-muted"
          textColor="text-foreground"
        />
      </div>

      {/* Sites List */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="type-h3 text-foreground">Tous les sites Hopper</h2>
          <span className="text-sm text-muted-foreground">{totalSites} site(s)</span>
        </div>

        {sites && sites.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {sites.map((site) => (
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
            <p className="text-muted-foreground">Aucun site trouvé</p>
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({
  title,
  value,
  icon: Icon,
  bgColor,
  textColor,
}: {
  title: string
  value: number
  icon: React.ComponentType<{ className?: string }>
  bgColor: string
  textColor: string
}) {
  return (
    <div className={`rounded-lg ${bgColor} p-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm ${textColor}/70`}>{title}</p>
          <p className={`mt-1 text-3xl font-bold ${textColor}`}>{value}</p>
        </div>
        <div className={`rounded-sm ${textColor}/10 p-3`}>
          <Icon className={`h-6 w-6 ${textColor}`} />
        </div>
      </div>
    </div>
  )
}
