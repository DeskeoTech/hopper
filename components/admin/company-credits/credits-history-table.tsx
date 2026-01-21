"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"
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
import type { CreditMovement, CreditMovementType } from "@/lib/types/database"

interface CreditsHistoryTableProps {
  movements: CreditMovement[]
}

const typeLabels: Record<CreditMovementType, string> = {
  reservation: "Réservation",
  cancellation: "Annulation",
  adjustment: "Ajustement",
}

const typeColors: Record<CreditMovementType, string> = {
  reservation: "bg-blue-100 text-blue-700",
  cancellation: "bg-orange-100 text-orange-700",
  adjustment: "bg-purple-100 text-purple-700",
}

const filterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "reservation", label: "Réservation" },
  { value: "cancellation", label: "Annulation" },
  { value: "adjustment", label: "Ajustement" },
]

export function CreditsHistoryTable({ movements }: CreditsHistoryTableProps) {
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredMovements = useMemo(() => {
    if (typeFilter === "all") {
      return movements
    }
    return movements.filter((m) => m.type === typeFilter)
  }, [movements, typeFilter])

  if (movements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun mouvement de crédit enregistré
      </p>
    )
  }

  return (
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
                        typeColors[movement.type]
                      )}
                    >
                      {typeLabels[movement.type]}
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
                          <ArrowUp className="h-3 w-3" />
                          +{movement.amount}
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
  )
}
