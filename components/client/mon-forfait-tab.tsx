"use client"

import { CreditCard } from "lucide-react"
import { useClientLayout } from "./client-layout-provider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { ContractHistoryItem } from "@/lib/actions/contracts"

interface MonForfaitTabProps {
  initialContractHistory: ContractHistoryItem[] | null
}

const statusLabels: Record<string, string> = {
  active: "Actif",
  suspended: "Suspendu",
  terminated: "Terminé",
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-orange-100 text-orange-700",
  terminated: "bg-gray-100 text-gray-700",
}

export function MonForfaitTab({ initialContractHistory }: MonForfaitTabProps) {
  const { plan } = useClientLayout()

  const activeContract = initialContractHistory?.find((c) => c.status === "active")

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="rounded-[16px] bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-foreground/50" />
          <h2 className="text-lg font-semibold">Forfait actuel</h2>
        </div>

        {plan ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-medium uppercase text-foreground/60">Forfait</p>
              <p className="mt-1 text-lg font-semibold">{plan.name}</p>
            </div>
            {activeContract?.number_of_seats && (
              <div>
                <p className="text-xs font-medium uppercase text-foreground/60">Nombre de postes</p>
                <p className="mt-1 font-medium">
                  {activeContract.number_of_seats} poste{activeContract.number_of_seats > 1 ? "s" : ""}
                </p>
              </div>
            )}
            {activeContract?.start_date && (
              <div>
                <p className="text-xs font-medium uppercase text-foreground/60">Date de début</p>
                <p className="mt-1 font-medium">
                  {new Date(activeContract.start_date).toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
            {activeContract?.commitment_end_date && (
              <div>
                <p className="text-xs font-medium uppercase text-foreground/60">Fin d&apos;engagement</p>
                <p className="mt-1 font-medium">
                  {new Date(activeContract.commitment_end_date).toLocaleDateString("fr-FR")}
                </p>
              </div>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground">Aucun forfait actif</p>
        )}
      </div>

      {/* Contract History */}
      <div className="rounded-[16px] bg-card p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-semibold">Historique des contrats</h3>

        {!initialContractHistory || initialContractHistory.length === 0 ? (
          <p className="text-muted-foreground">Aucun historique de contrat</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forfait</TableHead>
                  <TableHead className="hidden sm:table-cell">Date début</TableHead>
                  <TableHead className="hidden sm:table-cell">Date fin</TableHead>
                  <TableHead className="hidden md:table-cell">Postes</TableHead>
                  <TableHead className="hidden md:table-cell">Prix TTC/mois</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialContractHistory.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium">{contract.plan_name}</TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {contract.start_date
                        ? new Date(contract.start_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {contract.commitment_end_date
                        ? new Date(contract.commitment_end_date).toLocaleDateString("fr-FR")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contract.number_of_seats ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contract.price_per_seat_month
                        ? `${contract.price_per_seat_month.toLocaleString("fr-FR")} €`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          statusColors[contract.status] || "bg-gray-100 text-gray-700"
                        )}
                      >
                        {statusLabels[contract.status] || contract.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
