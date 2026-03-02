"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Receipt, ExternalLink, Loader2, CreditCard } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useClientLayout } from "./client-layout-provider"
import { AdminContactDialog } from "./admin-contact-dialog"

export function FacturationTab() {
  const { isAdmin, companyAdmin, user } = useClientLayout()
  const t = useTranslations("billing")
  const tc = useTranslations("common")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showContactAdmin, setShowContactAdmin] = useState(false)

  const customerId = user.companies?.customer_id_stripe ?? null

  async function handleOpenBillingPortal() {
    if (!isAdmin) {
      setShowContactAdmin(true)
      return
    }

    if (!customerId) {
      setError(t("noStripeAccount"))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const returnUrl = `${window.location.origin}/mon-compte?tab=facturation`

      const { data, error: fnError } = await supabase.functions.invoke(
        "manage-plan",
        {
          body: {
            returnUrl,
            customerId,
            customerEmail: user.email,
          },
        }
      )

      if (fnError) {
        throw new Error(fnError.message || t("serviceError"))
      }

      if (!data?.url) {
        throw new Error(t("urlError"))
      }

      // Redirect to Stripe Billing Portal
      window.location.href = data.url
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      // Ne jamais afficher d'identifiants Stripe (cus_, sub_, pi_, etc.) dans les erreurs
      const isSafe = message && !/cus_|sub_|pi_|ch_|pm_|price_|prod_/.test(message)
      setError(isSafe ? message : tc("errorOccurred"))
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
              <p className="text-lg font-medium">{t("connecting")}</p>
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {t("preparing")}
              <br />
              {t("redirecting")}
            </p>
          </div>
        </div>
      )}

      <div className="rounded-[16px] bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Receipt className="h-5 w-5 text-foreground/70" />
          </div>
          <h2 className="font-header text-xl sm:text-lg font-bold uppercase tracking-tight">{t("title")}</h2>
        </div>

        <p className="mb-6 text-base sm:text-sm text-muted-foreground">
          {t("description")}
        </p>

        <button
          type="button"
          onClick={handleOpenBillingPortal}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1B1918] px-6 py-3.5 sm:py-3 text-base sm:text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90 disabled:opacity-50 sm:w-auto"
        >
          <ExternalLink className="h-5 w-5 sm:h-4 sm:w-4" />
          {t("openPortal")}
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
