"use client"

import { useState, useMemo } from "react"
import { Coffee, Pencil, Plus, Search, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { CafeBeverageFormModal } from "./cafe-beverage-form-modal"
import {
  deleteCafeBeverage,
  getCafeBeverages,
  type CafeBeverageWithPlans,
} from "@/lib/actions/cafe"

// Couleurs distinctes par famille de forfait
function getPlanColor(plan: string): string {
  const lower = plan.toLowerCase()
  if (lower.includes("espresso") || lower.includes("coffee gang"))
    return "bg-amber-100 text-amber-800 border-amber-200"
  if (lower.includes("infinity"))
    return "bg-violet-100 text-violet-800 border-violet-200"
  if (lower.includes("juice"))
    return "bg-green-100 text-green-800 border-green-200"
  if (lower.includes("latte club") || lower.includes("color"))
    return "bg-pink-100 text-pink-800 border-pink-200"
  if (lower.includes("essential"))
    return "bg-sky-100 text-sky-800 border-sky-200"
  if (lower.includes("corporate"))
    return "bg-slate-100 text-slate-800 border-slate-200"
  return "bg-muted text-muted-foreground"
}

interface CafeBeveragesTabProps {
  initialBeverages: CafeBeverageWithPlans[]
  allPlanNames: string[]
}

export function CafeBeveragesTab({ initialBeverages, allPlanNames }: CafeBeveragesTabProps) {
  const [beverages, setBeverages] = useState(initialBeverages)
  const [search, setSearch] = useState("")
  const [filterPlan, setFilterPlan] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editingBeverage, setEditingBeverage] = useState<CafeBeverageWithPlans | null>(null)
  const [deletingBeverage, setDeletingBeverage] = useState<CafeBeverageWithPlans | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filtered = useMemo(() => {
    let list = beverages
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter((b) => b.name.toLowerCase().includes(q))
    }
    if (filterPlan) {
      list = list.filter((b) => b.plan_names.includes(filterPlan))
    }
    return list
  }, [beverages, search, filterPlan])

  // Unique plan names present in current beverages for filter chips
  const availablePlans = useMemo(() => {
    const set = new Set<string>()
    beverages.forEach((b) => b.plan_names.forEach((p) => set.add(p)))
    return Array.from(set).sort()
  }, [beverages])

  const refreshBeverages = async () => {
    const result = await getCafeBeverages()
    if (!result.error) setBeverages(result.data)
  }

  const handleEdit = (beverage: CafeBeverageWithPlans) => {
    setEditingBeverage(beverage)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deletingBeverage) return
    setDeleting(true)
    await deleteCafeBeverage(deletingBeverage.id)
    setDeletingBeverage(null)
    setDeleting(false)
    await refreshBeverages()
  }

  const handleFormClose = () => {
    setFormOpen(false)
    setEditingBeverage(null)
  }

  return (
    <div className="space-y-5">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher une boisson..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          size="sm"
          className="gap-2 self-end"
          onClick={() => {
            setEditingBeverage(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4" />
          Ajouter une boisson
        </Button>
      </div>

      {/* Filter chips par forfait */}
      {availablePlans.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterPlan(null)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filterPlan === null
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-background text-muted-foreground hover:bg-muted"
            }`}
          >
            Tous ({beverages.length})
          </button>
          {availablePlans.map((plan) => {
            const count = beverages.filter((b) => b.plan_names.includes(plan)).length
            return (
              <button
                key={plan}
                onClick={() => setFilterPlan(filterPlan === plan ? null : plan)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                  filterPlan === plan
                    ? "border-foreground bg-foreground text-background"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {plan} ({count})
              </button>
            )
          })}
        </div>
      )}

      {/* Card grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
          <Coffee className="mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {search || filterPlan ? "Aucune boisson ne correspond" : "Aucune boisson configurée"}
          </p>
          {(search || filterPlan) && (
            <button
              onClick={() => {
                setSearch("")
                setFilterPlan(null)
              }}
              className="mt-2 text-xs text-muted-foreground underline underline-offset-4"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((bev) => (
            <div
              key={bev.id}
              className="group relative rounded-xl border bg-card p-4 transition-colors hover:bg-muted/30"
            >
              {/* Actions */}
              <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={() => handleEdit(bev)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setDeletingBeverage(bev)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Name */}
              <p className="pr-16 font-medium">{bev.name}</p>

              {/* Plan badges */}
              <div className="mt-2.5 flex flex-wrap gap-1">
                {bev.plan_names.length === 0 ? (
                  <span className="text-xs italic text-muted-foreground">Aucun forfait associé</span>
                ) : (
                  bev.plan_names.map((plan) => (
                    <span
                      key={plan}
                      className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${getPlanColor(plan)}`}
                    >
                      {plan}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form modal */}
      {formOpen && (
        <CafeBeverageFormModal
          open={formOpen}
          onClose={handleFormClose}
          onSuccess={refreshBeverages}
          beverage={editingBeverage}
          allPlanNames={allPlanNames}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deletingBeverage} onOpenChange={(v) => !v && setDeletingBeverage(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer « {deletingBeverage?.name} » ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. La boisson sera supprimée ainsi que toutes ses
              associations de forfaits.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
