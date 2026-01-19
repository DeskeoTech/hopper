"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Pencil, XCircle } from "lucide-react"
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
import { SubscriptionStatusBadge, type SubscriptionStatus } from "./subscription-status-badge"
import { EditSubscriptionModal } from "@/components/admin/company-edit/edit-subscription-modal"
import { CancelSubscriptionModal } from "./cancel-subscription-modal"
import type { SubscriptionPeriod } from "@/lib/types/database"

type SortField = "name" | "period" | "startDate" | "endDate" | "site" | "status"
type SortOrder = "asc" | "desc"

export interface SubscriptionRow {
  id: string
  name: string | null
  contactEmail: string | null
  subscriptionPeriod: SubscriptionPeriod | null
  subscriptionStartDate: string | null
  subscriptionEndDate: string | null
  mainSiteName: string | null
  status: SubscriptionStatus
}

interface AbonnementsTableProps {
  subscriptions: SubscriptionRow[]
}

export function AbonnementsTable({ subscriptions }: AbonnementsTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
  }

  const sortedSubscriptions = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "name":
          aValue = (a.name || "").toLowerCase()
          bValue = (b.name || "").toLowerCase()
          break
        case "period":
          aValue = a.subscriptionPeriod || ""
          bValue = b.subscriptionPeriod || ""
          break
        case "startDate":
          aValue = a.subscriptionStartDate || ""
          bValue = b.subscriptionStartDate || ""
          break
        case "endDate":
          aValue = a.subscriptionEndDate || "9999-99-99"
          bValue = b.subscriptionEndDate || "9999-99-99"
          break
        case "site":
          aValue = (a.mainSiteName || "").toLowerCase()
          bValue = (b.mainSiteName || "").toLowerCase()
          break
        case "status":
          const statusOrder = { actif: 0, expirant: 1, inactif: 2 }
          aValue = statusOrder[a.status]
          bValue = statusOrder[b.status]
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [subscriptions, sortField, sortOrder])

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

  const formatPeriod = (period: SubscriptionPeriod | null) => {
    if (!period) return "-"
    return period === "month" ? "Mensuel" : "Hebdomadaire"
  }

  const formatDate = (date: string | null) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">
                Entreprise
                <SortIcon field="name" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none md:table-cell"
              onClick={() => handleSort("period")}
            >
              <div className="flex items-center">
                Periode
                <SortIcon field="period" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none md:table-cell"
              onClick={() => handleSort("startDate")}
            >
              <div className="flex items-center">
                Debut
                <SortIcon field="startDate" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("endDate")}
            >
              <div className="flex items-center">
                Fin
                <SortIcon field="endDate" />
              </div>
            </TableHead>
            <TableHead
              className="hidden cursor-pointer select-none lg:table-cell"
              onClick={() => handleSort("site")}
            >
              <div className="flex items-center">
                Site
                <SortIcon field="site" />
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
            <TableHead className="w-[70px]">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedSubscriptions.map((subscription) => (
            <TableRow
              key={subscription.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/clients/${subscription.id}`)}
            >
              <TableCell className="font-medium">
                {subscription.name || "Sans nom"}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatPeriod(subscription.subscriptionPeriod)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">
                {formatDate(subscription.subscriptionStartDate)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatDate(subscription.subscriptionEndDate)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">
                {subscription.mainSiteName || "-"}
              </TableCell>
              <TableCell>
                <SubscriptionStatusBadge status={subscription.status} />
              </TableCell>
              <TableCell onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <EditSubscriptionModal
                      companyId={subscription.id}
                      initialPeriod={subscription.subscriptionPeriod}
                      initialStartDate={subscription.subscriptionStartDate}
                      initialEndDate={subscription.subscriptionEndDate}
                      trigger={
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                      }
                    />
                    {subscription.status !== "inactif" && (
                      <CancelSubscriptionModal
                        companyId={subscription.id}
                        companyName={subscription.name}
                        currentEndDate={subscription.subscriptionEndDate}
                        trigger={
                          <DropdownMenuItem
                            onSelect={(e) => e.preventDefault()}
                            className="text-destructive focus:text-destructive"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Resilier
                          </DropdownMenuItem>
                        }
                      />
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
