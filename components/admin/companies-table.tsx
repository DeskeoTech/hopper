"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
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
import type { Company } from "@/lib/types/database"

type SortField = "name" | "company_type" | "contact_email" | "userCount" | "siteCount" | "status"
type SortOrder = "asc" | "desc"

interface CompanyWithCounts extends Company {
  userCount: number
  siteCount: number
}

interface CompaniesTableProps {
  companies: CompanyWithCounts[]
}

export function CompaniesTable({ companies }: CompaniesTableProps) {
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

  const sortedCompanies = useMemo(() => {
    return [...companies].sort((a, b) => {
      let aValue: string | number
      let bValue: string | number

      switch (sortField) {
        case "name":
          aValue = (a.name || "").toLowerCase()
          bValue = (b.name || "").toLowerCase()
          break
        case "company_type":
          aValue = a.company_type || ""
          bValue = b.company_type || ""
          break
        case "contact_email":
          aValue = (a.contact_email || "").toLowerCase()
          bValue = (b.contact_email || "").toLowerCase()
          break
        case "userCount":
          aValue = a.userCount
          bValue = b.userCount
          break
        case "siteCount":
          aValue = a.siteCount
          bValue = b.siteCount
          break
        case "status":
          const now = new Date()
          const aEndDate = a.subscription_end_date ? new Date(a.subscription_end_date) : null
          const bEndDate = b.subscription_end_date ? new Date(b.subscription_end_date) : null
          aValue = !aEndDate || aEndDate > now ? 1 : 0
          bValue = !bEndDate || bEndDate > now ? 1 : 0
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [companies, sortField, sortOrder])

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

  const getCompanyTypeLabel = (type: string | null) => {
    if (!type) return "-"
    return type === "self_employed" ? "Indépendant" : "Multi-employés"
  }

  const getStatusBadge = (company: Company) => {
    const now = new Date()
    const endDate = company.subscription_end_date ? new Date(company.subscription_end_date) : null
    const isActive = !endDate || endDate > now

    return (
      <span
        className={cn(
          "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
          isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
        )}
      >
        {isActive ? "Actif" : "Inactif"}
      </span>
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
              onClick={() => handleSort("company_type")}
            >
              <div className="flex items-center">
                Type
                <SortIcon field="company_type" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort("contact_email")}
            >
              <div className="flex items-center">
                Email
                <SortIcon field="contact_email" />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none text-center"
              onClick={() => handleSort("userCount")}
            >
              <div className="flex items-center justify-center">
                Utilisateurs
                <SortIcon field="userCount" />
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
          {sortedCompanies.map((company) => (
            <TableRow
              key={company.id}
              className="cursor-pointer"
              onClick={() => router.push(`/admin/clients/${company.id}`)}
            >
              <TableCell className="font-medium">
                {company.name || "Sans nom"}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {getCompanyTypeLabel(company.company_type)}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {company.contact_email || "-"}
              </TableCell>
              <TableCell className="text-center">
                {company.userCount}
              </TableCell>
              <TableCell className="text-center">
                {company.siteCount}
              </TableCell>
              <TableCell>
                {getStatusBadge(company)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
