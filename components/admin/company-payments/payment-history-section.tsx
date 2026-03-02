"use client"

import { useMemo, useState } from "react"
import { Search, ChevronLeft, ChevronRight, ExternalLink, FileDown, ReceiptText } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { StripePaymentData } from "@/lib/actions/stripe"

interface PaymentHistorySectionProps {
  payments: StripePaymentData[]
}

const ITEMS_PER_PAGE = 15

const statusLabels: Record<string, string> = {
  paid: "Payée",
  open: "En attente",
  void: "Annulée",
  uncollectible: "Irrécouvrable",
  draft: "Brouillon",
  succeeded: "Réussi",
  pending: "En attente",
  failed: "Échoué",
}

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  succeeded: "bg-green-100 text-green-700",
  open: "bg-amber-100 text-amber-700",
  pending: "bg-amber-100 text-amber-700",
  draft: "bg-gray-100 text-gray-600",
  void: "bg-red-100 text-red-700",
  uncollectible: "bg-red-100 text-red-700",
  failed: "bg-red-100 text-red-700",
}

export function PaymentHistorySection({ payments = [] }: PaymentHistorySectionProps) {
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!search.trim()) return payments
    const query = search.toLowerCase().trim()
    return payments.filter((p) =>
      (p.description || "").toLowerCase().includes(query) ||
      (statusLabels[p.status] || p.status).toLowerCase().includes(query) ||
      new Date(p.created * 1000).toLocaleDateString("fr-FR").includes(query) ||
      (p.amount / 100).toFixed(2).includes(query)
    )
  }, [payments, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  if (payments.length === 0) {
    return (
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <h2 className="flex items-center gap-2 type-h3 text-foreground mb-4">
          <ReceiptText className="h-5 w-5" />
          Historique des paiements
        </h2>
        <p className="text-sm text-muted-foreground">Aucun paiement enregistré</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-card p-4 sm:p-6">
      <h2 className="flex items-center gap-2 type-h3 text-foreground mb-4">
        <ReceiptText className="h-5 w-5" />
        Historique des paiements
      </h2>

      {/* Search */}
      <div className="mb-4">
        <div className="relative sm:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un paiement..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun paiement trouvé
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="whitespace-nowrap">
                    {new Date(payment.created * 1000).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate">
                    {payment.description || "Paiement"}
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {(payment.amount / 100).toFixed(2)} {payment.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
                        statusColors[payment.status] || "bg-gray-100 text-gray-700"
                      )}
                    >
                      {statusLabels[payment.status] || payment.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {payment.hosted_invoice_url && (
                        <a
                          href={payment.hosted_invoice_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Voir"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      {payment.invoice_pdf && (
                        <a
                          href={payment.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Télécharger PDF"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </a>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filtered.length} paiement{filtered.length > 1 ? "s" : ""}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors hover:bg-muted disabled:opacity-50 disabled:pointer-events-none"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
