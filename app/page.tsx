import { createClient } from "@/lib/supabase/server"
import { ReservationPageClient } from "@/components/public/reservation/reservation-page-client"
import { getTranslations } from "next-intl/server"

export async function generateMetadata() {
  const t = await getTranslations("reservation")
  return {
    title: t("metadata.title"),
    description: t("metadata.description"),
  }
}

async function getSitesWithPhotos() {
  const supabase = await createClient()
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Fetch open sites
  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("*")
    .eq("status", "open")
    .order("name")

  if (sitesError || !sites) {
    console.error("Error fetching sites:", sitesError)
    return []
  }

  const siteIds = sites.map((s) => s.id)

  // Fetch photos, resources, and closures in parallel
  const [{ data: photos }, { data: resources }, { data: closures }] = await Promise.all([
    supabase
      .from("site_photos")
      .select("site_id, storage_path")
      .in("site_id", siteIds)
      .order("created_at"),
    supabase
      .from("resources")
      .select("site_id, capacity, type")
      .in("site_id", siteIds)
      .eq("status", "available"),
    supabase
      .from("site_closures")
      .select("site_id, date")
      .in("site_id", siteIds)
      .gte("date", new Date().toISOString().split("T")[0]),
  ])

  // Combine sites with photos, capacity, and closures
  return sites.map((site) => {
    const sitePhotos = photos?.filter((p) => p.site_id === site.id) || []
    const siteResources = resources?.filter((r) => r.site_id === site.id) || []
    const totalCapacity = siteResources
      .filter((r) => r.type !== "meeting_room")
      .reduce((sum, r) => sum + (r.capacity || 0), 0)
    const meetingRoomsCount = siteResources.filter((r) => r.type === "meeting_room").length
    const siteClosures = closures?.filter((c) => c.site_id === site.id).map((c) => c.date) || []

    // Build full URLs for photos from Supabase storage
    const photoUrls = sitePhotos.map(
      (p) => `${supabaseUrl}/storage/v1/object/public/site-photos/${p.storage_path}`
    )

    return {
      ...site,
      photos: photoUrls,
      capacity: site.capacity ?? 0,
      meetingRoomsCount,
      closureDates: siteClosures,
    }
  })
}

export default async function HomePage() {
  const sites = await getSitesWithPhotos()

  return <ReservationPageClient initialSites={sites} />
}
