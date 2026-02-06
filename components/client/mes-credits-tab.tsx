"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Coins, ShoppingCart } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"
import { AdminContactDialog } from "./admin-contact-dialog"
import type { CreditMovementType } from "@/lib/types/database"

const typeLabels: Record<CreditMovementType | "purchase", string> = {
  reservation: "Réservation",
  cancellation: "Annulation",
  adjustment: "Ajustement",
  purchase: "Achat",
}

const typeColors: Record<CreditMovementType | "purchase", string> = {
  reservation: "bg-blue-100 text-blue-700",
  cancellation: "bg-orange-100 text-orange-700",
  adjustment: "bg-purple-100 text-purple-700",
  purchase: "bg-green-100 text-green-700",
}

const filterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "reservation", label: "Réservation" },
  { value: "cancellation", label: "Annulation" },
  { value: "adjustment", label: "Ajustement" },
  { value: "purchase", label: "Achat" },
]

export function MesCreditsTab() {
  const { credits, creditMovements, user, isAdmin, companyAdmin } = useClientLayout()
  const [typeFilter, setTypeFilter] = useState("all")
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)

  const handleBuyCredits = () => {
    if (!isAdmin) {
      setAdminDialogOpen(true)
      return
    }
    const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
    window.open(stripeUrl, "_blank")
  }

  const filteredMovements = useMemo(() => {
    if (typeFilter === "all") return creditMovements
    return creditMovements.filter((m) => m.type === typeFilter)
  }, [creditMovements, typeFilter])

  return (
    <div className="space-y-6">
      {/* Credit Balance Card */}
      <div className="rounded-[16px] bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Solde actuel</p>
            <p className="text-2xl font-bold text-foreground">
              {credits?.remaining ?? 0}
            </p>
          </div>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Coins className="h-5 w-5 text-foreground/70" />
          </div>
        </div>
      </div>

      {/* Buy Credits Button */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1B1918] px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90"
        onClick={handleBuyCredits}
      >
        <ShoppingCart className="h-4 w-4" />
        Acheter des crédits
      </button>

      {/* Admin Contact Dialog for non-admin users */}
      <AdminContactDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        admin={companyAdmin}
        actionType="credits"
      />

      {/* Credits History */}
      <div className="rounded-[16px] bg-card p-6">
        <h3 className="mb-4 font-header text-lg font-bold uppercase tracking-tight">Historique des mouvements</h3>

        {creditMovements.length === 0 ? (
          <p className="text-muted-foreground">Aucun mouvement de crédit enregistré</p>
        ) : (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <SearchableSelect
                options={filterOptions}
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder="Filtrer par type"
                searchPlaceholder="Rechercher un type..."
                triggerClassName="w-full sm:w-[200px]"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-[12px] bg-foreground/[0.02]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="hidden md:table-cell">Motif</TableHead>
                    <TableHead className="hidden sm:table-cell text-right">Solde après</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Aucun mouvement pour ce filtre
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(movement.date).toLocaleDateString("fr-FR")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
                              typeColors[movement.type as CreditMovementType | "purchase"]
                            )}
                          >
                            {typeLabels[movement.type as CreditMovementType | "purchase"]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              movement.amount > 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {movement.amount > 0 ? (
                              <>
                                <ArrowUp className="h-3 w-3" />+{movement.amount}
                              </>
                            ) : (
                              <>
                                <ArrowDown className="h-3 w-3" />
                                {movement.amount}
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {movement.description}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-right font-medium">
                          {movement.balance_after}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
