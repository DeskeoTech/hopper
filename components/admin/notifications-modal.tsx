"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Bell, CalendarDays, Clock, FileText, CalendarCheck, TicketIcon, CheckCheck, MapPin, ChevronDown, ArrowLeft, Loader2, User, Building2, MapPinIcon, Tag } from "lucide-react"
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

// Detail interfaces
interface TicketDetail {
  type: "ticket"
  subject: string | null
  comment: string | null
  status: string | null
  request_type: string | null
  request_subtype: string | null
  created_at: string
  updated_at: string
  userName: string | null
  userEmail: string | null
  companyName: string | null
  siteName: string | null
  freshdesk_ticket_id: string | null
}

interface BookingDetail {
  type: "booking"
  start_date: string
  end_date: string
  status: string | null
  seats_count: number | null
  credits_used: number | null
  notes: string | null
  created_at: string
  userName: string | null
  userEmail: string | null
  companyName: string | null
  resourceName: string | null
  resourceType: string | null
  siteName: string | null
}

interface ContractDetail {
  type: "contract"
  status: string | null
  start_date: string | null
  end_date: string | null
  number_of_seats: number | null
  created_at: string
  planName: string | null
  pricePerSeatMonth: number | null
  companyName: string | null
  siteName: string | null
}

type DetailData = TicketDetail | BookingDetail | ContractDetail

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

