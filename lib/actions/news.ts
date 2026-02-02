"use server"

import { createClient } from "@/lib/supabase/server"
import type { NewsPostWithSite } from "@/lib/types/database"

interface GetNewsPostsOptions {
  siteId?: string | null
  mainSiteId?: string | null
  limit?: number
}

export async function getNewsPosts(
  options?: GetNewsPostsOptions
): Promise<NewsPostWithSite[]> {
  const supabase = await createClient()
  const limit = options?.limit ?? 20

  // Build query for published posts
  let query = supabase
    .from("news_posts")
    .select(
      `
      *,
      sites(name)
    `
    )
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("is_pinned", { ascending: false })
    .order("published_at", { ascending: false })
    .limit(limit)

  // Filter: global posts OR site-specific posts for user's site
  if (options?.mainSiteId) {
    query = query.or(`site_id.is.null,site_id.eq.${options.mainSiteId}`)
  } else if (options?.siteId) {
    query = query.or(`site_id.is.null,site_id.eq.${options.siteId}`)
  }
  // If no site filter, return all published posts (for admin view)

  const { data, error } = await query

  if (error) {
    console.error("Error fetching news posts:", error)
    return []
  }

  // Build image URLs
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  return (data || []).map((post) => ({
    id: post.id,
    title: post.title,
    content: post.content,
    excerpt: post.excerpt,
    image_storage_path: post.image_storage_path,
    site_id: post.site_id,
    published_at: post.published_at,
    is_pinned: post.is_pinned,
    created_at: post.created_at,
    updated_at: post.updated_at,
    site_name: (post.sites as { name: string } | null)?.name || null,
    image_url: post.image_storage_path
      ? `${supabaseUrl}/storage/v1/object/public/news-photos/${post.image_storage_path}`
      : null,
  }))
}
