"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Minus, Coins, Loader2, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"

interface CreditAdjustmentModalProps {
  companyId: string
  companyName?: string
  currentCredits: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AdjustmentType = "add" | "remove"

export function CreditAdjustmentModal({
  companyId,
  companyName,
  currentCredits,
  open,
  onOpenChange,
}: CreditAdjustmentModalProps) {
  const router = useRouter()
  const [type, setType] = useState<AdjustmentType>("add")
  const [amount, setAmount] = useState("")
  const [reason, setReason] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numAmount = parseInt(amount) || 0
  const newBalance = type === "add"
    ? currentCredits + numAmount
    : currentCredits - numAmount

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (numAmount <= 0) {
      setError("Veuillez entrer un nombre positif")
      return
    }

    if (type === "remove" && numAmount > currentCredits) {
      setError("Impossible de retirer plus de crédits que le solde actuel")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const finalAmount = type === "add" ? numAmount : -numAmount

      const { error: insertError } = await supabase
        .from("credits")
        .insert({
          company_id: companyId,
          allocated_credits: finalAmount,
          extras_credit: true, // Manual adjustments are permanent
          period: new Date().toISOString().split("T")[0],
          reason: reason || null,
        })

      if (insertError) {
        throw new Error(insertError.message)
      }

      // Reset form and close
      setAmount("")
      setReason("")
      setType("add")
      onOpenChange(false)

      // Refresh the page to show updated credits
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  function handleClose() {
    if (!isLoading) {
      setAmount("")
      setReason("")
      setType("add")
      setError(null)
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Coins className="h-5 w-5 text-primary" />
            </div>
            <span>Ajuster les crédits</span>
          </DialogTitle>
          <DialogDescription>
            {companyName ? `Modifier le solde de crédits pour ${companyName}` : "Modifier le solde de crédits"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Balance Display */}
          <div className="rounded-lg border border-border bg-muted/30 p-4 text-center">
            <p className="text-sm text-muted-foreground">Solde actuel</p>
            <p className="text-3xl font-bold text-foreground">{currentCredits}</p>
            <p className="text-xs text-muted-foreground">crédits</p>
          </div>

          {/* Add/Remove Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={type === "add" ? "default" : "outline"}
              className={cn(
                "flex-1 gap-2",
                type === "add" && "bg-green-600 hover:bg-green-700"
              )}
              onClick={() => setType("add")}
            >
              <Plus className="h-4 w-4" />
              Ajouter
            </Button>
            <Button
              type="button"
              variant={type === "remove" ? "default" : "outline"}
              className={cn(
                "flex-1 gap-2",
                type === "remove" && "bg-red-600 hover:bg-red-700"
              )}
              onClick={() => setType("remove")}
            >
              <Minus className="h-4 w-4" />
              Retirer
            </Button>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Nombre de crédits</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-bold text-center h-14"
            />
          </div>

          {/* New Balance Preview */}
          {numAmount > 0 && (
            <div className="flex items-center justify-center gap-3 rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm text-muted-foreground">Nouveau solde :</span>
              <span className={cn(
                "text-xl font-bold",
                newBalance >= 0 ? "text-foreground" : "text-destructive"
              )}>
                {newBalance}
              </span>
              <span className="text-sm text-muted-foreground">crédits</span>
            </div>
          )}

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motif (optionnel)</Label>
            <Textarea
              id="reason"
              placeholder="Ex: Geste commercial, correction d'erreur..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              className={cn(
                "flex-1",
                type === "add" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
              )}
              disabled={isLoading || numAmount <= 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  {type === "add" ? <Plus className="mr-2 h-4 w-4" /> : <Minus className="mr-2 h-4 w-4" />}
                  {type === "add" ? "Ajouter" : "Retirer"} {numAmount > 0 ? numAmount : ""} crédit{numAmount > 1 ? "s" : ""}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
