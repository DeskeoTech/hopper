"use client"

import { useMemo, useState } from "react"
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Search } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { CreditMovement, CreditMovementType } from "@/lib/types/database"

interface CreditsHistoryTableProps {
  movements: CreditMovement[]
}

const ITEMS_PER_PAGE = 15

const typeLabels: Record<CreditMovementType, string> = {
  reservation: "Réservation",
  cancellation: "Annulation",
  adjustment: "Ajustement",
  allocation: "Attribution",
  expiration: "Expiration",
}

const typeColors: Record<CreditMovementType, string> = {
  reservation: "bg-blue-100 text-blue-700",
  cancellation: "bg-orange-100 text-orange-700",
  adjustment: "bg-purple-100 text-purple-700",
  allocation: "bg-green-100 text-green-700",
  expiration: "bg-red-100 text-red-700",
}

const filterOptions = [
  { value: "all", label: "Tous les types" },
  { value: "reservation", label: "Réservation" },
  { value: "cancellation", label: "Annulation" },
  { value: "adjustment", label: "Ajustement" },
  { value: "allocation", label: "Attribution" },
  { value: "expiration", label: "Expiration" },
]

export function CreditsHistoryTable({ movements }: CreditsHistoryTableProps) {
  const [typeFilter, setTypeFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)

  const filteredMovements = useMemo(() => {
    let result = movements
    if (typeFilter !== "all") {
      result = result.filter((m) => m.type === typeFilter)
    }
    if (search.trim()) {
      const query = search.toLowerCase().trim()
      result = result.filter((m) =>
        m.description.toLowerCase().includes(query) ||
        typeLabels[m.type].toLowerCase().includes(query) ||
        new Date(m.date).toLocaleDateString("fr-FR").includes(query) ||
        String(m.amount).includes(query)
      )
    }
    return result
  }, [movements, typeFilter, search])

  // Reset page when filters change
  const totalPages = Math.max(1, Math.ceil(filteredMovements.length / ITEMS_PER_PAGE))
  const currentPage = Math.min(page, totalPages)
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  if (movements.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Aucun mouvement de crédit enregistré
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un mouvement..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <SearchableSelect
          options={filterOptions}
          value={typeFilter}
          onValueChange={(v) => { setTypeFilter(v); setPage(1) }}
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
            {paginatedMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground">
                  Aucun mouvement trouvé
                </TableCell>
              </TableRow>
            ) : (
              paginatedMovements.map((movement) => (
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {filteredMovements.length} mouvement{filteredMovements.length > 1 ? "s" : ""}
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
