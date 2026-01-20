import { createClient } from "@/lib/supabase/server"
import { SiteCard } from "@/components/admin/site-card"
import { SitesSearch } from "@/components/admin/sites/sites-search"
import { Building2 } from "lucide-react"
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

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

  // Get flex desk resources only (available status)
  const { data: flexResources } = await supabase
    .from("resources")
    .select("id, site_id, capacity")
    .eq("type", "flex_desk")
    .eq("status", "available")
    .not("capacity", "is", null)

  // Get today's confirmed bookings for flex resources
  const today = new Date().toISOString().split("T")[0]
  const startOfDay = `${today}T00:00:00Z`
  const endOfDay = `${today}T23:59:59Z`

  const flexResourceIds = flexResources?.map((r) => r.id) || []
  const { data: todayBookings } = flexResourceIds.length > 0
    ? await supabase
        .from("bookings")
        .select("resource_id, seats_count")
        .in("resource_id", flexResourceIds)
        .eq("status", "confirmed")
        .gte("start_date", startOfDay)
        .lte("start_date", endOfDay)
    : { data: [] }

  // Build a map of site_id -> first photo URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const siteImageMap: Record<string, string> = {}
  sitePhotos?.forEach((photo) => {
    if (!siteImageMap[photo.site_id]) {
      siteImageMap[photo.site_id] = `${supabaseUrl}/storage/v1/object/public/site-photos/${photo.storage_path}`
    }
  })

  // Build map of resource_id -> booked seats for today
  const resourceBookedMap: Record<string, number> = {}
  todayBookings?.forEach((booking) => {
    const resourceId = booking.resource_id
    resourceBookedMap[resourceId] = (resourceBookedMap[resourceId] || 0) + (booking.seats_count || 1)
  })

  // Build map of site_id -> {available, total} for flex desks
  const siteFlexAvailabilityMap: Record<string, { available: number; total: number }> = {}
  flexResources?.forEach((resource) => {
    const siteId = resource.site_id
    const capacity = resource.capacity || 0
    const booked = resourceBookedMap[resource.id] || 0

    if (!siteFlexAvailabilityMap[siteId]) {
      siteFlexAvailabilityMap[siteId] = { available: 0, total: 0 }
    }
    siteFlexAvailabilityMap[siteId].total += capacity
    siteFlexAvailabilityMap[siteId].available += Math.max(0, capacity - booked)
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
      (site) => site.name?.toLowerCase().includes(searchLower) || site.address?.toLowerCase().includes(searchLower),
    )
  }

  return (
    <div className="space-y-8">
      {/* Sites List */}
      <section>
        <h2 className="type-h3 text-foreground mb-4">Tous les sites Hopper</h2>

        <div className="mb-6">
          <Suspense fallback={<Skeleton className="h-10 w-full" />}>
            <SitesSearch />
          </Suspense>
        </div>

        {filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSites.map((site) => (
              <SiteCard
                key={site.id}
                site={site}
                imageUrl={siteImageMap[site.id]}
                flexAvailability={siteFlexAvailabilityMap[site.id]}
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
