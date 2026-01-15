"use client"

import { useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { BookingStatusBadge } from "./booking-status-badge"
import type { BookingWithDetails } from "@/lib/types/database"

interface CalendarListViewProps {
  bookings: BookingWithDetails[]
}

type SortField =
  | "date"
  | "time"
  | "resource"
  | "site"
  | "user"
  | "company"
  | "status"
type SortDirection = "asc" | "desc"

const resourceTypeLabels: Record<string, string> = {
  bench: "Bench",
  meeting_room: "Salle de reunion",
  flex_desk: "Flex desk",
  fixed_desk: "Bureau fixe",
}

export function CalendarListView({ bookings }: CalendarListViewProps) {
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc")

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case "date":
          comparison =
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
          break
        case "time":
          const aTime = format(parseISO(a.start_date), "HH:mm")
          const bTime = format(parseISO(b.start_date), "HH:mm")
          comparison = aTime.localeCompare(bTime)
          break
        case "resource":
          comparison = (a.resource_name || "").localeCompare(
            b.resource_name || ""
          )
          break
        case "site":
          comparison = (a.site_name || "").localeCompare(b.site_name || "")
          break
        case "user":
          const aUser = `${a.user_last_name || ""} ${a.user_first_name || ""}`.trim()
          const bUser = `${b.user_last_name || ""} ${b.user_first_name || ""}`.trim()
          comparison = aUser.localeCompare(bUser)
          break
        case "company":
          comparison = (a.company_name || "").localeCompare(b.company_name || "")
          break
        case "status":
          comparison = (a.status || "").localeCompare(b.status || "")
          break
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  }, [bookings, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("date")}
            >
              <div className="flex items-center">
                Date
                <SortIcon field="date" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none sm:table-cell"
              onClick={() => handleSort("time")}
            >
              <div className="flex items-center">
                Heure
                <SortIcon field="time" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("resource")}
            >
              <div className="flex items-center">
                Ressource
                <SortIcon field="resource" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none md:table-cell"
              onClick={() => handleSort("site")}
            >
              <div className="flex items-center">
                Site
                <SortIcon field="site" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none lg:table-cell"
              onClick={() => handleSort("user")}
            >
              <div className="flex items-center">
                Utilisateur
                <SortIcon field="user" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none lg:table-cell"
              onClick={() => handleSort("company")}
            >
              <div className="flex items-center">
                Entreprise
                <SortIcon field="company" />
              </div>
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
          {sortedBookings.map((booking) => {
            const userName =
              booking.user_first_name || booking.user_last_name
                ? `${booking.user_first_name || ""} ${booking.user_last_name || ""}`.trim()
                : booking.user_email || "-"

            return (
              <TableRow key={booking.id}>
                <TableCell>
                  <div>
                    {format(parseISO(booking.start_date), "dd/MM/yyyy", {
                      locale: fr,
                    })}
                    <span className="block text-xs text-muted-foreground sm:hidden">
                      {format(parseISO(booking.start_date), "HH:mm", { locale: fr })} -{" "}
                      {format(parseISO(booking.end_date), "HH:mm", { locale: fr })}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">
                  {format(parseISO(booking.start_date), "HH:mm", { locale: fr })} -{" "}
                  {format(parseISO(booking.end_date), "HH:mm", { locale: fr })}
                </TableCell>
                <TableCell>
                  <div>
                    <span className="font-medium">
                      {booking.resource_name || "-"}
                    </span>
                    {booking.resource_type && (
                      <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">
                        ({resourceTypeLabels[booking.resource_type] || booking.resource_type})
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{booking.site_name || "-"}</TableCell>
                <TableCell className="hidden lg:table-cell">{userName}</TableCell>
                <TableCell className="hidden lg:table-cell">{booking.company_name || "-"}</TableCell>
                <TableCell>
                  <BookingStatusBadge status={booking.status} />
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
