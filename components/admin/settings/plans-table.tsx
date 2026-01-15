"use client"

import { useState, useMemo } from "react"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { EditPlanModal } from "./edit-plan-modal"
import { ArchivePlanModal } from "./archive-plan-modal"
import type { Plan, Site } from "@/lib/types/database"

type SortField = "name" | "price_per_seat_month" | "credits_per_month" | "recurrence" | "service_type" | "siteCount" | "archived"
type SortOrder = "asc" | "desc"

interface PlanWithSites extends Plan {
  siteIds: string[]
  siteCount: number
}

interface PlansTableProps {
  plans: PlanWithSites[]
  sites: Site[]
}

export function PlansTable({ plans, sites }: PlansTableProps) {
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

  const sortedPlans = useMemo(() => {
    return [...plans].sort((a, b) => {
      let aValue: string | number | boolean
      let bValue: string | number | boolean

      switch (sortField) {
        case "name":
          aValue = a.name.toLowerCase()
          bValue = b.name.toLowerCase()
          break
        case "price_per_seat_month":
          aValue = a.price_per_seat_month ?? -1
          bValue = b.price_per_seat_month ?? -1
          break
        case "credits_per_month":
          aValue = a.credits_per_month ?? -1
          bValue = b.credits_per_month ?? -1
          break
        case "recurrence":
          aValue = a.recurrence || ""
          bValue = b.recurrence || ""
          break
        case "service_type":
          aValue = a.service_type || ""
          bValue = b.service_type || ""
          break
        case "siteCount":
          aValue = a.siteCount
          bValue = b.siteCount
          break
        case "archived":
          aValue = a.archived ? 1 : 0
          bValue = b.archived ? 1 : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [plans, sortField, sortOrder])

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

  const getRecurrenceLabel = (recurrence: string | null) => {
    if (!recurrence) return "-"
    const labels: Record<string, string> = {
      daily: "Quotidien",
      weekly: "Hebdomadaire",
      monthly: "Mensuel",
    }
    return labels[recurrence] || recurrence
  }

  const getServiceTypeLabel = (serviceType: string | null) => {
    if (!serviceType) return "-"
    const labels: Record<string, string> = {
      plan: "Forfait",
      credit_purchase: "Achat crédits",
      coffee_subscription: "Abo café",
    }
    return labels[serviceType] || serviceType
  }

  const formatPrice = (price: number | null) => {
    if (price === null) return "-"
    return `${price.toLocaleString("fr-FR")} €`
  }

  const formatCredits = (credits: number | null) => {
    if (credits === null) return "-"
    return credits.toLocaleString("fr-FR")
  }

  if (plans.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun forfait trouvé</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center">
                Nom
                <SortIcon field="name" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("price_per_seat_month")}
            >
              <div className="flex items-center">
                Prix/siège
                <SortIcon field="price_per_seat_month" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("credits_per_month")}
            >
              <div className="flex items-center">
                Crédits/mois
                <SortIcon field="credits_per_month" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("recurrence")}
            >
              <div className="flex items-center">
                Récurrence
                <SortIcon field="recurrence" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("service_type")}
            >
              <div className="flex items-center">
                Type
                <SortIcon field="service_type" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-center"
              onClick={() => handleSort("siteCount")}
            >
              <div className="flex items-center justify-center">
                Sites
                <SortIcon field="siteCount" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("archived")}
            >
              <div className="flex items-center">
                Statut
                <SortIcon field="archived" />
              </div>
            </TableHead>
            <TableHead className="w-24">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedPlans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell className="font-medium">{plan.name}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatPrice(plan.price_per_seat_month)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatCredits(plan.credits_per_month)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getRecurrenceLabel(plan.recurrence)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getServiceTypeLabel(plan.service_type)}
              </TableCell>
              <TableCell className="text-center">{plan.siteCount}</TableCell>
              <TableCell>
                <span
                  className={cn(
                    "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
                    plan.archived
                      ? "bg-gray-100 text-gray-600"
                      : "bg-green-100 text-green-700"
                  )}
                >
                  {plan.archived ? "Archivé" : "Actif"}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <EditPlanModal plan={plan} sites={sites} planSiteIds={plan.siteIds} />
                  <ArchivePlanModal plan={plan} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
