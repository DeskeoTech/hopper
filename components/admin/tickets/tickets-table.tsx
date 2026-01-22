"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
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
import { cn } from "@/lib/utils"
import type { SupportTicketWithDetails, TicketStatus, TicketRequestType } from "@/lib/types/database"

type SortField = "created_at" | "status" | "request_type" | "user_name" | "company_name"
type SortOrder = "asc" | "desc"

interface TicketsTableProps {
  tickets: SupportTicketWithDetails[]
}

export function TicketsTable({ tickets }: TicketsTableProps) {
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
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
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [tickets, sortField, sortOrder])

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
      todo: { label: "À faire", className: "bg-orange-100 text-orange-700" },
      in_progress: { label: "En cours", className: "bg-blue-100 text-blue-700" },
      done: { label: "Résolu", className: "bg-green-100 text-green-700" },
    }

    const config = status ? statusConfig[status] : null

    return (
      <span
        className={cn(
          "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
          config?.className || "bg-gray-100 text-gray-600"
        )}
      >
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
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("created_at")}
            >
              <div className="flex items-center">
                Date
                <SortIcon field="created_at" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("user_name")}
            >
              <div className="flex items-center">
                Utilisateur
                <SortIcon field="user_name" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none md:table-cell"
              onClick={() => handleSort("company_name")}
            >
              <div className="flex items-center">
                Entreprise
                <SortIcon field="company_name" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none sm:table-cell"
              onClick={() => handleSort("request_type")}
            >
              <div className="flex items-center">
                Type
                <SortIcon field="request_type" />
              </div>
            </TableHead>
            <TableHead className="hidden lg:table-cell">
              Description
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("status")}
            >
              <div className="flex items-center">
                Statut
                <SortIcon field="status" />
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedTickets.map((ticket) => (
            <TableRow key={ticket.id}>
              <TableCell className="text-muted-foreground">
                {format(new Date(ticket.created_at), "dd MMM yyyy", { locale: fr })}
              </TableCell>
              <TableCell className="font-medium">
                <div className="flex flex-col">
                  <span>{getUserName(ticket)}</span>
                  {ticket.user_email && ticket.user_first_name && (
                    <span className="text-xs text-muted-foreground">{ticket.user_email}</span>
                  )}
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {ticket.company_name || "-"}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {getRequestTypeLabel(ticket.request_type)}
              </TableCell>
              <TableCell className="hidden max-w-[300px] lg:table-cell">
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {ticket.comment || "-"}
                </span>
              </TableCell>
              <TableCell>
                {getStatusBadge(ticket.status)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
