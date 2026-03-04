"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
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

  // Build query for published posts with author info
  let query = supabase
    .from("news_posts")
    .select(
      `
      *,
      sites(name),
      author:users!news_posts_created_by_fkey(first_name, last_name)
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
    // Client view: only show pinned posts or posts from the last 72h
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
    query = query.or(`is_pinned.eq.true,published_at.gte.${cutoff}`)
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

  return (data || []).map((post) => {
    const author = post.author as { first_name: string | null; last_name: string | null } | null
    return {
      id: post.id,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      image_storage_path: post.image_storage_path,
      site_id: post.site_id,
      created_by: post.created_by,
      published_at: post.published_at,
      is_pinned: post.is_pinned,
      created_at: post.created_at,
      updated_at: post.updated_at,
      site_name: (post.sites as { name: string } | null)?.name || null,
      image_url: post.image_storage_path
        ? `${supabaseUrl}/storage/v1/object/public/news-photos/${post.image_storage_path}`
        : null,
      author_first_name: author?.first_name || null,
      author_last_name: author?.last_name || null,
    }
  })
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

  // Get current user ID for author tracking
  const authUser = await getUser()
  let createdBy: string | null = null
  if (authUser?.email) {
    const readClient = await createClient()
    const { data: dbUser } = await readClient
      .from("users")
      .select("id")
      .eq("email", authUser.email)
      .maybeSingle()
    createdBy = dbUser?.id || null
  }

  const { error } = await supabase.from("news_posts").insert({
    title: postTitle,
    content: content.trim(),
    excerpt,
    site_id: siteId || null,
    image_storage_path: imageStoragePath,
    published_at: new Date().toISOString(),
    is_pinned: formData.get("is_pinned") === "true",
    created_by: createdBy,
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

export async function updateNewsPost(postId: string, formData: FormData) {
  if (!postId) {
    return { error: "ID de l'actualité requis" }
  }

  const content = formData.get("content") as string
  const siteId = formData.get("site_id") as string | null
  const removeImage = formData.get("remove_image") === "true"

  if (!content?.trim()) {
    return { error: "Le contenu est requis" }
  }

  const supabase = createAdminClient()

  // Fetch current post to get existing image path
  const { data: currentPost } = await supabase
    .from("news_posts")
    .select("image_storage_path")
    .eq("id", postId)
    .single()

  let imageStoragePath: string | null | undefined = undefined

  // Handle new image upload
  const imageFile = formData.get("image") as File | null
  if (imageFile && imageFile.size > 0) {
    const ext = imageFile.name.split(".").pop()
    const fileName = `${crypto.randomUUID()}.${ext}`

    await supabase.storage.createBucket("news-photos", { public: true })

    const { error: uploadError } = await supabase.storage
      .from("news-photos")
      .upload(fileName, imageFile)

    if (uploadError) {
      return { error: uploadError.message }
    }

    // Remove old image if it existed
    if (currentPost?.image_storage_path) {
      await supabase.storage.from("news-photos").remove([currentPost.image_storage_path])
    }

    imageStoragePath = fileName
  } else if (removeImage && currentPost?.image_storage_path) {
    // Remove existing image without replacing
    await supabase.storage.from("news-photos").remove([currentPost.image_storage_path])
    imageStoragePath = null
  }

  const postTitle = content.trim().slice(0, 80)
  const excerpt = content.trim().length > 150 ? content.trim().slice(0, 150) + "..." : null

  const updateData: Record<string, unknown> = {
    title: postTitle,
    content: content.trim(),
    excerpt,
    site_id: siteId || null,
  }

  if (imageStoragePath !== undefined) {
    updateData.image_storage_path = imageStoragePath
  }

  const { error } = await supabase
    .from("news_posts")
    .update(updateData)
    .eq("id", postId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath("/actualites")
  return { success: true }
}

export async function markNewsAsRead(notificationIds: string[]) {
  if (notificationIds.length === 0) return { success: true }

  const supabase = await createClient()

  const { error } = await supabase
    .from("client_notifications")
    .delete()
    .in("id", notificationIds)

  if (error) {
    console.error("Error marking news as read:", error)
    return { error: error.message }
  }

  revalidatePath("/compte")
  return { success: true }
}

export async function toggleNewsPin(postId: string, isPinned: boolean) {
  if (!postId) {
    return { error: "ID de l'actualité requis" }
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from("news_posts")
    .update({ is_pinned: isPinned })
    .eq("id", postId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin")
  revalidatePath("/actualites")
  return { success: true }
}

export async function deleteNewsPost(postId: string) {
  if (!postId) {
    return { error: "ID de l'actualité requis" }
  }

  const supabase = createAdminClient()

  // Fetch the post to get the image path for cleanup
  const { data: post } = await supabase
    .from("news_posts")
    .select("image_storage_path")
    .eq("id", postId)
    .single()

  // Delete the post
  const { error } = await supabase
    .from("news_posts")
    .delete()
    .eq("id", postId)

  if (error) {
    return { error: error.message }
  }

  // Cleanup image from storage if it existed
  if (post?.image_storage_path) {
    await supabase.storage.from("news-photos").remove([post.image_storage_path])
  }

  revalidatePath("/admin")
  revalidatePath("/actualites")
  return { success: true }
}
