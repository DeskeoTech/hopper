import { createClient } from "@/lib/supabase/server"
import { getStorageUrl } from "@/lib/utils"
import { SiteCard } from "@/components/admin/site-card"
import { SitesSearch } from "@/components/admin/sites/sites-search"
import { CreateSiteModal } from "@/components/admin/sites/create-site-modal"
import { nowInParis, parisStartOfDay, parisEndOfDay } from "@/lib/timezone"
import { format } from "date-fns"
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

  // Get flex desk resources only (available status, open sites only)
  const { data: flexResources } = await supabase
    .from("resources")
    .select("id, site_id, capacity, sites!inner(status)")
    .eq("type", "flex_desk")
    .eq("status", "available")
    .eq("sites.status", "open")
    .not("capacity", "is", null)

  // Get today's confirmed bookings for flex resources
  const today = format(nowInParis(), "yyyy-MM-dd")
  const startOfDay = parisStartOfDay(today)
  const endOfDay = parisEndOfDay(today)

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
  const siteImageMap: Record<string, string> = {}
  sitePhotos?.forEach((photo) => {
    if (!siteImageMap[photo.site_id]) {
      siteImageMap[photo.site_id] = getStorageUrl("site-photos", photo.storage_path)
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

  // Fetch @deskeo.fr users for contact assignment
  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des sites: {error.message}</p>
      </div>
    )
  }

  // Sort sites: open first, then alphabetically (case-insensitive)
  let filteredSites = [...(sites || [])].sort((a, b) => {
    // Open sites first
    if (a.status === "open" && b.status !== "open") return -1
    if (a.status !== "open" && b.status === "open") return 1
    // Then alphabetically
    return (a.name || "").localeCompare(b.name || "", "fr", { sensitivity: "base" })
  })
  if (searchQuery) {
    const searchLower = searchQuery.toLowerCase()
    filteredSites = filteredSites.filter(
      (site) => site.name?.toLowerCase().includes(searchLower) || site.address?.toLowerCase().includes(searchLower),
    )
  }

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-h2 text-foreground">Sites</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gérez vos espaces de coworking</p>
        </div>
        <CreateSiteModal />
      </div>

      {/* Search */}
      <Suspense fallback={<Skeleton className="h-12 w-full rounded-[16px]" />}>
        <SitesSearch />
      </Suspense>

      {/* Sites Grid */}
      <section>
        {filteredSites.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
          <div className="rounded-[20px] bg-card p-8 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {searchQuery ? "Aucun site ne correspond à votre recherche" : "Aucun site trouvé"}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
