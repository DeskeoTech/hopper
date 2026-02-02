"use client"

import { useState } from "react"
import { Coffee, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"

interface CafePlan {
  id: string
  name: string
  description: string
  price: number
  priceId: string
  perDay: number
  perWeek: number
  frequency: "3days" | "5days"
  isPopular?: boolean
  icon?: string
}

const cafePlans: CafePlan[] = [
  // 3 days/week
  {
    id: "color-latte-3",
    name: "COLOR LATTE CLUB",
    description: "Ube, Chaï, Matcha ou Golden Latte",
    price: 34.99,
    priceId: "price_1S5RZERt8NA57A6v49IUrlmh",
    perDay: 2,
    perWeek: 6,
    frequency: "3days",
    icon: "latte",
  },
  {
    id: "infinity-coffee-3",
    name: "INFINITY COFFEE CHOICE",
    description: "Lait amande, avoine, coco ou soja",
    price: 59.99,
    priceId: "price_1S5RajRt8NA57A6vPZpvuuUb",
    perDay: 2,
    perWeek: 6,
    frequency: "3days",
    icon: "coffee",
  },
  {
    id: "juice-boost-3",
    name: "JUICE BOOST",
    description: "Jus detox, Détox Minute ou Jus de fruits",
    price: 34.99,
    priceId: "price_1S5RZiRt8NA57A6vvetHvjv8",
    perDay: 1,
    perWeek: 3,
    frequency: "3days",
    icon: "juice",
  },
  // 5 days/week
  {
    id: "color-latte-5",
    name: "COLOR LATTE CLUB",
    description: "Ube, Chaï, Matcha ou Golden Latte",
    price: 39.99,
    priceId: "price_1S5RYsRt8NA57A6vs3NIO5Gy",
    perDay: 2,
    perWeek: 10,
    frequency: "5days",
    icon: "latte",
  },
  {
    id: "infinity-coffee-5",
    name: "INFINITY COFFEE CHOICE",
    description: "Lait amande, avoine, coco ou soja",
    price: 59.99,
    priceId: "price_1S5RaLRt8NA57A6vxSsGww1b",
    perDay: 2,
    perWeek: 10,
    frequency: "5days",
    isPopular: true,
    icon: "coffee",
  },
  {
    id: "juice-boost-5",
    name: "JUICE BOOST",
    description: "Jus detox, Détox Minute ou Jus de fruits",
    price: 49.99,
    priceId: "price_1S5RYWRt8NA57A6vV0JHfS0x",
    perDay: 1,
    perWeek: 5,
    frequency: "5days",
    icon: "juice",
  },
  {
    id: "unlimited-espresso-5",
    name: "UNLIMITED ESPRESSO",
    description: "Allongé, Espresso ou Americano",
    price: 49.99,
    priceId: "price_1S5RY5Rt8NA57A6v7TbQIKyj",
    perDay: 5,
    perWeek: 25,
    frequency: "5days",
    icon: "espresso",
  },
]

function PlanCard({ plan, userEmail }: { plan: CafePlan; userEmail: string }) {
  const handleSubscribe = () => {
    const stripeUrl = `https://buy.stripe.com/${plan.priceId}?prefilled_email=${encodeURIComponent(userEmail)}`
    window.open(stripeUrl, "_blank")
  }

  return (
    <div
      className={cn(
        "relative rounded-[16px] border bg-card p-4 sm:p-5 transition-all duration-200 hover:border-primary/50 hover:-translate-y-0.5 ",
        plan.isPopular && "border-primary/30 ring-1 ring-primary/20"
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-4 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
          <Sparkles className="h-3 w-3" />
          Populaire
        </div>
      )}

      <h4 className="font-header text-base sm:text-lg font-bold text-foreground mt-1">
        {plan.name}
      </h4>

      <p className="mt-1 text-xs sm:text-sm text-muted-foreground">{plan.description}</p>

      <div className="mt-3 sm:mt-4 flex items-baseline gap-1">
        <span className="text-2xl sm:text-3xl font-bold text-foreground">
          {plan.price.toFixed(2).replace(".", ",")}
        </span>
        <span className="text-xs sm:text-sm text-muted-foreground">€/mois</span>
      </div>

      <div className="mt-2 sm:mt-3 flex items-center gap-2">
        <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Coffee className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
        </div>
        <div className="text-xs sm:text-sm">
          <span className="font-semibold text-foreground">{plan.perDay}</span>{" "}
          <span className="text-muted-foreground">
            boisson{plan.perDay > 1 ? "s" : ""}/jour
          </span>
          <span className="text-muted-foreground"> · </span>
          <span className="font-semibold text-foreground">{plan.perWeek}</span>{" "}
          <span className="text-muted-foreground">/sem.</span>
        </div>
      </div>

      <Button className="mt-3 sm:mt-4 w-full" size="sm" onClick={handleSubscribe}>
        Souscrire
      </Button>
    </div>
  )
}

export function HopperCafePlans() {
  const { user } = useClientLayout()
  const [frequency, setFrequency] = useState<"3days" | "5days">("5days")

  const filteredPlans = cafePlans.filter((plan) => plan.frequency === frequency)

  return (
    <div className="space-y-4 sm:space-y-6">
      <Tabs
        value={frequency}
        onValueChange={(v) => setFrequency(v as "3days" | "5days")}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-4 sm:mb-6">
          <TabsTrigger value="3days" className="text-xs sm:text-sm">
            3 jours / sem.
          </TabsTrigger>
          <TabsTrigger value="5days" className="text-xs sm:text-sm">
            5 jours / sem.
            <span className="ml-1 sm:ml-2 hidden sm:inline rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">
              + de choix
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="3days" className="mt-0">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} userEmail={user.email || ""} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="5days" className="mt-0">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {filteredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} userEmail={user.email || ""} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
