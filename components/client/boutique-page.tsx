"use client"

import { ShoppingCart, Coins, Building2, Coffee, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useClientLayout } from "./client-layout-provider"
import { HopperCafePlans } from "./hopper-cafe-plans"

export function BoutiquePage() {
  const { user } = useClientLayout()

  const handleBuyCredits = () => {
    const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
    window.open(stripeUrl, "_blank")
  }

  const handleBookCoworking = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

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
              <Button className="mt-3 sm:mt-4 w-full sm:w-auto" size="sm" onClick={handleBuyCredits}>
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
