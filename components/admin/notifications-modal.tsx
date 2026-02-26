"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, Circle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { createClient } from "@/lib/supabase/client"
import type { TicketStatus } from "@/lib/types/database"

interface NotificationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  siteId: string | null
  userEmail: string | null
  onUnreadCountChange?: (count: number) => void
}

interface SiteOption {
  value: string
  label: string
}

interface NotificationTicket {
  id: string
  subject: string | null
  status: TicketStatus | null
  request_type: string | null
  updated_at: string
  created_at: string
  site_id: string | null
  user: {
    first_name: string | null
    last_name: string | null
  } | null
  site: {
    name: string
  } | null
}

// Clé localStorage par utilisateur
function storageKey(email: string | null): string {
  const suffix = email ? `_${email}` : ""
  return `hopper_notifications_last_read${suffix}`
}

function getLastReadAt(email: string | null): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(storageKey(email))
}

function setLastReadAt(email: string | null, date: string) {
  if (typeof window === "undefined") return
  localStorage.setItem(storageKey(email), date)
}

const statusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: "À traiter", className: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  done: { label: "Résolu", className: "bg-green-100 text-green-700" },
}

export function NotificationsModal({
  open,
  onOpenChange,
  siteId,
  userEmail,
  onUnreadCountChange,
}: NotificationsModalProps) {
  const [sites, setSites] = useState<SiteOption[]>([])
  const [selectedSite, setSelectedSite] = useState<string>(siteId ?? "all")
  const [notifications, setNotifications] = useState<NotificationTicket[]>([])
  const [lastReadAt, setLastReadAtState] = useState<string | null>(null)
  const hasBeenOpened = useRef(false)

  // Load lastReadAt from localStorage on mount (per-user)
  useEffect(() => {
    setLastReadAtState(getLastReadAt(userEmail))
  }, [userEmail])

  // Fetch sites pour le filtre (toujours)
  useEffect(() => {
    if (!open) return

    async function fetchSites() {
      const supabase = createClient()
      const { data } = await supabase
        .from("sites")
        .select("id, name")
        .eq("status", "open")
        .order("name")

      if (data) {
        setSites(data.map((s) => ({ value: s.id, label: s.name })))
      }
    }

    fetchSites()
  }, [open])

  const fetchNotifications = useCallback(async () => {
    const supabase = createClient()

    let query = supabase
      .from("support_tickets")
      .select(`
        id, subject, status, request_type, updated_at, created_at, site_id,
        user:users!user_id(first_name, last_name),
        site:sites!site_id(name)
      `)
      .in("status", ["todo", "in_progress"])
      .order("updated_at", { ascending: false })
      .limit(50)

    if (selectedSite !== "all") {
      query = query.eq("site_id", selectedSite)
    }

    const { data, error } = await query
    if (error) console.error("Error fetching notifications:", error)
    if (data) setNotifications(data as NotificationTicket[])
  }, [selectedSite])

  // Fetch notifications when modal opens or filter changes
  useEffect(() => {
    if (!open) return
    fetchNotifications()
  }, [open, fetchNotifications])

  // Compute unread count and report to parent (basé sur le scope du site admin)
  const computeUnreadCount = useCallback(
    (notifs: NotificationTicket[], lastRead: string | null) => {
      return notifs.filter((n) => {
        if (!lastRead) return true
        return new Date(n.updated_at) > new Date(lastRead)
      }).length
    },
    []
  )

  useEffect(() => {
    onUnreadCountChange?.(computeUnreadCount(notifications, lastReadAt))
  }, [notifications, lastReadAt, onUnreadCountChange, computeUnreadCount])

  // Fetch pour le badge au mount (scope = site de l'admin)
  useEffect(() => {
    async function fetchForBadge() {
      const supabase = createClient()

      let query = supabase
        .from("support_tickets")
        .select(`
          id, subject, status, request_type, updated_at, created_at, site_id,
          user:users!user_id(first_name, last_name),
          site:sites!site_id(name)
        `)
        .in("status", ["todo", "in_progress"])
        .order("updated_at", { ascending: false })
        .limit(50)

      // Badge count = scope de l'admin (son site ou tous)
      if (siteId) {
        query = query.eq("site_id", siteId)
      }

      const { data } = await query
      if (data) {
        setNotifications(data as NotificationTicket[])
      }
    }

    fetchForBadge()
  }, [siteId])

  // Track quand la modale a été ouverte au moins une fois
  useEffect(() => {
    if (open) {
      hasBeenOpened.current = true
    }
  }, [open])

  // Mark as read uniquement quand la modale se FERME (open→closed)
  useEffect(() => {
    if (!open && hasBeenOpened.current) {
      hasBeenOpened.current = false
      const now = new Date().toISOString()
      setLastReadAt(userEmail, now)
      setLastReadAtState(now)
    }
  }, [open, userEmail])

  const isUnread = (updatedAt: string) => {
    if (!lastReadAt) return true
    return new Date(updatedAt) > new Date(lastReadAt)
  }

  const unreadCount = computeUnreadCount(notifications, lastReadAt)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-medium text-white">
                {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <SearchableSelect
            options={[{ value: "all", label: "Tous les sites" }, ...sites]}
            value={selectedSite}
            onValueChange={setSelectedSite}
            placeholder="Filtrer par site"
          />

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bell className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Aucune notification pour le moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {(() => {
                const unreadNotifs = notifications.filter((n) => isUnread(n.updated_at))
                const readNotifs = notifications.filter((n) => !isUnread(n.updated_at))
                const sections: React.ReactNode[] = []

                if (unreadNotifs.length > 0) {
                  sections.push(
                    <p key="new-label" className="text-xs font-medium text-muted-foreground px-1">
                      Nouvelles
                    </p>
                  )
                  sections.push(...unreadNotifs.map((n) => renderNotif(n, true)))
                }

                if (readNotifs.length > 0) {
                  sections.push(
                    <p key="old-label" className="text-xs font-medium text-muted-foreground px-1 pt-2">
                      Plus anciennes
                    </p>
                  )
                  sections.push(...readNotifs.map((n) => renderNotif(n, false)))
                }

                return sections
              })()}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )

  function renderNotif(notif: NotificationTicket, unread: boolean) {
    const status = statusConfig[notif.status ?? ""] ?? {
      label: notif.status,
      className: "bg-muted text-muted-foreground",
    }
    const userName = [notif.user?.first_name, notif.user?.last_name]
      .filter(Boolean)
      .join(" ")

    return (
      <div
        key={notif.id}
        className={`flex items-start justify-between rounded-lg border p-3 text-sm transition-colors ${
          unread ? "border-primary/30 bg-primary/5" : ""
        }`}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {unread && (
            <Circle className="mt-1 size-2 shrink-0 fill-red-500 text-red-500" />
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <span className={`truncate ${unread ? "font-semibold" : "font-medium"}`}>
              {notif.subject ?? "Sans objet"}
            </span>
            {userName && (
              <span className="text-muted-foreground text-xs truncate">
                {userName}
              </span>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              {notif.site?.name && (
                <span className="truncate">{notif.site.name}</span>
              )}
              <span>
                {new Date(notif.updated_at).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>
    )
  }
}
