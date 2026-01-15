"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { updateSitePlans } from "@/lib/actions/plans"
import type { Plan } from "@/lib/types/database"

interface EditPlansModalProps {
  siteId: string
  allPlans: Plan[]
  linkedPlanIds: string[]
}

export function EditPlansModal({
  siteId,
  allPlans,
  linkedPlanIds,
}: EditPlansModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedPlanIds, setSelectedPlanIds] = useState<string[]>(linkedPlanIds)

  const togglePlan = (planId: string) => {
    setSelectedPlanIds((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSitePlans(siteId, selectedPlanIds)
    setLoading(false)
    if (result.success) {
      setOpen(false)
    }
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (isOpen) {
      setSelectedPlanIds(linkedPlanIds)
    }
  }

  const formatPlanDetails = (plan: Plan) => {
    if (plan.price_per_seat_month) {
      return `${plan.price_per_seat_month} EUR/siège`
    }
    if (plan.credits_per_month) {
      return `${plan.credits_per_month} crédits`
    }
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="absolute top-4 right-4">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les forfaits</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Forfaits disponibles</Label>
              {allPlans.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                  {allPlans.map((plan) => {
                    const details = formatPlanDetails(plan)
                    return (
                      <div key={plan.id} className="flex items-start space-x-2">
                        <Checkbox
                          id={plan.id}
                          checked={selectedPlanIds.includes(plan.id)}
                          onCheckedChange={() => togglePlan(plan.id)}
                        />
                        <Label htmlFor={plan.id} className="font-normal cursor-pointer leading-tight">
                          <span>{plan.name}</span>
                          {details && (
                            <span className="text-muted-foreground text-xs ml-1">
                              · {details}
                            </span>
                          )}
                        </Label>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucun forfait disponible</p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment enregistrer ces modifications ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Enregistrement..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
