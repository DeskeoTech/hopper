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

  // Fetch photos and resources in parallel
  const [{ data: photos }, { data: resources }] = await Promise.all([
    supabase
      .from("site_photos")
      .select("site_id, storage_path")
      .in(
        "site_id",
        sites.map((s) => s.id)
      )
      .order("created_at"),
    supabase
      .from("resources")
      .select("site_id, capacity, type")
      .in(
        "site_id",
        sites.map((s) => s.id)
      )
      .eq("status", "available"),
  ])

  // Combine sites with photos and capacity
  return sites.map((site) => {
    const sitePhotos = photos?.filter((p) => p.site_id === site.id) || []
    const siteResources = resources?.filter((r) => r.site_id === site.id) || []
    const totalCapacity = siteResources
      .filter((r) => r.type !== "meeting_room")
      .reduce((sum, r) => sum + (r.capacity || 0), 0)
    const meetingRoomsCount = siteResources.filter((r) => r.type === "meeting_room").length

    // Build full URLs for photos from Supabase storage
    const photoUrls = sitePhotos.map(
      (p) => `${supabaseUrl}/storage/v1/object/public/site-photos/${p.storage_path}`
    )

    return {
      ...site,
      photos: photoUrls,
      capacity: totalCapacity,
      meetingRoomsCount,
    }
  })
}

export default async function ReservationPage() {
  const sites = await getSitesWithPhotos()

  return <ReservationPageClient initialSites={sites} />
}
