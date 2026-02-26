"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, CalendarCheck, Circle, FileText, TicketIcon } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { createClient } from "@/lib/supabase/client"

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

// Type unifié pour tickets + contrats
type NotificationType = "ticket" | "contract" | "booking"

interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  subtitle: string | null
  siteName: string | null
  siteId: string | null
  statusLabel: string
  statusClassName: string
  updatedAt: string
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

const ticketStatusConfig: Record<string, { label: string; className: string }> = {
  todo: { label: "À traiter", className: "bg-yellow-100 text-yellow-700" },
  in_progress: { label: "En cours", className: "bg-blue-100 text-blue-700" },
  done: { label: "Résolu", className: "bg-green-100 text-green-700" },
}

const bookingStatusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmée", className: "bg-indigo-100 text-indigo-700" },
  pending: { label: "En attente", className: "bg-yellow-100 text-yellow-700" },
  cancelled: { label: "Annulée", className: "bg-gray-100 text-gray-500" },
}

const contractStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "bg-green-100 text-green-700" },
  suspended: { label: "Suspendu", className: "bg-yellow-100 text-yellow-700" },
  terminated: { label: "Résilié", className: "bg-gray-100 text-gray-500" },
}

async function fetchTickets(supabase: ReturnType<typeof createClient>, filterSiteId?: string | null): Promise<NotificationItem[]> {
  let query = supabase
    .from("support_tickets")
    .select(`
      id, subject, status, request_type, updated_at, created_at, site_id,
      user:users!user_id(first_name, last_name),
      site:sites!site_id(name)
    `)
    .in("status", ["todo", "in_progress"])
    .order("updated_at", { ascending: false })
    .limit(30)

  if (filterSiteId) {
    query = query.eq("site_id", filterSiteId)
  }

  const { data, error } = await query
  if (error) {
    console.error("Error fetching tickets:", error)
    return []
  }

  return (data ?? []).map((t: Record<string, unknown>) => {
    const user = t.user as { first_name: string | null; last_name: string | null } | null
    const site = t.site as { name: string } | null
    const status = ticketStatusConfig[t.status as string] ?? { label: t.status as string, className: "bg-muted text-muted-foreground" }
    const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ")

    return {
      id: `ticket-${t.id}`,
      type: "ticket" as NotificationType,
      title: (t.subject as string) ?? "Sans objet",
      subtitle: userName || null,
      siteName: site?.name ?? null,
      siteId: t.site_id as string | null,
      statusLabel: status.label,
      statusClassName: status.className,
      updatedAt: t.updated_at as string,
    }
  })
}

