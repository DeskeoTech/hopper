"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, Coins, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  const { credits, creditMovements, user, plan } = useClientLayout()
  const [typeFilter, setTypeFilter] = useState("all")

  const isUserDisabled = user.status === "disabled"
  const hasActiveContract = plan !== null
  const canBuyCredits = !isUserDisabled && hasActiveContract

  const filteredMovements = useMemo(() => {
    if (typeFilter === "all") return creditMovements
    return creditMovements.filter((m) => m.type === typeFilter)
  }, [creditMovements, typeFilter])

  return (
    <div className="space-y-6">
      {/* Credit Balance Card */}
      <div className="rounded-[16px] bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Solde actuel</p>
            <p className="text-4xl font-bold text-foreground">
              {credits?.remaining ?? 0}
            </p>
            <p className="text-sm text-muted-foreground">
              crédits disponibles sur {credits?.allocated ?? 0} alloués
            </p>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Coins className="h-8 w-8 text-primary" />
          </div>
        </div>
      </div>

      {/* Buy Credits Button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!canBuyCredits}
        onClick={() => {
          if (!canBuyCredits) return
          const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
          window.open(stripeUrl, "_blank")
        }}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Acheter des Crédits supplémentaires
      </Button>

      {/* Credits History */}
      <div className="rounded-[16px] bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Historique des mouvements</h3>

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
            <div className="overflow-x-auto rounded-md border">
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
