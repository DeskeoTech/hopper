"use client"

import { useState } from "react"
import { Pencil, CreditCard, Users, Coins, Calendar, Info, FileText } from "lucide-react"
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { updateSpacebringSubscription } from "@/lib/actions/companies"
import { toast } from "sonner"

interface SpacebringSubscriptionCardProps {
  companyId: string
  planName: string | null
  monthlyPrice: number | null
  monthlyCredits: number | null
  seats: number | null
  startDate: string | null
}

export function SpacebringSubscriptionCard({
  companyId,
  planName,
  monthlyPrice,
  monthlyCredits,
  seats,
  startDate,
}: SpacebringSubscriptionCardProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [formPlanName, setFormPlanName] = useState(planName || "")
  const [formPrice, setFormPrice] = useState(monthlyPrice?.toString() || "")
  const [formCredits, setFormCredits] = useState(monthlyCredits?.toString() || "")
  const [formSeats, setFormSeats] = useState(seats?.toString() || "")
  const [formStartDate, setFormStartDate] = useState(startDate || "")

  const isConfigured = planName || monthlyPrice || monthlyCredits || seats || startDate

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSpacebringSubscription(companyId, {
      spacebring_plan_name: formPlanName.trim() || null,
      spacebring_monthly_price: formPrice ? Number(formPrice) : null,
      spacebring_monthly_credits: formCredits ? Number(formCredits) : null,
      spacebring_seats: formSeats ? Number(formSeats) : null,
      spacebring_start_date: formStartDate || null,
    })
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      setConfirmOpen(false)
      return
    }
    toast.success("Abonnement hors plateforme mis à jour")
    setOpen(false)
    setConfirmOpen(false)
  }

  return (
    <>
      <div className="relative rounded-lg bg-card p-4 sm:p-6">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="absolute top-4 right-4">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abonnement hors plateforme</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="sb-plan-name">Nom du plan</Label>
                <Input
                  id="sb-plan-name"
                  value={formPlanName}
                  onChange={(e) => setFormPlanName(e.target.value)}
                  placeholder="Ex: Hopper Résidence"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sb-price">Prix mensuel (€)</Label>
                <Input
                  id="sb-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sb-credits">Crédits mensuels</Label>
                <Input
                  id="sb-credits"
                  type="number"
                  min="0"
                  value={formCredits}
                  onChange={(e) => setFormCredits(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sb-seats">Nombre de postes</Label>
                <Input
                  id="sb-seats"
                  type="number"
                  min="0"
                  value={formSeats}
                  onChange={(e) => setFormSeats(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sb-start-date">Date de début</Label>
                <Input
                  id="sb-start-date"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                />
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

        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <FileText className="h-5 w-5" />
          Abonnement hors plateforme
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-center">
                Client Spacebring ou client ne passant pas par la plateforme (ex : paiement par virement bancaire)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>

        {isConfigured ? (
          <div className="space-y-3 text-sm">
            {planName && (
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Plan</span>
                  <p className="text-foreground">{planName}</p>
                </div>
              </div>
            )}
            {monthlyPrice !== null && (
              <div className="flex items-start gap-3">
                <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Prix mensuel</span>
                  <p className="text-foreground">{monthlyPrice} €/mois</p>
                </div>
              </div>
            )}
            {monthlyCredits !== null && (
              <div className="flex items-start gap-3">
                <Coins className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Crédits mensuels</span>
                  <p className="text-foreground">{monthlyCredits} crédits/mois</p>
                </div>
              </div>
            )}
            {seats !== null && (
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Postes</span>
                  <p className="text-foreground">{seats}</p>
                </div>
              </div>
            )}
            {startDate && (
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-muted-foreground">Date de début</span>
                  <p className="text-foreground">
                    {new Date(startDate).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Aucun abonnement configuré. Cliquez sur le crayon pour renseigner les informations.
          </p>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous enregistrer ces informations d'abonnement hors plateforme ?
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
