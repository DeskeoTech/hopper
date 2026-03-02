"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MoreVertical, XCircle, Trash2, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { getCompanyPaymentStatuses, type CompanyPaymentStatus } from "@/lib/actions/stripe"
import { CompanyPaymentStatusBadge } from "./companies/company-payment-status-badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SubscriptionStatusBadge, type SubscriptionStatus } from "@/components/admin/abonnements/subscription-status-badge"
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
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import type { Company, SubscriptionPeriod } from "@/lib/types/database"

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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function formatPeriod(period: SubscriptionPeriod | null) {
  if (!period) return null
  return period === "month" ? "Mensuel" : "Hebdomadaire"
}

export function CompaniesTable({ companies, isTechAdmin = false }: CompaniesTableProps) {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmDelete, setConfirmDelete] = useState<CompanyWithCounts | null>(null)
  const [loading, setLoading] = useState(false)
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, CompanyPaymentStatus>>({})

  const fetchPaymentStatuses = useCallback(async (companiesOnPage: CompanyWithCounts[]) => {
    const customerIds = companiesOnPage
      .filter((c) => c.customer_id_stripe)
      .map((c) => c.customer_id_stripe!)

    if (customerIds.length === 0) return

    const result = await getCompanyPaymentStatuses(customerIds)
    if ("statuses" in result) {
      setPaymentStatuses((prev) => ({ ...prev, ...result.statuses }))
    }
  }, [])

  // Pagination
  const totalPages = Math.ceil(companies.length / PAGE_SIZE)
  const paginatedCompanies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return companies.slice(start, start + PAGE_SIZE)
  }, [companies, currentPage])

  // Reset page when companies change
  useEffect(() => {
    setCurrentPage(1)
  }, [companies.length])

  // Fetch payment statuses for visible companies
  useEffect(() => {
    fetchPaymentStatuses(paginatedCompanies)
  }, [paginatedCompanies, fetchPaymentStatuses])

  const handleDeleteCompany = async () => {
    if (!confirmDelete) return
    setLoading(true)
    const result = await deleteCompany(confirmDelete.id)
    setLoading(false)
    setConfirmDelete(null)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success("Entreprise supprimée avec succès")
    }
  }

  const startItem = (currentPage - 1) * PAGE_SIZE + 1
  const endItem = Math.min(currentPage * PAGE_SIZE, companies.length)

  return (
    <div className="space-y-4">
      <div className="rounded-[20px] bg-card">
        <div className="divide-y divide-gray-100">
          {paginatedCompanies.map((company) => {
            const periodLabel = formatPeriod(company.subscription_period)
            return (
              <div
                key={company.id}
                className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-gray-50/50 cursor-pointer sm:px-6"
                onClick={() => router.push(`/admin/clients/${company.id}`)}
              >
                {/* Initials avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                  {getInitials(company.name || "?")}
                </div>

                {/* Company info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-bold text-foreground">
                      {company.name || "Sans nom"}
                    </span>
                    <span className="inline-flex shrink-0 items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5" />
                      {company.userCount}
                    </span>
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {company.mainSiteName && (
                      <p className="text-xs text-muted-foreground">{company.mainSiteName}</p>
                    )}
                    {periodLabel && (
                      <p className="text-xs text-muted-foreground">{periodLabel}</p>
                    )}
                  </div>
                </div>

                {/* Payment status */}
                <div className="hidden shrink-0 sm:block">
                  {company.customer_id_stripe ? (
                    <CompanyPaymentStatusBadge
                      status={paymentStatuses[company.customer_id_stripe] || "none"}
                    />
                  ) : null}
                </div>

                {/* Subscription status */}
                <div className="shrink-0">
                  <SubscriptionStatusBadge status={company.subscriptionStatus} />
                </div>

                {/* Actions menu */}
                <div onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                      >
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => router.push(`/admin/clients/${company.id}`)}
                      >
                        Voir détails
                      </DropdownMenuItem>
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
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {startItem}–{endItem} sur {companies.length}
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p - 1)}
              disabled={currentPage === 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="px-2 text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => p + 1)}
              disabled={currentPage === totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
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
