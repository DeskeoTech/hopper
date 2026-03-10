"use client"

import { useState } from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CafePlanDisplay {
  id: string
  name: string
  price: number
  frequency: "3days" | "5days"
  features: string[]
}

const cafePlans: CafePlanDisplay[] = [
  // 3 days/week
  {
    id: "juice-boost-3",
    name: "JUICE BOOST 3 DAYS",
    price: 34.99,
    frequency: "3days",
    features: [
      "Detox, Jus pressés",
      "2 boissons par jour",
      "3 jours par semaine",
    ],
  },
  {
    id: "color-latte-3",
    name: "COLOR LATTE CLUB 3 DAYS",
    price: 34.99,
    frequency: "3days",
    features: [
      "Ube, Chaï, Golden, Matcha",
      "2 boissons par jour",
      "3 jours par semaine",
    ],
  },
  {
    id: "infinity-coffee-3",
    name: "INFINITY COFFEE CHOICE 3 DAYS",
    price: 39.99,
    frequency: "3days",
    features: [
      "Choix illimité cafétéria (sirops inclus)",
      "2 boissons par jour",
      "3 jours par semaine",
    ],
  },
  // 5 days/week
  {
    id: "unlimited-espresso-5",
    name: "UNLIMITED ESPRESSO 5 DAYS",
    price: 39.99,
    frequency: "5days",
    features: [
      "Espresso, Allongé, Americano",
      "7 boissons par jour",
      "5 jours par semaine",
    ],
  },
  {
    id: "juice-boost-5",
    name: "JUICE BOOST 5 DAYS",
    price: 49.99,
    frequency: "5days",
    features: [
      "Detox, Jus pressés",
      "1 boisson par jour",
      "5 jours par semaine",
    ],
  },
  {
    id: "color-latte-5",
    name: "COLOR LATTE CLUB 5 DAYS",
    price: 49.99,
    frequency: "5days",
    features: [
      "Ube, Chaï, Golden, Matcha",
      "2 boissons par jour",
      "5 jours par semaine",
    ],
  },
  {
    id: "infinity-coffee-5",
    name: "INFINITY COFFEE CHOICE 5 DAYS",
    price: 54.99,
    frequency: "5days",
    features: [
      "Choix illimité cafétéria (sirops inclus)",
      "2 boissons par jour",
      "5 jours par semaine",
    ],
  },
]

export function CafePlansTab() {
  const [frequency, setFrequency] = useState<"3days" | "5days">("3days")

  const filtered = cafePlans.filter((p) => p.frequency === frequency)

  return (
    <div className="space-y-5">
      {/* Frequency toggle */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setFrequency("3days")}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
            frequency === "3days"
              ? "bg-[#1B1918] text-white"
              : "bg-foreground/5 text-foreground hover:bg-foreground/10"
          )}
        >
          3 jours / semaine
        </button>
        <button
          type="button"
          onClick={() => setFrequency("5days")}
          className={cn(
            "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
            frequency === "5days"
              ? "bg-[#1B1918] text-white"
              : "bg-foreground/5 text-foreground hover:bg-foreground/10"
          )}
        >
          5 jours / semaine
        </button>
      </div>

      {/* Plans grid */}
      <div
        className={cn(
          "grid gap-3 grid-cols-1 sm:grid-cols-2",
          frequency === "5days" ? "lg:grid-cols-4" : "lg:grid-cols-3"
        )}
      >
        {filtered.map((plan) => (
          <div key={plan.id} className="flex flex-col rounded-[16px] bg-card border p-5">
            <h4 className="font-bold text-sm leading-tight">{plan.name}</h4>

            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-2xl font-bold">
                {plan.price.toFixed(2).replace(".", ",")}
              </span>
              <span className="text-xs text-muted-foreground">€ / mois</span>
            </div>

            <ul className="mt-4 flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-xs text-muted-foreground"
                >
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-foreground/40" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
