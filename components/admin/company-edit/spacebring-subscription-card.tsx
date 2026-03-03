"use client"

import { useState, useMemo } from "react"
import { Pencil, CreditCard, Users, Coins, Calendar, Info, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
  isFromSpacebring: boolean
  planName: string | null
  monthlyPrice: number | null
  monthlyCredits: number | null
  seats: number | null
  startDate: string | null
}

function derivePerPerson(total: number | null, seats: number | null): number | null {
  if (total === null) return null
  if (!seats || seats <= 0) return total
  return Math.round((total / seats) * 100) / 100
}

export function SpacebringSubscriptionCard({
  companyId,
  isFromSpacebring,
  planName,
  monthlyPrice,
  monthlyCredits,
  seats,
  startDate,
}: SpacebringSubscriptionCardProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [enabled, setEnabled] = useState(isFromSpacebring)

  // Form stores per-person values
  const [formPlanName, setFormPlanName] = useState(planName || "")
  const [formPricePerSeat, setFormPricePerSeat] = useState(
    derivePerPerson(monthlyPrice, seats)?.toString() || ""
  )
  const [formCreditsPerPerson, setFormCreditsPerPerson] = useState(
    derivePerPerson(monthlyCredits, seats)?.toString() || ""
  )
  const [formSeats, setFormSeats] = useState(seats?.toString() || "")
  const [formStartDate, setFormStartDate] = useState(startDate || "")

  const isConfigured = planName || monthlyPrice || monthlyCredits || seats || startDate

  // Derived per-person values for display card
  const pricePerSeat = derivePerPerson(monthlyPrice, seats)
  const creditsPerPerson = derivePerPerson(monthlyCredits, seats)

  // Computed totals for form summary
  const formTotals = useMemo(() => {
    const seatsNum = formSeats ? parseInt(formSeats, 10) : 0
    const priceNum = formPricePerSeat ? parseFloat(formPricePerSeat) : 0
    const creditsNum = formCreditsPerPerson ? parseInt(formCreditsPerPerson, 10) : 0
    return {
      totalPrice: Math.round(priceNum * seatsNum * 100) / 100,
      totalCredits: creditsNum * seatsNum,
      seats: seatsNum,
    }
  }, [formPricePerSeat, formCreditsPerPerson, formSeats])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const seatsNum = formSeats ? parseInt(formSeats, 10) : null
    const pricePerSeatNum = formPricePerSeat ? parseFloat(formPricePerSeat) : null
    const creditsPerPersonNum = formCreditsPerPerson ? parseInt(formCreditsPerPerson, 10) : null

    // Save totals to database (price_per_seat * seats, credits_per_person * seats)
    const totalPrice = pricePerSeatNum !== null && seatsNum
      ? Math.round(pricePerSeatNum * seatsNum * 100) / 100
      : pricePerSeatNum
    const totalCredits = creditsPerPersonNum !== null && seatsNum
      ? creditsPerPersonNum * seatsNum
      : creditsPerPersonNum

    const result = await updateSpacebringSubscription(companyId, {
      from_spacebring: enabled,
      spacebring_plan_name: enabled ? (formPlanName.trim() || null) : null,
      spacebring_monthly_price: enabled ? totalPrice : null,
      spacebring_monthly_credits: enabled ? totalCredits : null,
      spacebring_seats: enabled ? seatsNum : null,
      spacebring_start_date: enabled && formStartDate ? formStartDate : null,
    })
    setLoading(false)
    if (result.error) {
      toast.error(result.error)
      setConfirmOpen(false)
      return
    }
    toast.success(enabled ? "Abonnement hors plateforme mis à jour" : "Abonnement hors plateforme désactivé")
    setOpen(false)
    setConfirmOpen(false)
  }

  const handleToggle = async (checked: boolean) => {
    if (!checked) {
      setEnabled(false)
      setLoading(true)
      const result = await updateSpacebringSubscription(companyId, {
        from_spacebring: false,
        spacebring_plan_name: null,
        spacebring_monthly_price: null,
        spacebring_monthly_credits: null,
        spacebring_seats: null,
        spacebring_start_date: null,
      })
      setLoading(false)
      if (result.error) {
        toast.error(result.error)
        setEnabled(true)
        return
      }
      toast.success("Abonnement hors plateforme désactivé")
      setFormPlanName("")
      setFormPricePerSeat("")
      setFormCreditsPerPerson("")
      setFormSeats("")
      setFormStartDate("")
    } else {
      setEnabled(true)
      setLoading(true)
      const result = await updateSpacebringSubscription(companyId, {
        from_spacebring: true,
        spacebring_plan_name: formPlanName.trim() || null,
        spacebring_monthly_price: null,
        spacebring_monthly_credits: null,
        spacebring_seats: null,
        spacebring_start_date: formStartDate || null,
      })
      setLoading(false)
      if (result.error) {
        toast.error(result.error)
        setEnabled(false)
        return
      }
      toast.success("Client marqué comme hors plateforme")
    }
  }

  return (
    <>
      <div className="relative rounded-lg bg-card p-4 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-foreground">
          <FileText className="h-5 w-5" />
          Abonnement hors plateforme
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[260px] text-center">
                Client ne passant pas par la plateforme (ex : paiement par virement bancaire)
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </h2>

        {/* Toggle switch */}
        <div className="mb-4 flex items-center gap-3">
          <Switch
            checked={enabled}
            onCheckedChange={handleToggle}
            disabled={loading}
          />
          <Label className="text-sm text-muted-foreground">
            {enabled ? "Actif" : "Inactif"}
          </Label>
        </div>

        {enabled ? (
          <>
            {/* Edit button */}
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
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="sb-price-per-seat">Prix / poste / mois</Label>
                      <div className="relative">
                        <Input
                          id="sb-price-per-seat"
                          type="number"
                          min="0"
                          step="0.01"
                          value={formPricePerSeat}
                          onChange={(e) => setFormPricePerSeat(e.target.value)}
                          placeholder="0.00"
                          className="pr-12"
                        />
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                          € HT
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="sb-credits-per-person">Crédits / personne / mois</Label>
                      <Input
                        id="sb-credits-per-person"
                        type="number"
                        min="0"
                        value={formCreditsPerPerson}
                        onChange={(e) => setFormCreditsPerPerson(e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sb-seats">Nombre de postes</Label>
                    <Input
                      id="sb-seats"
                      type="number"
                      min="1"
                      value={formSeats}
                      onChange={(e) => setFormSeats(e.target.value)}
                      placeholder="1"
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

                  {/* Computed totals summary */}
                  {formTotals.seats > 0 && (formPricePerSeat || formCreditsPerPerson) && (
                    <div className="rounded-lg border border-border bg-muted/50 p-4">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Récapitulatif mensuel
                      </p>
                      <div className="space-y-1.5 text-sm">
                        {formPricePerSeat && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {formPricePerSeat} € HT x {formTotals.seats} poste{formTotals.seats > 1 ? "s" : ""}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formTotals.totalPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT/mois
                            </span>
                          </div>
                        )}
                        {formCreditsPerPerson && (
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">
                              {formCreditsPerPerson} crédit{parseInt(formCreditsPerPerson) > 1 ? "s" : ""} x {formTotals.seats} personne{formTotals.seats > 1 ? "s" : ""}
                            </span>
                            <span className="font-semibold text-foreground">
                              {formTotals.totalCredits} crédits/mois
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                {pricePerSeat !== null && (
                  <div className="flex items-start gap-3">
                    <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Prix / poste / mois</span>
                      <p className="text-foreground">{pricePerSeat} € HT</p>
                      {seats && seats > 1 && monthlyPrice !== null && (
                        <p className="text-xs text-muted-foreground">
                          Total : {monthlyPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT/mois
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {creditsPerPerson !== null && (
                  <div className="flex items-start gap-3">
                    <Coins className="mt-0.5 h-4 w-4 text-muted-foreground" />
                    <div>
                      <span className="text-muted-foreground">Crédits / personne / mois</span>
                      <p className="text-foreground">{creditsPerPerson} crédits</p>
                      {seats && seats > 1 && monthlyCredits !== null && (
                        <p className="text-xs text-muted-foreground">
                          Total : {monthlyCredits} crédits/mois
                        </p>
                      )}
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
                Cliquez sur le crayon pour renseigner les informations de l&apos;abonnement.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Activez le toggle pour configurer un abonnement hors plateforme.
          </p>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>Voulez-vous enregistrer ces informations d&apos;abonnement hors plateforme ?</p>
                {formTotals.seats > 0 && (formPricePerSeat || formCreditsPerPerson) && (
                  <div className="rounded-md bg-muted p-3 text-sm">
                    {formPlanName && <p className="font-medium">{formPlanName}</p>}
                    <p>{formTotals.seats} poste{formTotals.seats > 1 ? "s" : ""}</p>
                    {formPricePerSeat && (
                      <p>{formTotals.totalPrice.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT/mois</p>
                    )}
                    {formCreditsPerPerson && (
                      <p>{formTotals.totalCredits} crédits/mois</p>
                    )}
                  </div>
                )}
              </div>
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
