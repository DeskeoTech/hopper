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

  // Fetch photos, resources and resource photos in parallel
  const [{ data: photos }, { data: resources }, { data: resourcePhotos }] = await Promise.all([
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
      .select("id, site_id, name, capacity, type")
      .in(
        "site_id",
        sites.map((s) => s.id)
      )
      .eq("status", "available"),
    supabase
      .from("resource_photos")
      .select("resource_id, storage_path, display_order")
      .order("display_order"),
  ])

  // Combine sites with photos and capacity
  return sites.map((site) => {
    const sitePhotos = photos?.filter((p) => p.site_id === site.id) || []
    const siteResources = resources?.filter((r) => r.site_id === site.id) || []
    const totalCapacity = siteResources
      .filter((r) => r.type !== "meeting_room")
      .reduce((sum, r) => sum + (r.capacity || 0), 0)
    const meetingRoomResources = siteResources.filter((r) => r.type === "meeting_room")

    // Build full URLs for photos from Supabase storage
    const photoUrls = sitePhotos.map(
      (p) => `${supabaseUrl}/storage/v1/object/public/site-photos/${p.storage_path}`
    )

    // Build meeting rooms with their photos
    const meetingRooms = meetingRoomResources.map((room) => {
      const roomPhotos = resourcePhotos
        ?.filter((rp) => rp.resource_id === room.id)
        ?.map((rp) => `${supabaseUrl}/storage/v1/object/public/site-photos/${rp.storage_path}`) || []
      return {
        id: room.id,
        name: room.name,
        capacity: room.capacity,
        photoUrls: roomPhotos,
      }
    })

    return {
      ...site,
      photos: photoUrls,
      capacity: totalCapacity,
      meetingRoomsCount: meetingRoomResources.length,
      meetingRooms,
    }
  })
}

export default async function ReservationPage() {
  const sites = await getSitesWithPhotos()

  return <ReservationPageClient initialSites={sites} />
}
