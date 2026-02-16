"use client"

import { useState, useMemo, useEffect } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, ExternalLink } from "lucide-react"
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
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { cn } from "@/lib/utils"
import type { SupportTicketWithDetails, TicketStatus, TicketRequestType } from "@/lib/types/database"

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

  const getRequestTypeLabel = (type: TicketRequestType | null) => {
    const typeLabels = {
      account_billing: "Compte / Facturation",
      issue: "Problème",
      callback: "Rappel",
      other: "Autre",
    }

    return type ? typeLabels[type] : "-"
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
              <TableRow key={ticket.id} className="border-b border-border/30 hover:bg-muted/30">
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
                  {getRequestTypeLabel(ticket.request_type)}
                </TableCell>
                <TableCell className="hidden max-w-[250px] xl:table-cell">
                  <span className="line-clamp-1 text-sm font-medium">
                    {ticket.subject || "-"}
                  </span>
                </TableCell>
                <TableCell>
                  {getStatusBadge(ticket.status)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
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
    </div>
  )
}