const requestTypeLabels: Record<string, string> = {
  administratif: "Administratif",
  ascenseurs: "Ascenseurs",
  audiovisuel: "Audiovisuel",
  autre: "Autre",
  badges: "Badges",
  catering: "Catering",
  chauffage: "Chauffage",
  climatisation: "Climatisation",
  code_acces: "Code d'accès",
  electricite: "Électricité",
  electromenager: "Électroménager",
  espaces_verts: "Espaces verts",
  fenetres: "Fenêtres",
  finance: "Finance",
  fontaine_eau: "Fontaine à eau",
  immeuble: "Immeuble",
  imprimantes: "Imprimantes",
  internet_reseau: "Internet / Réseau",
  interphone: "Interphone",
  isolation_phonique: "Isolation phonique",
  juridique: "Juridique",
  menage: "Ménage",
  nuisances: "Nuisances",
  nuisibles: "Nuisibles",
  plomberie: "Plomberie",
  portes: "Portes",
  ssi: "SSI",
  videosurveillance_alarme: "Vidéosurveillance / Alarme",
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

// Detail fetch functions
async function fetchTicketDetail(supabase: ReturnType<typeof createClient>, ticketId: string): Promise<TicketDetail | null> {
  const { data, error } = await supabase
    .from("support_tickets")
    .select(`
      id, subject, comment, status, request_type, request_subtype, created_at, updated_at, freshdesk_ticket_id,
      user:users!user_id(first_name, last_name, email, company_id, companies:companies!company_id(name)),
      site:sites!site_id(name)
    `)
    .eq("id", ticketId)
    .single()

  if (error || !data) return null

  const user = data.user as { first_name: string | null; last_name: string | null; email: string | null; companies: { name: string } | null } | null
  const site = data.site as { name: string } | null

  return {
    type: "ticket",
    subject: data.subject as string | null,
    comment: data.comment as string | null,
    status: data.status as string | null,
    request_type: data.request_type as string | null,
    request_subtype: data.request_subtype as string | null,
    created_at: data.created_at as string,
    updated_at: data.updated_at as string,
    userName: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
    userEmail: user?.email ?? null,
    companyName: user?.companies?.name ?? null,
    siteName: site?.name ?? null,
    freshdesk_ticket_id: data.freshdesk_ticket_id as string | null,
  }
}

async function fetchBookingDetail(supabase: ReturnType<typeof createClient>, bookingId: string): Promise<BookingDetail | null> {
  const { data, error } = await supabase
    .from("bookings")
    .select(`
      id, start_date, end_date, status, seats_count, credits_used, notes, created_at,
      user:users!user_id(first_name, last_name, email, company_id, companies:companies!company_id(name)),
      resource:resources!resource_id(name, type, site_id, sites:sites!site_id(name))
    `)
    .eq("id", bookingId)
    .single()

  if (error || !data) return null

  const user = data.user as { first_name: string | null; last_name: string | null; email: string | null; companies: { name: string } | null } | null
  const resource = data.resource as { name: string | null; type: string | null; sites: { name: string } | null } | null

  return {
    type: "booking",
    start_date: data.start_date as string,
    end_date: data.end_date as string,
    status: data.status as string | null,
    seats_count: data.seats_count as number | null,
    credits_used: data.credits_used as number | null,
    notes: data.notes as string | null,
    created_at: data.created_at as string,
    userName: [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null,
    userEmail: user?.email ?? null,
    companyName: user?.companies?.name ?? null,
    resourceName: resource?.name ?? null,
    resourceType: resource?.type ? (resourceTypeLabels[resource.type] || resource.type) : null,
    siteName: resource?.sites?.name ?? null,
  }
}

async function fetchContractDetail(supabase: ReturnType<typeof createClient>, contractId: string): Promise<ContractDetail | null> {
  const { data, error } = await supabase
    .from("contracts")
    .select(`
      id, status, start_date, end_date, Number_of_seats, created_at,
      plans(name, price_per_seat_month),
      companies!company_id(name, main_site_id, sites:sites!main_site_id(name))
    `)
    .eq("id", contractId)
    .single()

  if (error || !data) return null

  const plan = data.plans as { name: string; price_per_seat_month: number | null } | null
  const company = data.companies as { name: string; sites: { name: string } | null } | null

  return {
    type: "contract",
    status: data.status as string | null,
    start_date: data.start_date as string | null,
    end_date: data.end_date as string | null,
    number_of_seats: data.Number_of_seats ? Number(data.Number_of_seats) : null,
    created_at: data.created_at as string,
    planName: plan?.name ?? null,
    pricePerSeatMonth: plan?.price_per_seat_month ?? null,
    companyName: company?.name ?? null,
    siteName: company?.sites?.name ?? null,
  }
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

  // Detail panel state
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null)
  const [detailData, setDetailData] = useState<DetailData | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

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
      // Reset detail view when modal closes
      setSelectedNotif(null)
      setDetailData(null)
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

  // Reset detail view when tab or site filter changes
  const handleTabChange = (tab: FilterTab) => {
    setFilterTab(tab)
    setSelectedNotif(null)
    setDetailData(null)
  }

  const handleSiteChange = (site: string) => {
    setSelectedSite(site)
    setSiteDropdownOpen(false)
    setSelectedNotif(null)
    setDetailData(null)
  }

  // Handle notification click
  const handleNotifClick = async (notif: NotificationItem) => {
    setSelectedNotif(notif)
    setDetailData(null)
    setDetailLoading(true)

    const supabase = createClient()
    let data: DetailData | null = null

    if (notif.type === "ticket") {
      data = await fetchTicketDetail(supabase, notif.sourceId)
    } else if (notif.type === "booking") {
      data = await fetchBookingDetail(supabase, notif.sourceId)
    } else if (notif.type === "contract") {
      data = await fetchContractDetail(supabase, notif.sourceId)
    }

    setDetailData(data)
    setDetailLoading(false)
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
        {selectedNotif ? (
          // Detail view
          <>
            {/* Detail header */}
            <div className="px-6 pb-4 pt-6">
              <button
                type="button"
                onClick={() => { setSelectedNotif(null); setDetailData(null) }}
                className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour aux notifications
              </button>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full",
                  selectedNotif.type === "contract" ? "bg-[#221D1A]/5" :
                  selectedNotif.type === "booking" ? "bg-amber-50" : "bg-purple-50"
                )}>
                  {selectedNotif.type === "contract" ? <FileText className="h-5 w-5 text-[#221D1A]" /> :
                   selectedNotif.type === "booking" ? <CalendarCheck className="h-5 w-5 text-amber-500" /> :
                   <TicketIcon className="h-5 w-5 text-purple-500" />}
                </div>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-lg font-semibold text-foreground">{selectedNotif.title}</DialogTitle>
                  {selectedNotif.subtitle && (
                    <p className="text-sm text-muted-foreground">{selectedNotif.subtitle}</p>
                  )}
                </div>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase", selectedNotif.statusClassName)}>
                  {selectedNotif.statusLabel}
                </span>
              </div>
            </div>

            {/* Detail content */}
            <div className="max-h-[400px] overflow-y-auto border-t border-gray-100 px-6 py-5">
              {detailLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : detailData ? (
                renderDetailContent(detailData)
              ) : (
                <p className="py-8 text-center text-sm text-muted-foreground">Impossible de charger les détails.</p>
              )}
            </div>
          </>
        ) : (
          // List view
          <>
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
                          onClick={() => handleSiteChange(site.value)}
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
                  onClick={() => handleTabChange(tab.value)}
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
          </>
        )}
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
      <button
        type="button"
        key={notif.id}
        onClick={() => handleNotifClick(notif)}
        className={cn(
          "flex w-full items-start gap-3 border-b border-gray-50 px-6 py-4 text-left transition-colors hover:bg-gray-50/50",
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
      </button>
    )
  }

  function renderDetailContent(data: DetailData) {
    if (data.type === "ticket") return renderTicketDetail(data)
    if (data.type === "booking") return renderBookingDetail(data)
    if (data.type === "contract") return renderContractDetail(data)
    return null
  }

  function renderDetailField(label: string, value: string | null | undefined, icon?: React.ReactNode) {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-center gap-1.5">
          {icon}
          <p className="text-sm">{value || "-"}</p>
        </div>
      </div>
    )
  }

  function renderTicketDetail(data: TicketDetail) {
    const statusConfig = ticketStatusConfig[data.status ?? ""] ?? { label: data.status, className: "border border-gray-200 text-gray-400 bg-gray-50" }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date de création</p>
            <div className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{format(new Date(data.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Statut</p>
            <div className="mt-1">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusConfig.className)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Utilisateur</p>
            <div className="mt-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">{data.userName || "-"}</p>
                {data.userEmail && <p className="text-xs text-muted-foreground">{data.userEmail}</p>}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Entreprise</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{data.companyName || "-"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {renderDetailField("Site", data.siteName, <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />)}
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Type</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Tag className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-sm">{data.request_type ? (requestTypeLabels[data.request_type] || data.request_type) : "-"}</p>
                {data.request_subtype && <p className="text-xs text-muted-foreground">{data.request_subtype}</p>}
              </div>
            </div>
          </div>
        </div>

        {data.subject && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sujet</p>
            <p className="mt-1 text-sm">{data.subject}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</p>
          <div className="mt-1 rounded-lg bg-muted/50 p-3">
            <p className="whitespace-pre-wrap text-sm">{data.comment || "Aucune description"}</p>
          </div>
        </div>

        {data.freshdesk_ticket_id && (
          <div className="pt-1">
            <a
              href={`https://mydeskeosupport.freshdesk.com/a/tickets/${data.freshdesk_ticket_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#221D1A] underline underline-offset-2 hover:text-[#221D1A]/80"
            >
              Voir dans Freshdesk
            </a>
          </div>
        )}
      </div>
    )
  }

  function renderBookingDetail(data: BookingDetail) {
    const statusConfig = bookingStatusConfig[data.status ?? ""] ?? { label: data.status, className: "border border-gray-200 text-gray-400 bg-gray-50" }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Début</p>
            <div className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{format(new Date(data.start_date), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Fin</p>
            <div className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{format(new Date(data.end_date), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Statut</p>
            <div className="mt-1">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusConfig.className)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          {renderDetailField("Ressource", data.resourceName)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Utilisateur</p>
            <div className="mt-1 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <div>
                <p className="text-sm font-semibold">{data.userName || "-"}</p>
                {data.userEmail && <p className="text-xs text-muted-foreground">{data.userEmail}</p>}
              </div>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Entreprise</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{data.companyName || "-"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {renderDetailField("Type de ressource", data.resourceType)}
          {renderDetailField("Site", data.siteName, <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {renderDetailField("Places", data.seats_count?.toString())}
          {renderDetailField("Crédits utilisés", data.credits_used?.toString())}
        </div>

        {data.notes && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Notes</p>
            <div className="mt-1 rounded-lg bg-muted/50 p-3">
              <p className="whitespace-pre-wrap text-sm">{data.notes}</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  function renderContractDetail(data: ContractDetail) {
    const statusConfig = contractStatusConfig[data.status ?? ""] ?? { label: data.status, className: "border border-gray-200 text-gray-400 bg-gray-50" }

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Statut</p>
            <div className="mt-1">
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", statusConfig.className)}>
                {statusConfig.label}
              </span>
            </div>
          </div>
          {renderDetailField("Plan", data.planName)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Entreprise</p>
            <div className="mt-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{data.companyName || "-"}</p>
            </div>
          </div>
          {renderDetailField("Site", data.siteName, <MapPinIcon className="h-3.5 w-3.5 text-muted-foreground" />)}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date de début</p>
            <div className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{data.start_date ? format(new Date(data.start_date), "dd/MM/yyyy", { locale: fr }) : "-"}</p>
            </div>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date de fin</p>
            <div className="mt-1 flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-sm">{data.end_date ? format(new Date(data.end_date), "dd/MM/yyyy", { locale: fr }) : "-"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {renderDetailField("Postes de travail", data.number_of_seats?.toString())}
          {renderDetailField("Prix / poste / mois", data.pricePerSeatMonth ? `${data.pricePerSeatMonth} €` : null)}
        </div>

        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date de création</p>
          <div className="mt-1 flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <p className="text-sm">{format(new Date(data.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
          </div>
        </div>
      </div>
    )
  }
}
