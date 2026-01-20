"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { cancelCompanySubscription } from "@/lib/actions/companies"

interface CancelSubscriptionModalProps {
  companyId: string
  companyName: string | null
  currentEndDate: string | null
  trigger?: React.ReactNode
}

export function CancelSubscriptionModal({
  companyId,
  companyName,
  currentEndDate,
  trigger,
}: CancelSubscriptionModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [endDate, setEndDate] = useState(
    currentEndDate || new Date().toISOString().split("T")[0]
  )
  const [cancelNow, setCancelNow] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleCancelNow = () => {
    setCancelNow(true)
    setEndDate(new Date().toISOString().split("T")[0])
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await cancelCompanySubscription(companyId, endDate)
    setLoading(false)
    if (result.success) {
      setOpen(false)
      setConfirmOpen(false)
      setCancelNow(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || <Button variant="destructive">Resilier</Button>}
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resilier l'abonnement</DialogTitle>
            <DialogDescription>
              Resilier l'abonnement de {companyName || "cette entreprise"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="endDate">Date de fin d'abonnement</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
              />
              <p className="text-xs text-muted-foreground">
                L'abonnement sera actif jusqu'a cette date
              </p>
            </div>
            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCancelNow}
              >
                Resilier immediatement
              </Button>
              <Button type="submit" disabled={loading}>
                Definir la date de fin
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la resiliation</AlertDialogTitle>
            <AlertDialogDescription>
              {cancelNow
                ? `L'abonnement de "${companyName}" sera resilie immediatement. Cette action est irreversible.`
                : `L'abonnement de "${companyName}" prendra fin le ${new Date(endDate).toLocaleDateString("fr-FR")}. Confirmez-vous cette action ?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelNow(false)}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Resiliation..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
