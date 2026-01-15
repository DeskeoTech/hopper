"use client"

import { useState, useEffect } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updatePlan, updatePlanSites } from "@/lib/actions/plans"
import type { Plan, PlanRecurrence, PlanServiceType, Site } from "@/lib/types/database"

interface EditPlanModalProps {
  plan: Plan
  sites: Site[]
  planSiteIds: string[]
}

export function EditPlanModal({ plan, sites, planSiteIds }: EditPlanModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(plan.name)
  const [pricePerSeat, setPricePerSeat] = useState(plan.price_per_seat_month?.toString() || "")
  const [creditsPerMonth, setCreditsPerMonth] = useState(plan.credits_per_month?.toString() || "")
  const [creditsPerPerson, setCreditsPerPerson] = useState(plan.credits_per_person_month?.toString() || "")
  const [recurrence, setRecurrence] = useState<PlanRecurrence | "">(plan.recurrence || "")
  const [serviceType, setServiceType] = useState<PlanServiceType | "">(plan.service_type || "")
  const [notes, setNotes] = useState(plan.notes || "")
  const [selectedSiteIds, setSelectedSiteIds] = useState<string[]>(planSiteIds)

  useEffect(() => {
    if (open) {
      setName(plan.name)
      setPricePerSeat(plan.price_per_seat_month?.toString() || "")
      setCreditsPerMonth(plan.credits_per_month?.toString() || "")
      setCreditsPerPerson(plan.credits_per_person_month?.toString() || "")
      setRecurrence(plan.recurrence || "")
      setServiceType(plan.service_type || "")
      setNotes(plan.notes || "")
      setSelectedSiteIds(planSiteIds)
    }
  }, [open, plan, planSiteIds])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)

    const planResult = await updatePlan(plan.id, {
      name: name.trim(),
      price_per_seat_month: pricePerSeat ? parseFloat(pricePerSeat) : null,
      credits_per_month: creditsPerMonth ? parseFloat(creditsPerMonth) : null,
      credits_per_person_month: creditsPerPerson ? parseFloat(creditsPerPerson) : null,
      recurrence: recurrence || null,
      service_type: serviceType || null,
      notes: notes.trim() || null,
    })

    if (planResult.error) {
      setLoading(false)
      return
    }

    const sitesResult = await updatePlanSites(plan.id, selectedSiteIds)

    setLoading(false)
    if (sitesResult.success) {
      setOpen(false)
      setConfirmOpen(false)
    }
  }

  const handleSiteToggle = (siteId: string, checked: boolean) => {
    if (checked) {
      setSelectedSiteIds([...selectedSiteIds, siteId])
    } else {
      setSelectedSiteIds(selectedSiteIds.filter((id) => id !== siteId))
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier le forfait</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nom *</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Premium, Flex..."
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-pricePerSeat">Prix par siège/mois</Label>
                <Input
                  id="edit-pricePerSeat"
                  type="number"
                  step="0.01"
                  min="0"
                  value={pricePerSeat}
                  onChange={(e) => setPricePerSeat(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-creditsPerMonth">Crédits par mois</Label>
                <Input
                  id="edit-creditsPerMonth"
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
              <Label htmlFor="edit-creditsPerPerson">Crédits par personne/mois</Label>
              <Input
                id="edit-creditsPerPerson"
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
                <Label htmlFor="edit-recurrence">Récurrence</Label>
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
                <Label htmlFor="edit-serviceType">Type de service</Label>
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
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes additionnelles..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Sites associés</Label>
              <div className="rounded-lg border p-3 max-h-40 overflow-y-auto space-y-2">
                {sites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Aucun site disponible</p>
                ) : (
                  sites.map((site) => (
                    <div key={site.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`site-${site.id}`}
                        checked={selectedSiteIds.includes(site.id)}
                        onCheckedChange={(checked) => handleSiteToggle(site.id, checked as boolean)}
                      />
                      <label
                        htmlFor={`site-${site.id}`}
                        className="text-sm cursor-pointer"
                      >
                        {site.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {selectedSiteIds.length} site(s) sélectionné(s)
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
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
              Voulez-vous vraiment enregistrer les modifications du forfait &quot;{name}&quot; ?
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
