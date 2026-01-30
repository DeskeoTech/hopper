"use client"

import { useState } from "react"
import { ExternalLink, Loader2, CreditCard, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface StripeActionsProps {
  customerId: string
  customerEmail?: string | null
  companyName?: string
}

export function StripePortalButton({ customerId, customerEmail, companyName }: StripeActionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenPortal() {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const returnUrl = window.location.href

      const { data, error: fnError } = await supabase.functions.invoke(
        "manage-plan",
        {
          body: {
            returnUrl,
            customerId,
            customerEmail,
          },
        }
      )

      if (fnError) {
        throw new Error(fnError.message || "Erreur lors de l'appel au service")
      }

      if (!data?.url) {
        throw new Error("URL du portail non reçue")
      }

      window.open(data.url, "_blank")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-[20px] bg-card p-8 shadow-lg">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-lg font-medium">Connexion à Stripe...</p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Ouverture du portail client{companyName ? ` pour ${companyName}` : ""}.
              <br />
              Une nouvelle fenêtre va s'ouvrir.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Button
          onClick={handleOpenPortal}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <Users className="mr-2 h-4 w-4" />
          Portail client Stripe
        </Button>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    </>
  )
}

interface StripeDashboardButtonProps {
  customerId: string
}

export function StripeDashboardButton({ customerId }: StripeDashboardButtonProps) {
  // Use test mode URL - change to dashboard.stripe.com for production
  const stripeUrl = `https://dashboard.stripe.com/customers/${customerId}`

  return (
    <Button
      asChild
      variant="outline"
      size="sm"
      className="w-full"
    >
      <a href={stripeUrl} target="_blank" rel="noopener noreferrer">
        <ExternalLink className="mr-2 h-4 w-4" />
        Voir sur Stripe
      </a>
    </Button>
  )
}
