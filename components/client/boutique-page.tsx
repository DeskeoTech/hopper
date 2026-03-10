"use client"

import { useTranslations } from "next-intl"
import { Coins, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"
import { HopperCafePlans } from "./hopper-cafe-plans"

export function BoutiquePage() {
  const { user } = useClientLayout()
  const t = useTranslations("boutique")

  const handleBuyCredits = () => {
    const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
    window.open(stripeUrl, "_blank")
  }

  const handleBookCoworking = () => {
    const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(user.email || "")}`
    window.open(url, "_blank")
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 pt-4 pb-12 md:px-0 md:pt-6">
      {/* Page Header */}
      <h1 className="font-header text-xl sm:text-2xl font-bold uppercase tracking-tight">
        {t("title")}
      </h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <button
          type="button"
          onClick={handleBuyCredits}
          className={cn(
            "flex flex-col items-center gap-1.5 sm:gap-2 rounded-[16px] bg-[#1B1918] p-3 sm:p-4 transition-all",
            "hover:bg-[#1B1918]/90 active:scale-[0.98]"
          )}
        >
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#F0E8DC]/10 text-[#F0E8DC]">
            <Coins className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <span className="text-center text-[11px] sm:text-xs font-medium text-[#F0E8DC] leading-tight uppercase font-sans">
            {t("buyCredits")}
          </span>
        </button>

        <button
          type="button"
          onClick={handleBookCoworking}
          className={cn(
            "flex flex-col items-center gap-1.5 sm:gap-2 rounded-[16px] bg-card p-3 sm:p-4 transition-all",
            "hover:bg-card/80 active:scale-[0.98]"
          )}
        >
          <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#1B1918]/10 text-[#1B1918]">
            <Ticket className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <span className="text-center text-[11px] sm:text-xs font-medium text-foreground/70 leading-tight uppercase font-sans">
            {t("buyPass")}
          </span>
        </button>
      </div>

      {/* Hopper Café Section — restricted to test account */}
      {user.email === "tech@deskeo.fr" && (
        <section className="space-y-2">
          <h2 className="font-header text-lg sm:text-xl font-bold uppercase tracking-tight">
            {t("cafeTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("cafeDescription")}
          </p>
          <HopperCafePlans />
        </section>
      )}
    </div>
  )
}
