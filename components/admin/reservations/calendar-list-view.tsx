"use client"

import { useState, useMemo, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowUpDown, ArrowUp, ArrowDown, CalendarX } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { BookingStatusBadge } from "./booking-status-badge"
import type { BookingWithDetails } from "@/lib/types/database"

interface CalendarListViewProps {
  bookings: BookingWithDetails[]
  onBookingClick?: (booking: BookingWithDetails) => void
}

type SortField = "date" | "time" | "resource" | "site" | "user" | "company" | "status"
type SortOrder = "asc" | "desc"

const PAGE_SIZE = 15

export function CalendarListView({ bookings, onBookingClick }: CalendarListViewProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
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

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "date":
          aValue = new Date(a.start_date).getTime()
          bValue = new Date(b.start_date).getTime()
          break
        case "time":
          aValue = format(parseISO(a.start_date), "HH:mm")
          bValue = format(parseISO(b.start_date), "HH:mm")
          break
        case "resource":
          aValue = (a.resource_name || "").toLowerCase()
          bValue = (b.resource_name || "").toLowerCase()
          break
        case "site":
          aValue = (a.site_name || "").toLowerCase()
          bValue = (b.site_name || "").toLowerCase()
          break
        case "user":
          aValue = `${a.user_last_name || ""} ${a.user_first_name || ""}`.toLowerCase()
          bValue = `${b.user_last_name || ""} ${b.user_first_name || ""}`.toLowerCase()
          break
        case "company":
          aValue = (a.company_name || "").toLowerCase()
          bValue = (b.company_name || "").toLowerCase()
          break
        case "status":
          aValue = a.status || ""
          bValue = b.status || ""
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [bookings, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedBookings.length / PAGE_SIZE)
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedBookings.slice(start, start + PAGE_SIZE)
  }, [sortedBookings, currentPage])

  // Reset page when bookings change (e.g., filters applied)
  useEffect(() => {
    setCurrentPage(1)
  }, [bookings.length])

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

  const getUserName = (booking: BookingWithDetails) => {
    if (booking.user_first_name || booking.user_last_name) {
      return `${booking.user_first_name || ""} ${booking.user_last_name || ""}`.trim()
    }
    return booking.user_email || "-"
  }

  if (bookings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[20px] bg-card p-12">
        <CalendarX className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          Aucune reservation pour cette periode
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[20px] bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead
                className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("date")}
              >
                <div className="flex items-center">
                  Date
                  <SortIcon field="date" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide sm:table-cell"
                onClick={() => handleSort("time")}
              >
                <div className="flex items-center">
                  Heure
                  <SortIcon field="time" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("resource")}
              >
                <div className="flex items-center">
                  Salle
                  <SortIcon field="resource" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide md:table-cell"
                onClick={() => handleSort("site")}
              >
                <div className="flex items-center">
                  Site
                  <SortIcon field="site" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide lg:table-cell"
                onClick={() => handleSort("user")}
              >
                <div className="flex items-center">
                  Utilisateur
                  <SortIcon field="user" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide lg:table-cell"
                onClick={() => handleSort("company")}
              >
                <div className="flex items-center">
                  Entreprise
                  <SortIcon field="company" />
                </div>
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
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedBookings.map((booking) => (
              <TableRow
                key={booking.id}
                className="cursor-pointer border-b border-border/30 hover:bg-muted/30"
                onClick={() => onBookingClick?.(booking)}
              >
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-semibold">
                      {format(parseISO(booking.start_date), "dd/MM/yyyy", { locale: fr })}
                    </span>
                    <span className="text-xs text-muted-foreground sm:hidden">
                      {format(parseISO(booking.start_date), "HH:mm", { locale: fr })} - {format(parseISO(booking.end_date), "HH:mm", { locale: fr })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {format(parseISO(booking.start_date), "HH:mm", { locale: fr })} - {format(parseISO(booking.end_date), "HH:mm", { locale: fr })}
                </TableCell>
                <TableCell className="font-semibold uppercase">
                  {booking.resource_name || "-"}
                </TableCell>
                <TableCell className="hidden font-semibold uppercase md:table-cell">
                  {booking.site_name || "-"}
                </TableCell>
                <TableCell className="hidden lg:table-cell">
                  <div className="flex flex-col">
                    <span className="font-semibold uppercase">{getUserName(booking)}</span>
                    {booking.user_email && booking.user_first_name && (
                      <span className="text-xs font-normal normal-case text-muted-foreground">
                        {booking.user_email}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden font-semibold uppercase lg:table-cell">
                  {booking.company_name || "-"}
                </TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
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
            totalItems={sortedBookings.length}
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
