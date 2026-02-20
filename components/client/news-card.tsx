"use client"

import { format, parseISO, formatDistanceToNow, differenceInDays } from "date-fns"
import { fr } from "date-fns/locale"
import { MapPin, Newspaper, Pencil, Pin, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { NewsPostWithSite } from "@/lib/types/database"

function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr)
  const daysDiff = differenceInDays(new Date(), date)
  if (daysDiff < 7) {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }
  return format(date, "d MMM yyyy", { locale: fr })
}

interface NewsCardProps {
  post: NewsPostWithSite
  variant?: "compact" | "full"
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
}

export function NewsCard({ post, variant = "compact", onEdit, onDelete }: NewsCardProps) {
  const formattedDate = post.published_at ? formatRelativeDate(post.published_at) : null

  if (variant === "compact") {
    return (
      <article className="relative rounded-[16px] bg-card p-4">
        <div className="flex gap-3">
          {post.image_url ? (
            <img
              src={post.image_url}
              alt=""
              className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
              <Newspaper className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {post.is_pinned && (
                <Pin className="h-3 w-3 flex-shrink-0 text-primary" />
              )}
              <h3 className="truncate text-sm font-semibold text-foreground">
                {post.title}
              </h3>
            </div>
            {post.excerpt && (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {post.excerpt}
              </p>
            )}
            <div className="mt-2 flex items-center gap-2 text-[10px] text-foreground/50">
              {formattedDate && <span>{formattedDate}</span>}
              {post.site_name && (
                <>
                  <span>·</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-2.5 w-2.5" />
                    <span>{post.site_name}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(post.id)}
                className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-primary/10 hover:text-primary"
                title="Modifier l'actualité"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(post.id)}
                className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                title="Supprimer l'actualité"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}
      </article>
    )
  }

  // Full variant for client news feed page
  return (
    <article className="overflow-hidden rounded-[20px] bg-card">
      {post.image_url && (
        <img
          src={post.image_url}
          alt=""
          className="h-48 w-full object-cover"
        />
      )}
      <div className="p-4 sm:p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {post.is_pinned && (
            <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
              <Pin className="h-2.5 w-2.5" />
              Épinglé
            </span>
          )}
          {post.site_name && (
            <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {post.site_name}
            </span>
          )}
        </div>
        <h2 className="font-header text-xl font-semibold text-foreground">
          {post.title}
        </h2>
        <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
          {post.content}
        </p>
        <div className="mt-4 flex items-center gap-2 text-xs text-foreground/50">
          {formattedDate && <span>{formattedDate}</span>}
        </div>
      </div>
    </article>
  )
}
