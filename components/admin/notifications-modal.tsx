"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, CalendarDays, Clock, FileText, CalendarCheck, TicketIcon, CheckCheck, MapPin, ChevronDown } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

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

type NotificationType = "ticket" | "contract" | "booking"
type FilterTab = "all" | "contract" | "booking" | "ticket"

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
  pinned: boolean
  sourceId: string
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
  todo: { label: "À traiter", className: "border border-yellow-200 text-yellow-600 bg-yellow-50" },
  in_progress: { label: "En cours", className: "border border-[#221D1A]/20 text-[#221D1A] bg-[#221D1A]/5" },
  done: { label: "Résolu", className: "border border-green-200 text-green-600 bg-green-50" },
}

const bookingStatusConfig: Record<string, { label: string; className: string }> = {
  confirmed: { label: "Confirmée", className: "border border-[#221D1A]/20 text-[#221D1A] bg-[#221D1A]/5" },
  pending: { label: "En attente", className: "border border-yellow-200 text-yellow-600 bg-yellow-50" },
  cancelled: { label: "Annulée", className: "border border-gray-200 text-gray-400 bg-gray-50" },
}

const contractStatusConfig: Record<string, { label: string; className: string }> = {
  active: { label: "Actif", className: "border border-green-200 text-green-600 bg-green-50" },
  suspended: { label: "Suspendu", className: "border border-yellow-200 text-yellow-600 bg-yellow-50" },
  terminated: { label: "Terminé", className: "border border-gray-200 text-gray-400 bg-gray-50" },
}

const resourceTypeLabels: Record<string, string> = {
  meeting_room: "Salle de réunion",
  flex_desk: "Poste flexible",
  bench: "Espace ouvert",
  fixed_desk: "Poste fixe",
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
    const status = ticketStatusConfig[t.status as string] ?? { label: t.status as string, className: "border border-gray-200 text-gray-400 bg-gray-50" }
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
      pinned: false,
      sourceId: t.id as string,
    }
  })
}

async function fetchContracts(supabase: ReturnType<typeof createClient>, filterSiteId?: string | null): Promise<NotificationItem[]> {
  const query = supabase
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
      const status = contractStatusConfig[c.status as string] ?? { label: c.status as string, className: "border border-gray-200 text-gray-400 bg-gray-50" }
      const seats = c.Number_of_seats as number | null

      return {
        id: `contract-${c.id}`,
        type: "contract" as NotificationType,
        title: `Nouveau contrat : ${plan?.name ?? "Plan inconnu"}`,
        subtitle: company?.name ? `${company.name}${seats ? ` \u00B7 ${seats} poste${seats > 1 ? "s" : ""} de travail` : ""}` : null,
        siteName: company?.sites?.name ?? null,
        siteId: company?.main_site_id ?? null,
        statusLabel: status.label,
        statusClassName: status.className,
        updatedAt: c.created_at as string,
        pinned: false,
        sourceId: c.id as string,
      }
    })
}

async function fetchBookings(supabase: ReturnType<typeof createClient>, filterSiteId?: string | null): Promise<NotificationItem[]> {
  const query = supabase
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
      const status = bookingStatusConfig[b.status as string] ?? { label: b.status as string, className: "border border-gray-200 text-gray-400 bg-gray-50" }
      const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ")
      const seats = b.seats_count as number | null
      const resourceType = resource?.type ? (resourceTypeLabels[resource.type] || resource.type) : null

      return {
        id: `booking-${b.id}`,
        type: "booking" as NotificationType,
        title: `Réservation : ${userName || resource?.name || "Réservation"}`,
        subtitle: resourceType ? `${resourceType}${seats ? ` \u00B7 ${seats} personne${seats > 1 ? "s" : ""}` : ""}` : null,
        siteName: resource?.sites?.name ?? null,
        siteId: resource?.site_id ?? null,
        statusLabel: status.label,
        statusClassName: status.className,
        updatedAt: b.created_at as string,
        pinned: false,
        sourceId: b.id as string,
      }
    })
}

