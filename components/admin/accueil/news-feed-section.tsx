"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { toast } from "sonner"
import { NewsCard } from "@/components/client/news-card"
import { deleteNewsPost } from "@/lib/actions/news"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { NewsPostWithSite } from "@/lib/types/database"

const POSTS_PER_PAGE = 3

interface NewsFeedSectionProps {
  posts: NewsPostWithSite[]
}

export function NewsFeedSection({ posts }: NewsFeedSectionProps) {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const visiblePosts = posts.slice(0, visibleCount)
  const hasMore = visibleCount < posts.length

  async function handleConfirmDelete() {
    if (!deletingId) return
    setIsDeleting(true)
    const result = await deleteNewsPost(deletingId)
    setIsDeleting(false)
    setDeletingId(null)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Actualité supprimée")
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded-lg bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Aucune actualité pour le moment.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-3">
          {visiblePosts.map((post) => (
            <NewsCard
              key={post.id}
              post={post}
              variant="compact"
              onDelete={(id) => setDeletingId(id)}
            />
          ))}
        </div>

        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + POSTS_PER_PAGE)}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-muted px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/70"
          >
            <span>Voir plus ({posts.length - visibleCount} restant{posts.length - visibleCount > 1 ? "s" : ""})</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        )}
      </div>

      <AlertDialog open={!!deletingId} onOpenChange={(open) => { if (!open) setDeletingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette actualité ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L&apos;actualité sera définitivement supprimée du fil d&apos;actualité.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
