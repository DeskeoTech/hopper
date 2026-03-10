"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"

interface CafePlan {
  id: string
  name: string
  price: number
  priceId: string
  frequency: "3days" | "5days"
  features: string[]
}

const cafePlans: CafePlan[] = [
  // 3 days/week
  {
    id: "juice-boost-3",
    name: "JUICE BOOST 3 DAYS",
    price: 34.99,
    priceId: "price_1S5RZiRt8NA57A6vvetHvjv8",
    frequency: "3days",
    features: [
      "Detox, Jus pressés",
      "2 boissons par jour",
      "Valable sur les 3 jours de la semaine",
    ],
  },
  {
    id: "color-latte-3",
    name: "COLOR LATTE CLUB 3 DAYS",
    price: 34.99,
    priceId: "price_1S5RZERt8NA57A6v49IUrlmh",
    frequency: "3days",
    features: [
      "Ube, Chaï, Golden, Matcha",
      "2 boissons par jour",
      "Valable sur 3 jours de la semaine",
    ],
  },
  {
    id: "infinity-coffee-3",
    name: "INFINITY COFFEE CHOICE 3 DAYS",
    price: 39.99,
    priceId: "price_1S5RajRt8NA57A6vPZpvuuUb",
    frequency: "3days",
    features: [
      "Choix illimité sur la cafétéria (syrops inclus)",
      "2 boissons par jour",
      "Valable sur les 3 jours de la semaine",
    ],
  },
  // 5 days/week
  {
    id: "unlimited-espresso-5",
    name: "UNLIMITED ESPRESSO 5 DAYS",
    price: 39.99,
    priceId: "price_1S5RY5Rt8NA57A6v7TbQIKyj",
    frequency: "5days",
    features: [
      "Espresso, Allongé, Americano",
      "7 boissons par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
  {
    id: "juice-boost-5",
    name: "JUICE BOOST 5 DAYS",
    price: 49.99,
    priceId: "price_1S5RYWRt8NA57A6vV0JHfS0x",
    frequency: "5days",
    features: [
      "Detox, Jus pressés",
      "1 boisson par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
  {
    id: "color-latte-5",
    name: "COLOR LATTE CLUB 5 DAYS",
    price: 49.99,
    priceId: "price_1S5RYsRt8NA57A6vs3NIO5Gy",
    frequency: "5days",
    features: [
      "Ube, Chaï, Golden, Matcha",
      "2 boissons par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
  {
    id: "infinity-coffee-5",
    name: "INFINITY COFFEE CHOICE 5 DAYS",
    price: 54.99,
    priceId: "price_1S5RaLRt8NA57A6vxSsGww1b",
    frequency: "5days",
    features: [
      "Choix illimité sur la cafétéria (syrops inclus)",
      "2 boissons par jour",
      "Valable sur les 5 jours de la semaine",
    ],
  },
]

function PlanCard({ plan, userEmail }: { plan: CafePlan; userEmail: string }) {
  const t = useTranslations("cafe")

  const handleSubscribe = () => {
    const stripeUrl = `https://buy.stripe.com/${plan.priceId}?prefilled_email=${encodeURIComponent(userEmail)}`
    window.open(stripeUrl, "_blank")
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
      >
        {t("subscribe")}
      </Button>
    </div>
  )
}

export function HopperCafePlans() {
  const { user } = useClientLayout()
  const t = useTranslations("cafe")
  const [frequency, setFrequency] = useState<"3days" | "5days">("3days")

  const filteredPlans = cafePlans.filter((plan) => plan.frequency === frequency)

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
          <PlanCard key={plan.id} plan={plan} userEmail={user.email || ""} />
        ))}
      </div>
    </div>
  )
}
