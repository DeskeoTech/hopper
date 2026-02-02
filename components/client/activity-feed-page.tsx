"use client"

import { Newspaper } from "lucide-react"
import { NewsCard } from "./news-card"
import type { NewsPostWithSite } from "@/lib/types/database"

interface ActivityFeedPageProps {
  posts: NewsPostWithSite[]
}

export function ActivityFeedPage({ posts }: ActivityFeedPageProps) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Newspaper className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mt-6 type-h3 text-foreground">Fil d'actualité</h2>
        <p className="mt-2 max-w-md text-center type-body text-muted-foreground">
          Aucune actualité pour le moment.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-6 type-h2 text-foreground">Actualités</h1>
      <div className="space-y-4">
        {posts.map((post) => (
          <NewsCard key={post.id} post={post} variant="full" />
        ))}
      </div>
    </div>
  )
}
