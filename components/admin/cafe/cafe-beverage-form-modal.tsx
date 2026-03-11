"use client"

import { useState } from "react"
import { Check, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createCafeBeverage, updateCafeBeverage, type CafeBeverageWithPlans } from "@/lib/actions/cafe"

interface CafeBeverageFormModalProps {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  beverage?: CafeBeverageWithPlans | null
  allPlanNames: string[]
}

export function CafeBeverageFormModal({
  open,
  onClose,
  onSuccess,
  beverage,
  allPlanNames,
}: CafeBeverageFormModalProps) {
  const [name, setName] = useState(beverage?.name || "")
  const [selectedPlans, setSelectedPlans] = useState<string[]>(beverage?.plan_names || [])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!beverage

  const togglePlan = (planName: string) => {
    setSelectedPlans((prev) =>
      prev.includes(planName) ? prev.filter((p) => p !== planName) : [...prev, planName]
    )
  }

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("Le nom est requis")
      return
    }

    setSubmitting(true)
    setError(null)

    const result = isEditing
      ? await updateCafeBeverage(beverage!.id, name, selectedPlans)
      : await createCafeBeverage(name, selectedPlans)

    if (result.success) {
      onSuccess()
      onClose()
    } else {
      setError(result.error)
    }
    setSubmitting(false)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier la boisson" : "Ajouter une boisson"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          <div className="space-y-2">
            <Label htmlFor="beverage-name">Nom de la boisson</Label>
            <Input
              id="beverage-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Cappuccino"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Forfaits éligibles</Label>
              {selectedPlans.length > 0 && (
                <button
                  onClick={() => setSelectedPlans([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Tout désélectionner
                </button>
              )}
            </div>

            {/* Selected plans as removable chips */}
            {selectedPlans.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {selectedPlans.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => togglePlan(plan)}
                    className="inline-flex items-center gap-1 rounded-full bg-foreground px-2.5 py-1 text-xs font-medium text-background transition-opacity hover:opacity-80"
                  >
                    {plan}
                    <X className="h-3 w-3" />
                  </button>
                ))}
              </div>
            )}

            {/* Plan list */}
            <div className="max-h-[250px] space-y-0.5 overflow-y-auto rounded-xl border p-1.5">
              {allPlanNames.map((plan) => {
                const selected = selectedPlans.includes(plan)
                return (
                  <button
                    key={plan}
                    onClick={() => togglePlan(plan)}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      selected
                        ? "bg-foreground/5 font-medium"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded border transition-colors ${
                        selected
                          ? "border-foreground bg-foreground text-background"
                          : "border-border"
                      }`}
                    >
                      {selected && <Check className="h-3 w-3" />}
                    </div>
                    {plan}
                  </button>
                )
              })}
              {allPlanNames.length === 0 && (
                <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                  Aucun forfait café trouvé
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? "Enregistrement..." : isEditing ? "Enregistrer" : "Ajouter"}
            </Button>
            <Button onClick={onClose} variant="outline">
              Annuler
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
