"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Check, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"
import { createCafeCheckoutSession } from "@/lib/actions/stripe"
import { getCafePlansForSite, type CafePlanWithPrice } from "@/lib/actions/cafe"

// Plan features and frequency metadata (static, not Stripe-dependent)
const PLAN_META: Record<string, { frequency: "3days" | "5days"; features: string[] }> = {
  "JUICE BOOST 3 DAYS": {
    frequency: "3days",
    features: [
      "Detox, Jus pressés",
      "2 boissons par jour",
      "Valable sur les 3 jours de la semaine",
    ],
  },
  "COLOR LATTE CLUB 3 DAYS": {
    frequency: "3days",
    features: [
      "Ube, Chaï, Golden, Matcha",
      "2 boissons par jour",
      "Valable sur 3 jours de la semaine",
    ],
  },
  "INFINITY COFFEE CHOICE 3 DAYS": {
    frequency: "3days",
    features: [
      "Choix illimité sur la cafétéria (syrops inclus)",
      "2 boissons par jour",
      "Valable sur les 3 jours de la semaine",
    ],
  },
  "UNLIMITED ESPRESSO 5 DAYS": {
    frequency: "5days",
    features: [
      "Espresso, Allongé, Americano",
      "7 boissons par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
  "JUICE BOOST 5 DAYS": {
    frequency: "5days",
    features: [
      "Detox, Jus pressés",
      "1 boisson par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
  "COLOR LATTE CLUB 5 DAYS": {
    frequency: "5days",
    features: [
      "Ube, Chaï, Golden, Matcha",
      "2 boissons par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
  "INFINITY COFFEE CHOICE 5 DAYS": {
    frequency: "5days",
    features: [
      "Choix illimité sur la cafétéria (syrops inclus)",
      "2 boissons par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
}

interface CafePlan {
  name: string
  price: number
  priceId: string
  frequency: "3days" | "5days"
  features: string[]
}

function PlanCard({ plan, userEmail, siteId }: { plan: CafePlan; userEmail: string; siteId: string | null }) {
  const t = useTranslations("cafe")
  const [loading, setLoading] = useState(false)

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const result = await createCafeCheckoutSession({
        priceId: plan.priceId,
        customerEmail: userEmail,
        siteId: siteId || undefined,
      })
      if ("error" in result) {
        console.error(result.error)
        return
      }
      window.location.href = result.url
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col rounded-[16px] bg-card p-5">
      <h4 className="font-header text-sm sm:text-base font-bold text-foreground leading-tight">
        {plan.name}
      </h4>

      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">
          {plan.price.toFixed(2).replace(".", ",")}
        </span>
        <span className="text-xs text-muted-foreground">{t("perMonth")}</span>
      </div>

      <ul className="mt-4 space-y-2 flex-1">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-xs text-muted-foreground">
            <Check className="h-3.5 w-3.5 shrink-0 text-foreground/40 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <Button
        className="mt-4 w-full rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 uppercase text-xs font-semibold tracking-wide"
        size="sm"
        onClick={handleSubscribe}
        disabled={loading}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("subscribe")}
      </Button>
    </div>
  )
}

export function HopperCafePlans() {
  const { user, selectedSiteId } = useClientLayout()
  const t = useTranslations("cafe")
  const [frequency, setFrequency] = useState<"3days" | "5days">("3days")
  const [plans, setPlans] = useState<CafePlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPlans() {
      setLoading(true)
      try {
        if (!selectedSiteId) return
        const dbPlans = await getCafePlansForSite(selectedSiteId)
        const mapped = dbPlans
          .map((p) => {
            const meta = PLAN_META[p.name]
            if (!meta) return null
            return {
              name: p.name,
              price: p.price_per_seat_month,
              priceId: p.stripe_price_id,
              frequency: meta.frequency,
              features: meta.features,
            }
          })
          .filter((p): p is CafePlan => p !== null)
        setPlans(mapped)
      } finally {
        setLoading(false)
      }
    }
    fetchPlans()
  }, [selectedSiteId])

  const filteredPlans = plans.filter((plan) => plan.frequency === frequency)

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Frequency toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFrequency("3days")}
          className={cn(
            "rounded-full px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wide transition-colors",
            frequency === "3days"
              ? "bg-[#1B1918] text-white"
              : "bg-foreground/5 text-foreground"
          )}
        >
          {t("threeDays")}
        </button>
        <button
          type="button"
          onClick={() => setFrequency("5days")}
          className={cn(
            "rounded-full px-4 py-2 text-xs sm:text-sm font-semibold uppercase tracking-wide transition-colors",
            frequency === "5days"
              ? "bg-[#1B1918] text-white"
              : "bg-foreground/5 text-foreground"
          )}
        >
          {t("fiveDays")}
        </button>
      </div>

      {/* Plans grid */}
      <div className={cn(
        "grid gap-3 grid-cols-1 sm:grid-cols-2",
        frequency === "5days" ? "lg:grid-cols-4" : "lg:grid-cols-3"
      )}>
        {filteredPlans.map((plan) => (
          <PlanCard key={plan.name} plan={plan} userEmail={user.email || ""} siteId={selectedSiteId} />
        ))}
      </div>
    </div>
  )
}
