"use client"

import { useState, useRef, useEffect } from "react"
import { format, parseISO, formatDistanceToNow, differenceInDays } from "date-fns"
import { MapPin, Newspaper, Pencil, Pin, Trash2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"
import { getDateLocale } from "@/lib/i18n/date-locale"
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import type { NewsPostWithSite } from "@/lib/types/database"

interface NewsCardProps {
  post: NewsPostWithSite
  variant?: "compact" | "full"
  isUnread?: boolean
  onEdit?: (postId: string) => void
  onDelete?: (postId: string) => void
  onTogglePin?: (postId: string, isPinned: boolean) => void
}

export function NewsCard({ post, variant = "compact", isUnread = false, onEdit, onDelete, onTogglePin }: NewsCardProps) {
  const t = useTranslations("dashboard.news")
  const locale = useLocale()
  const dateLocale = getDateLocale(locale)
  const [expanded, setExpanded] = useState(false)
  const [isClamped, setIsClamped] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const textRef = useRef<HTMLParagraphElement>(null)

  useEffect(() => {
    const el = textRef.current
    if (el && variant === "compact" && !expanded) {
      setIsClamped(el.scrollHeight > el.clientHeight)
    }
  }, [post.content, variant, expanded])

  const formattedDate = post.published_at
    ? (() => {
        const date = parseISO(post.published_at)
        const daysDiff = differenceInDays(new Date(), date)
        if (daysDiff < 7) {
          return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })
        }
        return format(date, "d MMM yyyy", { locale: dateLocale })
      })()
    : null

  const imageLightbox = post.image_url ? (
    <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
      <DialogPortal>
        <DialogOverlay className="cursor-zoom-out" onClick={() => setLightboxOpen(false)} />
        <DialogPrimitive.Content
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setLightboxOpen(false)}
        >
          <DialogPrimitive.Title className="sr-only">
            {t("imagePreview")}
          </DialogPrimitive.Title>
          <img
            src={post.image_url}
            alt=""
            className="max-h-[90vh] max-w-[90vw] rounded-[12px] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <DialogPrimitive.Close className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70 focus:outline-none">
            <X className="h-5 w-5" />
            <span className="sr-only">Fermer</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  ) : null

  if (variant === "compact") {
    return (
      <>
        <article className="relative rounded-[16px] bg-card p-4">
          <div className="flex gap-3">
            {post.image_url ? (
              <img
                src={post.image_url}
                alt=""
                className="h-16 w-16 flex-shrink-0 cursor-pointer rounded-lg object-cover"
                onClick={() => setLightboxOpen(true)}
              />
            ) : (
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                <Newspaper className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              {post.is_pinned && !onTogglePin && (
                <Pin className="h-3 w-3 flex-shrink-0 text-primary mb-1" />
              )}
              <p
                ref={textRef}
                className={cn("text-sm text-foreground", !expanded && "line-clamp-3")}
              >
                {post.content || post.title}
              </p>
              {isClamped && (
                <button
                  type="button"
                  onClick={() => setExpanded(!expanded)}
                  className="mt-1 text-xs font-medium text-primary hover:underline"
                >
                  {expanded ? "Voir moins" : "Voir plus"}
                </button>
              )}
              <div className="mt-2 flex items-center gap-2 text-[10px] text-foreground/50">
                {(post.author_first_name || post.author_last_name) && (
                  <span className="font-medium">
                    {[post.author_first_name, post.author_last_name].filter(Boolean).join(" ")}
                  </span>
                )}
                {(post.author_first_name || post.author_last_name) && formattedDate && <span>·</span>}
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
          {(onEdit || onDelete || onTogglePin) && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1">
              {onTogglePin && (
                <button
                  type="button"
                  onClick={() => onTogglePin(post.id, !post.is_pinned)}
                  className={cn(
                    "rounded-full p-1.5 transition-colors",
                    post.is_pinned
                      ? "text-primary hover:bg-primary/10"
                      : "text-muted-foreground/50 hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Pin className="h-3.5 w-3.5" fill={post.is_pinned ? "currentColor" : "none"} />
                </button>
              )}
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(post.id)}
                  className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(post.id)}
                  className="rounded-full p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          )}
        </article>
        {imageLightbox}
      </>
    )
  }

  // Full variant for client news feed page
  return (
    <>
      <article className={cn(
        "relative overflow-hidden rounded-[20px] bg-card",
        isUnread && "bg-foreground/[0.03] ring-1 ring-foreground/10"
      )}>
        {isUnread && (
          <div className="absolute left-2 top-3 bottom-3 w-1 rounded-full bg-[#DC2626]" />
        )}
        {post.image_url && (
          <img
            src={post.image_url}
            alt=""
            className="h-48 w-full cursor-pointer object-cover"
            onClick={() => setLightboxOpen(true)}
          />
        )}
        <div className="p-4 sm:p-6">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {post.is_pinned && (
              <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                <Pin className="h-2.5 w-2.5" />
                {t("pinned")}
              </span>
            )}
            {post.site_name && (
              <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                <MapPin className="h-2.5 w-2.5" />
                {post.site_name}
              </span>
            )}
          </div>
          <p className={cn("whitespace-pre-line text-sm text-foreground", isUnread && "font-semibold")}>
            {post.content}
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-foreground/50">
            {(post.author_first_name || post.author_last_name) && (
              <span className="font-medium">
                {[post.author_first_name, post.author_last_name].filter(Boolean).join(" ")}
              </span>
            )}
            {(post.author_first_name || post.author_last_name) && formattedDate && <span>·</span>}
            {formattedDate && <span>{formattedDate}</span>}
          </div>
        </div>
      </article>
      {imageLightbox}
    </>
  )
}
