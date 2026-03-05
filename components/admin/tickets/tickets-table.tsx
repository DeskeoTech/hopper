"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, ExternalLink, Eye, Send, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { SupportTicketWithDetails, TicketStatus } from "@/lib/types/database"
import { getRequestTypeLabel, getSubtypeLabel } from "@/lib/constants/ticket-options"
import { replyToFreshdeskTicket } from "@/lib/actions/tickets"

type SortField = "created_at" | "status" | "request_type" | "user_name" | "company_name" | "site_name"
type SortOrder = "asc" | "desc"

const PAGE_SIZE = 15

interface TicketsTableProps {
  tickets: SupportTicketWithDetails[]
}

export function TicketsTable({ tickets }: TicketsTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketWithDetails | null>(null)
  const [replyBody, setReplyBody] = useState("")
  const [replySending, setReplySending] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "created_at":
          aValue = new Date(a.created_at).getTime()
          bValue = new Date(b.created_at).getTime()
          break
        case "status":
          aValue = a.status || ""
          bValue = b.status || ""
          break
        case "request_type":
          aValue = a.request_type || ""
          bValue = b.request_type || ""
          break
        case "user_name":
          aValue = `${a.user_first_name || ""} ${a.user_last_name || ""}`.toLowerCase()
          bValue = `${b.user_first_name || ""} ${b.user_last_name || ""}`.toLowerCase()
          break
        case "company_name":
          aValue = (a.company_name || "").toLowerCase()
          bValue = (b.company_name || "").toLowerCase()
          break
        case "site_name":
          aValue = (a.site_name || "").toLowerCase()
          bValue = (b.site_name || "").toLowerCase()
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [tickets, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedTickets.length / PAGE_SIZE)
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedTickets.slice(start, start + PAGE_SIZE)
  }, [sortedTickets, currentPage])

  // Reset page when tickets change (e.g., filters applied)
  useEffect(() => {
    setCurrentPage(1)
  }, [tickets.length])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const getStatusBadge = (status: TicketStatus | null) => {
    const statusConfig = {
      todo: { label: "À faire", dotClass: "text-warning" },
      in_progress: { label: "En cours", dotClass: "text-blue-500" },
      done: { label: "Résolu", dotClass: "text-success" },
    }

    const config = status ? statusConfig[status] : null

    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span className={cn("text-base", config?.dotClass || "text-muted-foreground")}>●</span>
        {config?.label || "-"}
      </span>
    )
  }

  const getTypeLabel = (type: string | null) => {
    return getRequestTypeLabel(type)
  }

  const getUserName = (ticket: SupportTicketWithDetails) => {
    if (ticket.user_first_name || ticket.user_last_name) {
      return `${ticket.user_first_name || ""} ${ticket.user_last_name || ""}`.trim()
    }
    return ticket.user_email || "-"
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[20px] bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead
                className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("created_at")}
              >
                <div className="flex items-center">
                  Date
                  <SortIcon field="created_at" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("user_name")}
              >
                <div className="flex items-center">
                  Utilisateur
                  <SortIcon field="user_name" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide md:table-cell"
                onClick={() => handleSort("company_name")}
              >
                <div className="flex items-center">
                  Entreprise
                  <SortIcon field="company_name" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide lg:table-cell"
                onClick={() => handleSort("site_name")}
              >
                <div className="flex items-center">
                  Site
                  <SortIcon field="site_name" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide sm:table-cell"
                onClick={() => handleSort("request_type")}
              >
                <div className="flex items-center">
                  Type
                  <SortIcon field="request_type" />
                </div>
              </TableHead>
              <TableHead className="hidden text-xs font-bold uppercase tracking-wide xl:table-cell">
                Sujet
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center">
                  Statut
                  <SortIcon field="status" />
                </div>
              </TableHead>
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTickets.map((ticket) => (
              <TableRow key={ticket.id} className="cursor-pointer border-b border-border/30 hover:bg-muted/30" onClick={() => setSelectedTicket(ticket)}>
                <TableCell>
                  {format(new Date(ticket.created_at), "dd/MM/yyyy", { locale: fr })}
                </TableCell>
                <TableCell className="font-semibold uppercase">
                  <div className="flex flex-col">
                    <span>{getUserName(ticket)}</span>
                    {ticket.user_email && ticket.user_first_name && (
                      <span className="text-xs font-normal normal-case text-muted-foreground">{ticket.user_email}</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden font-semibold uppercase md:table-cell">
                  {ticket.company_name || "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  {ticket.site_name || "-"}
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  <div>
                    <span>{getTypeLabel(ticket.request_type)}</span>
                    {ticket.request_subtype && (
                      <span className="block text-xs text-muted-foreground">
                        {getSubtypeLabel(ticket.request_type, ticket.request_subtype) || ticket.request_subtype}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden max-w-[250px] xl:table-cell">
                  <span className="line-clamp-1 text-sm font-medium">
                    {ticket.subject || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(ticket.status)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedTicket(ticket)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Voir les détails
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation()
                          if (ticket.freshdesk_ticket_id) {
                            window.open(
                              `https://mydeskeosupport.freshdesk.com/a/tickets/${ticket.freshdesk_ticket_id}`,
                              "_blank"
                            )
                          }
                        }}
                        disabled={!ticket.freshdesk_ticket_id}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Voir dans Freshdesk
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <PaginationInfo
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            totalItems={sortedTickets.length}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Ticket detail dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => { if (!open) { setSelectedTicket(null); setReplyBody("") } }}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails du ticket</DialogTitle>
          </DialogHeader>
          {selectedTicket && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Date</p>
                  <p className="text-sm">{format(new Date(selectedTicket.created_at), "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Statut</p>
                  {getStatusBadge(selectedTicket.status)}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Utilisateur</p>
                  <p className="text-sm font-semibold">{getUserName(selectedTicket)}</p>
                  {selectedTicket.user_email && selectedTicket.user_first_name && (
                    <p className="text-xs text-muted-foreground">{selectedTicket.user_email}</p>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Entreprise</p>
                  <p className="text-sm">{selectedTicket.company_name || "-"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Site</p>
                  <p className="text-sm">{selectedTicket.site_name || "-"}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Type</p>
                  <p className="text-sm">{getTypeLabel(selectedTicket.request_type)}</p>
                  {selectedTicket.request_subtype && (
                    <p className="text-xs text-muted-foreground">
                      {getSubtypeLabel(selectedTicket.request_type, selectedTicket.request_subtype) || selectedTicket.request_subtype}
                    </p>
                  )}
                </div>
              </div>
              {selectedTicket.subject && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sujet</p>
                  <p className="text-sm">{selectedTicket.subject}</p>
                </div>
              )}
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Description</p>
                <div className="mt-1 rounded-lg bg-muted/50 p-3">
                  <p className="whitespace-pre-wrap text-sm">{selectedTicket.comment || "Aucune description"}</p>
                </div>
              </div>
              {selectedTicket.freshdesk_ticket_id && (
                <>
                  <div className="pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() =>
                        window.open(
                          `https://mydeskeosupport.freshdesk.com/a/tickets/${selectedTicket.freshdesk_ticket_id}`,
                          "_blank"
                        )
                      }
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      Voir dans Freshdesk
                    </Button>
                  </div>
                  <div className="border-t border-border/50 pt-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Répondre</p>
                    <Textarea
                      className="mt-2"
                      placeholder="Saisissez votre réponse..."
                      value={replyBody}
                      onChange={(e) => setReplyBody(e.target.value)}
                      rows={4}
                      disabled={replySending}
                    />
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      disabled={replySending || !replyBody.trim()}
                      onClick={async () => {
                        setReplySending(true)
                        const result = await replyToFreshdeskTicket(
                          selectedTicket.freshdesk_ticket_id!,
                          replyBody
                        )
                        setReplySending(false)
                        if (result.error) {
                          toast.error(result.error)
                        } else {
                          toast.success("Réponse envoyée")
                          setReplyBody("")
                        }
                      }}
                    >
                      {replySending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="mr-2 h-4 w-4" />
                      )}
                      {replySending ? "Envoi en cours..." : "Envoyer la réponse"}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
