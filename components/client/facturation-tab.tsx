"use client"

import { useState } from "react"
import { Receipt, ExternalLink, Loader2, CreditCard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export function FacturationTab() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleOpenBillingPortal() {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const returnUrl = `${window.location.origin}/mon-compte?tab=facturation`

      const { data, error: fnError } = await supabase.functions.invoke(
        "manage-plan",
        {
          body: { returnUrl },
        }
      )

      if (fnError) {
        console.error("Edge function error:", fnError)
        throw new Error(fnError.message || "Erreur lors de l'appel au service")
      }

      console.log("Edge function response:", data)

      if (!data?.url) {
        throw new Error("URL de facturation non reçue")
      }

      window.location.href = data.url
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Une erreur est survenue"
      )
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
              Préparation de votre espace de facturation.
              <br />
              Vous allez être redirigé dans quelques instants.
            </p>
          </div>
        </div>
      )}

      <div className="rounded-[16px] bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Receipt className="h-5 w-5 text-foreground/50" />
          <h2 className="text-lg font-semibold">Facturation</h2>
        </div>

        <p className="mb-6 text-muted-foreground">
          Accédez à votre espace de facturation pour consulter vos factures et
          gérer vos informations de paiement.
        </p>

        <Button
          onClick={handleOpenBillingPortal}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          Accéder à mon compte facturation
        </Button>

        {error && (
          <p className="mt-3 text-xs text-destructive">{error}</p>
        )}
      </div>
    </>
  )
}
