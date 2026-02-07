"use client"

import { useState } from "react"
import { Receipt, ExternalLink, Loader2, CreditCard } from "lucide-react"
import { createBillingPortalSession } from "@/lib/actions/billing"
import { useClientLayout } from "./client-layout-provider"
import { AdminContactDialog } from "./admin-contact-dialog"

export function FacturationTab() {
  const { isAdmin, companyAdmin } = useClientLayout()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showContactAdmin, setShowContactAdmin] = useState(false)

  async function handleOpenBillingPortal() {
    if (!isAdmin) {
      setShowContactAdmin(true)
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const returnUrl = `${window.location.origin}/mon-compte?tab=facturation`

      // Call Server Action directly (no edge function needed)
      const result = await createBillingPortalSession(returnUrl)

      if (result.error) {
        throw new Error(result.error)
      }

      if (!result.url) {
        throw new Error("URL de facturation non reçue")
      }

      // Redirect to Stripe Billing Portal
      window.location.href = result.url
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsLoading(false)
    }
  }

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 rounded-[20px] bg-card p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
              <CreditCard className="h-8 w-8 text-foreground/70" />
            </div>
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/70" />
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

      <div className="rounded-[16px] bg-card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Receipt className="h-5 w-5 text-foreground/70" />
          </div>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight">Facturation</h2>
        </div>

        <p className="mb-6 text-muted-foreground">
          Accédez à votre espace de facturation pour consulter vos factures et
          gérer vos informations de paiement.
        </p>

        <button
          type="button"
          onClick={handleOpenBillingPortal}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1B1918] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90 disabled:opacity-50 sm:w-auto"
        >
          <ExternalLink className="h-4 w-4" />
          Accéder à mon compte facturation
        </button>

        {error && (
          <p className="mt-4 rounded-[12px] bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
        )}
      </div>

      <AdminContactDialog
        open={showContactAdmin}
        onOpenChange={setShowContactAdmin}
        admin={companyAdmin}
        actionType="billing"
      />
    </>
  )
}
