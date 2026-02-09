"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, XCircle, Trash2 } from "lucide-react"
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
import { SubscriptionStatusBadge, getSubscriptionStatus, type SubscriptionStatus } from "@/components/admin/abonnements/subscription-status-badge"
import { CancelSubscriptionModal } from "@/components/admin/abonnements/cancel-subscription-modal"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteCompany } from "@/lib/actions/companies"
import type { Company, SubscriptionPeriod } from "@/lib/types/database"

type SortField = "name" | "userCount" | "mainSiteName" | "period" | "startDate" | "endDate" | "status"
type SortOrder = "asc" | "desc"

const PAGE_SIZE = 15

interface CompanyWithCounts extends Company {
  userCount: number
  mainSiteName: string | null
  subscriptionStatus: SubscriptionStatus
}

interface CompaniesTableProps {
  companies: CompanyWithCounts[]
  isTechAdmin?: boolean
}

export function CompaniesTable({ companies, isTechAdmin = false }: CompaniesTableProps) {
  const router = useRouter()
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<CompanyWithCounts | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
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
        case "userCount":
          aValue = a.userCount
          bValue = b.userCount
          break
        case "mainSiteName":
          aValue = (a.mainSiteName || "").toLowerCase()
          bValue = (b.mainSiteName || "").toLowerCase()
          break
        case "period":
          aValue = a.subscription_period || ""
          bValue = b.subscription_period || ""
          break
        case "startDate":
          aValue = a.subscription_start_date || ""
          bValue = b.subscription_start_date || ""
          break
        case "endDate":
          aValue = a.subscription_end_date || "9999-99-99"
          bValue = b.subscription_end_date || "9999-99-99"
          break
        case "status":
          const statusOrder = { actif: 0, expirant: 1, inactif: 2 }
          aValue = statusOrder[a.subscriptionStatus]
          bValue = statusOrder[b.subscriptionStatus]
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [companies, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedCompanies.length / PAGE_SIZE)
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedCompanies.slice(start, start + PAGE_SIZE)
  }, [sortedCompanies, currentPage])

  // Reset page when companies change (e.g., filters applied)
  useEffect(() => {
    setCurrentPage(1)
  }, [companies.length])

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

  const handleDeleteCompany = async () => {
    if (!confirmDelete) return
    setLoading(true)
    await deleteCompany(confirmDelete.id)
    setLoading(false)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-[20px] bg-card">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border/50 hover:bg-transparent">
              <TableHead
                className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Nom
                  <SortIcon field="name" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-center text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("userCount")}
              >
                <div className="flex items-center justify-center">
                  <span className="hidden sm:inline">Utilisateurs</span>
                  <span className="sm:hidden">Users</span>
                  <SortIcon field="userCount" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide lg:table-cell"
                onClick={() => handleSort("mainSiteName")}
              >
                <div className="flex items-center">
                  Site
                  <SortIcon field="mainSiteName" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide md:table-cell"
                onClick={() => handleSort("period")}
              >
                <div className="flex items-center">
                  Pass
                  <SortIcon field="period" />
                </div>
              </TableHead>
              <TableHead
                className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide md:table-cell"
                onClick={() => handleSort("startDate")}
              >
                <div className="flex items-center">
                  Début
                  <SortIcon field="startDate" />
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                onClick={() => handleSort("endDate")}
              >
                <div className="flex items-center">
                  Fin
                  <SortIcon field="endDate" />
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
              <TableHead className="w-[50px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCompanies.map((company) => (
              <TableRow
                key={company.id}
                className="cursor-pointer border-b border-border/30 hover:bg-muted/30"
                onClick={() => router.push(`/admin/clients/${company.id}`)}
              >
                <TableCell className="font-semibold uppercase">
                  {company.name || "Sans nom"}
                </TableCell>
                <TableCell className="text-center">
                  {company.userCount}
                </TableCell>
                <TableCell className="hidden font-semibold uppercase lg:table-cell">
                  {company.mainSiteName || "-"}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatPeriod(company.subscription_period)}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {formatDate(company.subscription_start_date)}
                </TableCell>
                <TableCell>
                  {formatDate(company.subscription_end_date)}
                </TableCell>
                <TableCell>
                  <SubscriptionStatusBadge status={company.subscriptionStatus} />
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
                      {company.subscriptionStatus !== "inactif" && (
                        <CancelSubscriptionModal
                          companyId={company.id}
                          companyName={company.name}
                          currentEndDate={company.subscription_end_date}
                          trigger={
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="text-destructive focus:text-destructive"
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Résilier
                            </DropdownMenuItem>
                          }
                        />
                      )}
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/clients/${company.id}`)}
                      >
                        Voir détails
                      </DropdownMenuItem>
                      {isTechAdmin && (
                        <DropdownMenuItem
                          onClick={() => setConfirmDelete(company)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      )}
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
            totalItems={sortedCompanies.length}
          />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Confirm delete company dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l&apos;entreprise</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer {confirmDelete?.name || "cette entreprise"} ? Cette action est irréversible et supprimera toutes les données associées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCompany} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