const TABS: { value: FilterTab; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "contract", label: "Contrats" },
  { value: "booking", label: "Réservations" },
  { value: "ticket", label: "Tickets" },
]

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
  const [filterTab, setFilterTab] = useState<FilterTab>("all")
  const [siteDropdownOpen, setSiteDropdownOpen] = useState(false)
  const hasBeenOpened = useRef(false)

  // Load lastReadAt from localStorage on mount
  useEffect(() => {
    setLastReadAtState(getLastReadAt(userEmail))
  }, [userEmail])

  // Fetch sites
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
        setSites(data.map((s: { id: string; name: string }) => ({ value: s.id, label: s.name })))
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

    const merged = [...tickets, ...contracts, ...bookings]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

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

  // Fetch for badge on mount
  useEffect(() => {
    fetchAllNotifications(siteId)
  }, [siteId, fetchAllNotifications])

  // Track opening
  useEffect(() => {
    if (open) {
      hasBeenOpened.current = true
    }
  }, [open])

  // Mark as read when modal closes
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

  const handleMarkAllRead = () => {
    const now = new Date().toISOString()
    setLastReadAt(userEmail, now)
    setLastReadAtState(now)
  }

  // Filter by tab
  const filteredNotifications = filterTab === "all"
    ? notifications
    : notifications.filter(n => n.type === filterTab)

  const allSiteOptions: SiteOption[] = [{ value: "all", label: "Tous les sites" }, ...sites]
  const selectedSiteLabel = allSiteOptions.find(s => s.value === selectedSite)?.label || "Tous les sites"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] gap-0 overflow-hidden p-0" aria-describedby={undefined}>
        {/* Header */}
        <div className="px-6 pb-4 pt-6">
          <div className="flex items-center gap-3 pr-14">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#221D1A]/5">
              <Bell className="h-5 w-5 text-[#221D1A]" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold text-foreground">Notifications</DialogTitle>
              <p className="text-sm text-muted-foreground">Gérez vos activités récentes</p>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex items-center justify-between px-6 pb-4">
          {/* Site dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setSiteDropdownOpen(!siteDropdownOpen)}
              className="flex items-center gap-2 rounded-full border border-gray-200 bg-card px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-card/80"
            >
              <MapPin className="h-3.5 w-3.5 text-[#221D1A]" />
              {selectedSiteLabel}
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", siteDropdownOpen && "rotate-180")} />
            </button>
            {siteDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSiteDropdownOpen(false)} />
                <div className="absolute left-0 top-full z-20 mt-1 max-h-48 w-48 overflow-y-auto rounded-xl border border-gray-100 bg-card py-1 shadow-lg">
                  {allSiteOptions.map(site => (
                    <button
                      key={site.value}
                      type="button"
                      className={cn(
                        "w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50",
                        selectedSite === site.value && "bg-[#221D1A]/5 font-medium text-[#221D1A]"
                      )}
                      onClick={() => {
                        setSelectedSite(site.value)
                        setSiteDropdownOpen(false)
                      }}
                    >
                      {site.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Mark all as read */}
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 text-sm font-medium text-[#221D1A] transition-colors hover:text-[#221D1A]/80"
          >
            <CheckCheck className="h-4 w-4" />
            Tout marquer comme lu
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {TABS.map(tab => (
            <button
              key={tab.value}
              type="button"
              className={cn(
                "relative px-4 py-2.5 text-sm font-medium transition-colors",
                filterTab === tab.value
                  ? "text-[#221D1A]"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setFilterTab(tab.value)}
            >
              {tab.label}
              {filterTab === tab.value && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#221D1A]" />
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-50">
              <Bell className="h-7 w-7 text-gray-300" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </p>
          </div>
        ) : (
          <div className="max-h-[380px] overflow-y-auto">
            {filteredNotifications.map((notif) => {
              const unread = isUnread(notif.updatedAt)
              return renderNotifItem(notif, unread)
            })}
          </div>
        )}

        {/* Footer */}
        <div className="p-4">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full rounded-[12px] bg-[#221D1A] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#221D1A]/90"
          >
            Voir toutes les notifications
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )

  function renderNotifItem(notif: NotificationItem, unread: boolean) {
    const TypeIcon = notif.type === "contract"
      ? FileText
      : notif.type === "booking"
        ? CalendarCheck
        : TicketIcon

    const iconBgClass = notif.type === "contract"
      ? "bg-[#221D1A]/5"
      : notif.type === "booking"
        ? "bg-amber-50"
        : "bg-purple-50"

    const iconTextClass = notif.type === "contract"
      ? "text-[#221D1A]"
      : notif.type === "booking"
        ? "text-amber-500"
        : "text-purple-500"

    const date = new Date(notif.updatedAt)

    return (
      <div
        key={notif.id}
        className={cn(
          "flex items-start gap-3 border-b border-gray-50 px-6 py-4",
          unread && "border-l-[3px] border-l-[#221D1A] bg-[#221D1A]/5"
        )}
      >
        {/* Icon */}
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-full", iconBgClass)}>
          <TypeIcon className={cn("h-4.5 w-4.5", iconTextClass)} />
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className={cn("text-sm text-foreground", unread ? "font-semibold" : "font-medium")}>
            {notif.title}
          </p>
          {notif.subtitle && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {notif.subtitle}
            </p>
          )}
          <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground/60">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3 w-3" />
              {format(date, "d MMM yyyy", { locale: fr })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(date, "HH:mm")}
            </span>
          </div>
        </div>

        {/* Status badge + unread dot */}
        <div className="flex shrink-0 items-center gap-2">
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", notif.statusClassName)}>
            {notif.statusLabel}
          </span>
          {unread && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-[#221D1A]" />
          )}
        </div>
      </div>
    )
  }
}
