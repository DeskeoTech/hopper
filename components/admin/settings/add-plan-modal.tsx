"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createPlan } from "@/lib/actions/plans"
import type { PlanRecurrence, PlanServiceType } from "@/lib/types/database"

export function AddPlanModal() {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [pricePerSeat, setPricePerSeat] = useState("")
  const [creditsPerMonth, setCreditsPerMonth] = useState("")
  const [creditsPerPerson, setCreditsPerPerson] = useState("")
  const [recurrence, setRecurrence] = useState<PlanRecurrence | "">("")
  const [serviceType, setServiceType] = useState<PlanServiceType | "">("")
  const [notes, setNotes] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await createPlan({
      name: name.trim(),
      price_per_seat_month: pricePerSeat ? parseFloat(pricePerSeat) : null,
      credits_per_month: creditsPerMonth ? parseFloat(creditsPerMonth) : null,
      credits_per_person_month: creditsPerPerson ? parseFloat(creditsPerPerson) : null,
      recurrence: recurrence || null,
      service_type: serviceType || null,
      notes: notes.trim() || null,
    })
    setLoading(false)
    if (result.success) {
      resetForm()
      setOpen(false)
      setConfirmOpen(false)
    }
  }

  const resetForm = () => {
    setName("")
    setPricePerSeat("")
    setCreditsPerMonth("")
    setCreditsPerPerson("")
    setRecurrence("")
    setServiceType("")
    setNotes("")
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            Ajouter un forfait
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Ajouter un forfait</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Premium, Flex..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pricePerSeat">Prix par siège/mois</Label>
                <Input
                  id="pricePerSeat"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePerSeat}
                  onChange={(e) => setPricePerSeat(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditsPerMonth">Crédits par mois</Label>
                <Input
                  id="creditsPerMonth"
                  type="number"
                  step="1"
                  min="0"
                  value={creditsPerMonth}
                  onChange={(e) => setCreditsPerMonth(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="creditsPerPerson">Crédits par personne/mois</Label>
              <Input
                id="creditsPerPerson"
                type="number"
                step="1"
                min="0"
                value={creditsPerPerson}
                onChange={(e) => setCreditsPerPerson(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recurrence">Récurrence</Label>
                <Select value={recurrence} onValueChange={(v) => setRecurrence(v as PlanRecurrence)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Quotidien</SelectItem>
                    <SelectItem value="weekly">Hebdomadaire</SelectItem>
                    <SelectItem value="monthly">Mensuel</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceType">Type de service</Label>
                <Select value={serviceType} onValueChange={(v) => setServiceType(v as PlanServiceType)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plan">Forfait</SelectItem>
                    <SelectItem value="credit_purchase">Achat de crédits</SelectItem>
                    <SelectItem value="coffee_subscription">Abonnement café</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Création..." : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la création</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment créer le forfait &quot;{name}&quot; ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Création..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
