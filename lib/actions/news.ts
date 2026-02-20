"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
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

export async function createNewsPost(formData: FormData) {
  const content = formData.get("content") as string
  const title = formData.get("title") as string | null
  const siteId = formData.get("site_id") as string | null

  if (!content?.trim()) {
    return { error: "Le contenu est requis" }
  }

  const supabase = createAdminClient()

  // Upload image if provided
  let imageStoragePath: string | null = null
  const imageFile = formData.get("image") as File | null
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop()
    const fileName = `${crypto.randomUUID()}.${ext}`

    // Ensure the bucket exists (idempotent)
    await supabase.storage.createBucket("news-photos", { public: true })

    const { error: uploadError } = await supabase.storage
      .from("news-photos")
      .upload(fileName, imageFile)

    if (uploadError) {
      return { error: uploadError.message }
    }
    imageStoragePath = fileName
  }

  // Generate title from content if not provided
  const postTitle = title?.trim() || content.trim().slice(0, 80)
  // Generate excerpt from content
  const excerpt = content.trim().length > 150 ? content.trim().slice(0, 150) + "..." : null

  const { error } = await supabase.from("news_posts").insert({
    title: postTitle,
    content: content.trim(),
    excerpt,
    site_id: siteId || null,
    image_storage_path: imageStoragePath,
    published_at: new Date().toISOString(),
    is_pinned: false,
  })

  if (error) {
    // Cleanup uploaded image if insert fails
    if (imageStoragePath) {
      await supabase.storage.from("news-photos").remove([imageStoragePath])
    }
    return { error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath("/actualites")
  return { success: true }
}
