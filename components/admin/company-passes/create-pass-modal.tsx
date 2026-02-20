"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { getAvailablePlans, createCompanyContract } from "@/lib/actions/companies"
import { toast } from "sonner"

interface CreatePassModalProps {
  companyId: string
}

interface PlanOption {
  id: string
  name: string
  recurrence: string | null
  price_per_seat_month: number | null
}

export function CreatePassModal({ companyId }: CreatePassModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<PlanOption[]>([])
  const [plansLoading, setPlansLoading] = useState(false)

  const [planId, setPlanId] = useState("")
  const [numberOfSeats, setNumberOfSeats] = useState("1")
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [endDate, setEndDate] = useState("")

  useEffect(() => {
    if (open && plans.length === 0) {
      setPlansLoading(true)
      getAvailablePlans().then((result) => {
        if (result.data) setPlans(result.data)
        setPlansLoading(false)
      })
    }
  }, [open, plans.length])

  const selectedPlan = plans.find((p) => p.id === planId)
  const isValid = planId && Number(numberOfSeats) > 0 && startDate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isValid) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await createCompanyContract(companyId, {
      planId,
      numberOfSeats: Number(numberOfSeats),
      startDate,
      endDate: endDate || null,
    })
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      setConfirmOpen(false)
      return
    }
    toast.success("Pass attribué")
    setOpen(false)
    setConfirmOpen(false)
    setPlanId("")
    setNumberOfSeats("1")
    setEndDate("")
    window.location.reload()
  }

  const planOptions = plans.map((p) => ({
    value: p.id,
    label: `${p.name}${p.price_per_seat_month ? ` — ${p.price_per_seat_month}€/mois` : ""}`,
  }))

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Plus className="mr-1 h-4 w-4" />
            Attribuer un pass
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un pass</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>
                Plan <span className="text-destructive">*</span>
              </Label>
              {plansLoading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des plans...
                </div>
              ) : (
                <SearchableSelect
                  options={planOptions}
                  value={planId}
                  onValueChange={setPlanId}
                  placeholder="Sélectionner un plan"
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="seats">
                Nombre de postes <span className="text-destructive">*</span>
              </Label>
              <Input
                id="seats"
                type="number"
                min="1"
                value={numberOfSeats}
                onChange={(e) => setNumberOfSeats(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">
                  Date de début <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!isValid || loading}>
                Attribuer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer l'attribution</AlertDialogTitle>
            <AlertDialogDescription>
              Attribuer le pass &quot;{selectedPlan?.name}&quot; avec{" "}
              {numberOfSeats} poste{Number(numberOfSeats) > 1 ? "s" : ""} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Attribution..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