async function fetchContracts(supabase: ReturnType<typeof createClient>, filterSiteId?: string | null): Promise<NotificationItem[]> {
  let query = supabase
    .from("contracts")
    .select(`
      id, status, start_date, created_at, Number_of_seats,
      plans(name),
      companies!company_id(name, main_site_id, sites:sites!main_site_id(name))
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(20)

  const { data, error } = await query
  if (error) {
    console.error("Error fetching contracts:", error)
    return []
  }

  return (data ?? [])
    .filter((c: Record<string, unknown>) => {
      if (!filterSiteId) return true
      const company = c.companies as { main_site_id: string | null } | null
      return company?.main_site_id === filterSiteId
    })
    .map((c: Record<string, unknown>) => {
      const plan = c.plans as { name: string } | null
      const company = c.companies as { name: string; main_site_id: string | null; sites: { name: string } | null } | null
      const status = contractStatusConfig[c.status as string] ?? { label: c.status as string, className: "bg-muted text-muted-foreground" }
      const seats = c.Number_of_seats as number | null

      return {
        id: `contract-${c.id}`,
        type: "contract" as NotificationType,
        title: `Nouveau contrat : ${plan?.name ?? "Plan inconnu"}`,
        subtitle: company?.name ? `${company.name}${seats ? ` · ${seats} place${seats > 1 ? "s" : ""}` : ""}` : null,
        siteName: company?.sites?.name ?? null,
        siteId: company?.main_site_id ?? null,
        statusLabel: status.label,
        statusClassName: status.className,
        updatedAt: c.created_at as string,
      }
    })
}

async function fetchBookings(supabase: ReturnType<typeof createClient>, filterSiteId?: string | null): Promise<NotificationItem[]> {
  let query = supabase
    .from("bookings")
    .select(`
      id, status, start_date, end_date, seats_count, created_at, updated_at,
      user:users!user_id(first_name, last_name),
      resource:resources!resource_id(name, type, site_id, sites:sites!site_id(name))
    `)
    .in("status", ["confirmed", "pending"])
    .order("created_at", { ascending: false })
    .limit(30)

  const { data, error } = await query
  if (error) {
    console.error("Error fetching bookings:", error)
    return []
  }

  return (data ?? [])
    .filter((b: Record<string, unknown>) => {
      if (!filterSiteId) return true
      const resource = b.resource as { site_id: string | null } | null
      return resource?.site_id === filterSiteId
    })
    .map((b: Record<string, unknown>) => {
      const user = b.user as { first_name: string | null; last_name: string | null } | null
      const resource = b.resource as { name: string | null; type: string | null; site_id: string | null; sites: { name: string } | null } | null
      const status = bookingStatusConfig[b.status as string] ?? { label: b.status as string, className: "bg-muted text-muted-foreground" }
      const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ")
      const startDate = b.start_date as string | null

      return {
        id: `booking-${b.id}`,
        type: "booking" as NotificationType,
        title: `Réservation : ${resource?.name ?? "Ressource"}`,
        subtitle: userName ? `${userName}${startDate ? ` · ${new Date(startDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}` : ""}` : null,
        siteName: resource?.sites?.name ?? null,
        siteId: resource?.site_id ?? null,
        statusLabel: status.label,
        statusClassName: status.className,
        updatedAt: b.created_at as string,
      }
    })
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [lastReadAt, setLastReadAtState] = useState<string | null>(null)
  const hasBeenOpened = useRef(false)

  // Load lastReadAt from localStorage on mount (per-user)
  useEffect(() => {
    setLastReadAtState(getLastReadAt(userEmail))
  }, [userEmail])

  // Fetch sites pour le filtre
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

  const fetchAllNotifications = useCallback(async (filterSiteId?: string | null) => {
    const supabase = createClient()
    const [tickets, contracts, bookings] = await Promise.all([
      fetchTickets(supabase, filterSiteId),
      fetchContracts(supabase, filterSiteId),
      fetchBookings(supabase, filterSiteId),
    ])

    const merged = [...tickets, ...contracts, ...bookings].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    setNotifications(merged)
  }, [])

  // Fetch when modal opens or filter changes
  useEffect(() => {
    if (!open) return
    const filter = selectedSite !== "all" ? selectedSite : null
    fetchAllNotifications(filter)
  }, [open, selectedSite, fetchAllNotifications])

  // Compute unread count
  const computeUnreadCount = useCallback(
    (notifs: NotificationItem[], lastRead: string | null) => {
      return notifs.filter((n) => {
        if (!lastRead) return true
        return new Date(n.updatedAt) > new Date(lastRead)
      }).length
    },
    []
  )

  useEffect(() => {
    onUnreadCountChange?.(computeUnreadCount(notifications, lastReadAt))
  }, [notifications, lastReadAt, onUnreadCountChange, computeUnreadCount])

  // Fetch pour le badge au mount (scope = site de l'admin)
  useEffect(() => {
    fetchAllNotifications(siteId)
  }, [siteId, fetchAllNotifications])

  // Track ouverture
  useEffect(() => {
    if (open) {
      hasBeenOpened.current = true
    }
  }, [open])

  // Mark as read quand la modale se FERME
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
          </DialogTitle>
        </DialogHeader>

        {unreadCount > 0 && (
          <div className="flex items-center gap-2.5 rounded-lg border border-red-200/60 bg-red-500/[0.06] px-3 py-2.5">
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500/80 px-1.5 text-[11px] font-semibold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
            <span className="text-sm text-red-900/70">
              nouvelle{unreadCount > 1 ? "s" : ""} notification{unreadCount > 1 ? "s" : ""}
            </span>
          </div>
        )}

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
                const unreadNotifs = notifications.filter((n) => isUnread(n.updatedAt))
                const readNotifs = notifications.filter((n) => !isUnread(n.updatedAt))
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

  function renderNotif(notif: NotificationItem, unread: boolean) {
    const TypeIcon = notif.type === "contract" ? FileText : notif.type === "booking" ? CalendarCheck : TicketIcon

    return (
      <div
        key={notif.id}
        className={`flex items-start justify-between rounded-lg border p-3 text-sm transition-colors ${
          unread ? "border-primary/30 bg-primary/5" : ""
        }`}
      >
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {unread ? (
            <Circle className="mt-1 size-2 shrink-0 fill-red-500 text-red-500" />
          ) : (
            <TypeIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          )}
          <div className="flex flex-col gap-1 min-w-0">
            <span className={`truncate ${unread ? "font-semibold" : "font-medium"}`}>
              {notif.title}
            </span>
            {notif.subtitle && (
              <span className="text-muted-foreground text-xs truncate">
                {notif.subtitle}
              </span>
            )}
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              {notif.siteName && (
                <span className="truncate">{notif.siteName}</span>
              )}
              <span>
                {new Date(notif.updatedAt).toLocaleDateString("fr-FR", {
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
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${notif.statusClassName}`}
        >
          {notif.statusLabel}
        </span>
      </div>
    )
  }
}
