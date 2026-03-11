"use client"

import { useState } from "react"
import { Link2, Loader2, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createSepaCheckoutSession } from "@/lib/actions/stripe"
import { toast } from "sonner"

interface SepaPaymentLinkDialogProps {
  companyId: string
  companyEmail: string | null
  companyName: string | null
}

export function SepaPaymentLinkDialog({
  companyId,
  companyEmail,
  companyName,
}: SepaPaymentLinkDialogProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState(companyEmail || "")
  const [amount, setAmount] = useState("")
  const [loading, setLoading] = useState(false)
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(newOpen: boolean) {
    setOpen(newOpen)
    if (!newOpen) {
      setGeneratedUrl(null)
      setCopied(false)
      setError(null)
      setEmail(companyEmail || "")
      setAmount("")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createSepaCheckoutSession({
      companyId,
      email,
      amountEuros: parseFloat(amount),
    })

    setLoading(false)

    if ("error" in result) {
      setError(result.error)
      return
    }

    setGeneratedUrl(result.url)
    toast.success("Lien de paiement généré")
  }

  async function handleCopy() {
    if (!generatedUrl) return
    await navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    toast.success("Lien copié dans le presse-papier")
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="w-full">
          <Link2 className="mr-2 h-4 w-4" />
          Générer un lien de paiement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lien de paiement récurrent</DialogTitle>
          <DialogDescription>
            Générer un lien de paiement par prélèvement SEPA ou carte
            {companyName ? ` pour ${companyName}` : ""}.
          </DialogDescription>
        </DialogHeader>

        {!generatedUrl ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sepa-email">Email du client</Label>
              <Input
                id="sepa-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="client@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sepa-amount">Montant mensuel (EUR)</Label>
              <Input
                id="sepa-amount"
                type="number"
                required
                min="1"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500.00"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Génération...
                </>
              ) : (
                "Générer le lien"
              )}
            </Button>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Lien de paiement</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={generatedUrl}
                  className="font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopy}
                  className="shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce lien expire dans 24 heures. Le client pourra choisir entre prélèvement SEPA et carte bancaire.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                setGeneratedUrl(null)
                setCopied(false)
                setError(null)
                setAmount("")
              }}
            >
              Générer un autre lien
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
