import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { ActivityFeedPage } from "@/components/client/activity-feed-page"
import { getNewsPosts } from "@/lib/actions/news"

export default async function ActualitesPage() {
  const authUser = await getUser()

  if (!authUser?.email) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Get user's main site via company
  const { data: userProfile } = await supabase
    .from("users")
    .select(
      `
      company_id,
      companies (*)
    `
    )
    .eq("email", authUser.email)
    .single()

  const mainSiteId = (userProfile?.companies as unknown as { main_site_id: string | null } | null)?.main_site_id || null

  const posts = await getNewsPosts({ mainSiteId })

  return <ActivityFeedPage posts={posts} />
}
