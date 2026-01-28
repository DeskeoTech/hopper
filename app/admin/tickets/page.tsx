import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { TicketsTable } from "@/components/admin/tickets/tickets-table"
import { TicketsSearch } from "@/components/admin/tickets/tickets-search"
import { CreateTicketModal } from "@/components/admin/tickets/create-ticket-modal"
import { Headphones } from "lucide-react"
import type { SupportTicketWithDetails } from "@/lib/types/database"

interface TicketsPageProps {
  searchParams: Promise<{ search?: string; status?: string; request_type?: string }>
}

export default async function TicketsPage({ searchParams }: TicketsPageProps) {
  const { search, status, request_type } = await searchParams
  const supabase = await createClient()

  // Build query for tickets with user and company details
  let query = supabase
    .from("support_tickets")
    .select(`
      *,
      user:users!user_id (
        first_name,
        last_name,
        email,
        company_id,
        company:companies!company_id (
          name
        )
      )
    `)
    .order("created_at", { ascending: false })

  // Apply search filter
  if (search) {
    query = query.or(`comment.ilike.%${search}%,freshdesk_ticket_id.ilike.%${search}%`)
  }

  // Apply status filter
  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  // Apply request type filter
  if (request_type && request_type !== "all") {
    query = query.eq("request_type", request_type)
  }

  const { data: tickets, error } = await query

  // Calculate statistics
  const allTicketsQuery = await supabase
    .from("support_tickets")
    .select("status")

  const allTickets = allTicketsQuery.data || []
  const totalCount = allTickets.length
  const openCount = allTickets.filter(t => t.status === "todo" || t.status === "in_progress").length
  const resolvedCount = allTickets.filter(t => t.status === "done").length

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des tickets: {error.message}</p>
      </div>
    )
  }

  // Transform tickets to include user details at top level
  const ticketsWithDetails: SupportTicketWithDetails[] = (tickets || []).map((ticket) => ({
    id: ticket.id,
    airtable_id: ticket.airtable_id,
    user_id: ticket.user_id,
    request_type: ticket.request_type,
    comment: ticket.comment,
    status: ticket.status,
    freshdesk_ticket_id: ticket.freshdesk_ticket_id,
    created_at: ticket.created_at,
    updated_at: ticket.updated_at,
    user_first_name: ticket.user?.first_name || null,
    user_last_name: ticket.user?.last_name || null,
    user_email: ticket.user?.email || null,
    company_id: ticket.user?.company_id || null,
    company_name: ticket.user?.company?.name || null,
  }))

  return (
    <div className="mx-auto max-w-[1325px] space-y-6 px-2 lg:px-3">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
            <Headphones className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="type-h2 text-foreground">Support Tickets</h1>
            <p className="mt-1 text-muted-foreground">Gérez les demandes de vos utilisateurs</p>
          </div>
        </div>
        <CreateTicketModal />
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Total</p>
          <p className="mt-1 text-2xl font-bold text-foreground">{totalCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Ouverts</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{openCount}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium text-muted-foreground">Résolus</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{resolvedCount}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-muted" />}>
        <TicketsSearch />
      </Suspense>

      {/* Tickets Table */}
      {ticketsWithDetails && ticketsWithDetails.length > 0 ? (
        <TicketsTable tickets={ticketsWithDetails} />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12">
          <Headphones className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {search || status || request_type ? "Aucun ticket ne correspond à vos critères" : "Aucun ticket trouvé"}
          </p>
        </div>
      )}
    </div>
  )
}
