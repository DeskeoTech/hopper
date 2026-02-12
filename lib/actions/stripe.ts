"use server"

import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"

const PASS_PRICES = {
  day: 3000, // 30€ in cents
  week: 10000, // 100€ in cents
  month: 30000, // 300€ in cents
}

const BOOKING_TYPES: Record<string, string> = {
  day: "Hopper Pass Day",
  week: "Hopper Pass Week",
  month: "Hopper Pass Month",
}

function formatDateShort(isoDate: string): string {
  const d = new Date(isoDate)
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function getStripe() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    throw new Error("Configuration Stripe manquante")
  }
  return new Stripe(stripeSecretKey, {
    apiVersion: "2024-12-18.acacia",
  })
}

interface CheckoutParams {
  siteId: string
  siteName: string
  passType: string
  seats: number
  dates: string[]
  days?: number
  weeks?: number
  returnPath?: string
  includeTax?: boolean
  customerEmail?: string
}

export async function createCheckoutSession(params: CheckoutParams): Promise<{ url: string; sessionId: string } | { error: string }> {
  try {
    const stripe = getStripe()

    const { siteId, siteName, passType, seats, dates, days, weeks, returnPath, includeTax, customerEmail } = params

    if (!siteId || !siteName || !passType || !seats || !dates || dates.length === 0) {
      return { error: "Paramètres manquants" }
    }

    const basePrice = PASS_PRICES[passType as keyof typeof PASS_PRICES]
    if (!basePrice) {
      return { error: "Type de pass invalide" }
    }

    // --- Unit amount per seat (in cents) ---
    let unitAmount: number
    if (days && days > 0) {
      unitAmount = PASS_PRICES.day * days
    } else if (weeks && weeks > 0) {
      unitAmount = PASS_PRICES.week * weeks
    } else {
      unitAmount = basePrice
    }

    if (includeTax) {
      unitAmount = Math.round(unitAmount * 1.2)
    }

    // --- Mode ---
    const isSubscription = (days || weeks) ? false : passType === "month"

    // --- Product name ---
    const passLabel = BOOKING_TYPES[passType] || passType
    let durationLabel = ""
    if (days && days > 0) {
      durationLabel = ` (${days} jour${days > 1 ? "s" : ""})`
    } else if (weeks && weeks > 0) {
      durationLabel = ` (${weeks} semaine${weeks > 1 ? "s" : ""})`
    }
    const productName = `${passLabel}${durationLabel} - ${siteName}`

    // --- Dates text ---
    const startDate = dates[0]
    const endDate = dates[dates.length - 1]
    let datesText: string
    if (isSubscription) {
      datesText = `À partir du ${formatDateShort(startDate)}`
    } else if (dates.length === 1) {
      datesText = formatDateShort(startDate)
    } else {
      datesText = `Du ${formatDateShort(startDate)} au ${formatDateShort(endDate)} (${dates.length} jour${dates.length > 1 ? "s" : ""})`
    }

    // --- Product description ---
    const totalTTC = (unitAmount * seats) / 100
    const productDescription = isSubscription
      ? `${seats} poste${seats > 1 ? "s" : ""} - Abonnement mensuel - ${totalTTC.toFixed(2)}€ TTC/mois`
      : `${seats} poste${seats > 1 ? "s" : ""} - ${datesText} - ${totalTTC.toFixed(2)}€ TTC`

    // --- Metadata ---
    const metadata: Record<string, string> = {
      siteName: siteId,
      bookingType: passLabel,
      dates: datesText,
      quantity: seats.toString(),
      start_date: startDate,
      end_date: endDate,
      ...(returnPath === "/admin/tests" ? { source: "test-page" } : {}),
    }

    // --- URLs ---
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const redirectPath = returnPath || "/reservation"
    const successUrl = `${baseUrl}${redirectPath}?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}${redirectPath}?canceled=true`

    if (isSubscription) {
      const product = await stripe.products.create({
        name: productName,
        description: productDescription,
      })

      const price = await stripe.prices.create({
        unit_amount: unitAmount,
        currency: "eur",
        recurring: { interval: "month" },
        product: product.id,
      })

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: price.id, quantity: seats }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
      }
      if (customerEmail) {
        sessionParams.customer_email = customerEmail
      }

      const session = await stripe.checkout.sessions.create(sessionParams)
      return { url: session.url!, sessionId: session.id }
    } else {
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: unitAmount,
              product_data: {
                name: productName,
                description: productDescription,
              },
            },
            quantity: seats,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
        customer_creation: "always",
      }
      if (customerEmail) {
        sessionParams.customer_email = customerEmail
      }

      const session = await stripe.checkout.sessions.create(sessionParams)
      return { url: session.url!, sessionId: session.id }
    }
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return { error: "Erreur lors de la création de la session de paiement" }
  }
}

export async function createPortalSession(customerId: string): Promise<{ url: string } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Non autorisé" }
    }

    const stripe = getStripe()

    if (!customerId) {
      return { error: "Customer ID manquant" }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}/admin/tests`,
    })

    return { url: session.url }
  } catch (error) {
    console.error("Stripe portal error:", error)
    return { error: "Erreur lors de la création du portail" }
  }
}

interface StripeSessionData {
  id: string
  amountTotal: number | null
  currency: string | null
  status: string | null
  paymentStatus: string | null
  mode: string | null
  created: number
  customerEmail: string | null
  customer: string | null
  metadata: Record<string, string> | null
}

export async function getTestSessions(): Promise<{ sessions: StripeSessionData[] } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { error: "Non autorisé" }
    }

    const stripe = getStripe()

    const sessions = await stripe.checkout.sessions.list({
      limit: 50,
    })

    const testSessions = sessions.data
      .filter((s) => s.metadata?.source === "test-page")
      .map((s) => ({
        id: s.id,
        amountTotal: s.amount_total,
        currency: s.currency,
        status: s.status,
        paymentStatus: s.payment_status,
        mode: s.mode,
        created: s.created,
        customerEmail: s.customer_details?.email || null,
        customer: typeof s.customer === "string" ? s.customer : s.customer?.id || null,
        metadata: s.metadata,
      }))

    return { sessions: testSessions }
  } catch (error) {
    console.error("Stripe sessions list error:", error)
    return { error: "Erreur lors de la récupération des sessions" }
  }
}
