"use client"

import { ShoppingCart, Coins, Building2, Coffee, ExternalLink, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClientLayout } from "./client-layout-provider"
import { HopperCafePlans } from "./hopper-cafe-plans"

export function BoutiquePage() {
  const { user, plan } = useClientLayout()

  const isUserDisabled = user.status === "disabled"
  const hasActiveContract = plan !== null

  const handleBuyCredits = () => {
    if (isUserDisabled || !hasActiveContract) return
    const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
    window.open(stripeUrl, "_blank")
  }

  const handleBookCoworking = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  // Show restriction message if user is disabled or has no active contract
  const showRestriction = isUserDisabled || !hasActiveContract
  const restrictionMessage = isUserDisabled
    ? "Votre compte est désactivé. Vous ne pouvez pas effectuer d'achats."
    : "Votre entreprise n'a pas de contrat actif. Contactez votre administrateur pour activer votre accès."

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 pt-4 md:px-0 md:pt-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
        </div>
        <div>
          <h1 className="font-header text-xl sm:text-2xl font-bold text-foreground">
            Boutique
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Achetez des crédits et abonnez-vous à nos services
          </p>
        </div>
      </div>

      {/* Restriction Alert */}
      {showRestriction && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-destructive">{restrictionMessage}</p>
        </div>
      )}

      {/* Credits and Coworking Section */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {/* Buy Credits Card */}
        <div className="rounded-[16px] border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
              <Coins className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-header text-base sm:text-lg font-bold text-foreground">
                Crédits
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Achetez des crédits supplémentaires pour réserver des salles de
                réunion
              </p>
              <Button
                className="mt-3 sm:mt-4 w-full sm:w-auto"
                size="sm"
                onClick={handleBuyCredits}
                disabled={showRestriction}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Acheter des Crédits
              </Button>
            </div>
          </div>
        </div>

        {/* Book Coworking Card */}
        <div className="rounded-[16px] border bg-card p-4 sm:p-6 shadow-sm">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-blue-100">
              <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-header text-base sm:text-lg font-bold text-foreground">
                Hopper Coworking
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Réservez un espace de coworking dans nos différents sites
              </p>
              <Button className="mt-3 sm:mt-4 w-full sm:w-auto" size="sm" variant="outline" onClick={handleBookCoworking}>
                <ExternalLink className="mr-2 h-4 w-4" />
                Réserver maintenant
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Hopper Café Section */}
      <div className="rounded-[16px] border bg-card p-4 sm:p-6 shadow-sm">
        <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-orange-100">
            <Coffee className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
          </div>
          <div>
            <h2 className="font-header text-base sm:text-lg font-bold text-foreground">
              Hopper Café
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Abonnez-vous à nos formules boissons et profitez de vos cafés et
              jus préférés chaque jour
            </p>
          </div>
        </div>

        <HopperCafePlans />
      </div>
    </div>
  )
}
