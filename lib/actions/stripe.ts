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

async function getOrCreateMonthlyPrice(
  stripe: Stripe,
  productId: string,
  unitAmount: number
): Promise<string> {
  const existingPrices = await stripe.prices.list({
    product: productId,
    active: true,
    currency: "eur",
    recurring: { interval: "month" },
    type: "recurring",
    limit: 100,
  })

  const match = existingPrices.data.find((p) => p.unit_amount === unitAmount)
  if (match) return match.id

  const newPrice = await stripe.prices.create(
    {
      product: productId,
      unit_amount: unitAmount,
      currency: "eur",
      recurring: { interval: "month" },
    },
    { idempotencyKey: `price-${productId}-${unitAmount}` }
  )
  return newPrice.id
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
  referral?: string
}

export async function createCheckoutSession(params: CheckoutParams): Promise<{ url: string; sessionId: string } | { error: string }> {
  try {
    const stripe = getStripe()

    const { siteId, siteName, passType, seats, dates, days, weeks, returnPath, includeTax, customerEmail, referral } = params

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
      ...(referral ? { referral } : {}),
    }

    // --- URLs ---
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"
    const redirectPath = returnPath || "/"
    const successUrl = `${baseUrl}${redirectPath}?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${baseUrl}${redirectPath}?canceled=true`

    // --- Chercher le customer Stripe dans Supabase pour verrouiller l'email ---
    let stripeCustomerId: string | undefined
    if (customerEmail) {
      const supabase = await createClient()
      const { data: userData } = await supabase
        .from("users")
        .select("company_id")
        .eq("email", customerEmail)
        .single()

      if (userData?.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("customer_id_stripe")
          .eq("id", userData.company_id)
          .single()

        if (companyData?.customer_id_stripe) {
          stripeCustomerId = companyData.customer_id_stripe
        }
      }
    }

    if (isSubscription) {
      // Récupérer le stripe_product_id depuis la table plans (test vs live)
      const isTestMode = process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")
      const stripeProductIdColumn = isTestMode ? "stripe_product_id_test" : "stripe_product_id_live"

      const supabase = await createClient()
      const { data: plan } = await supabase
        .from("plans")
        .select(stripeProductIdColumn)
        .eq("name", "Hopper Pass Month")
        .single()

      const stripeProductId = plan?.[stripeProductIdColumn]
      if (!stripeProductId) {
        throw new Error("Produit Stripe non configuré pour le plan Hopper Pass Month")
      }

      // unitAmount = prix par poste (en cents), seats = nombre de postes
      const priceId = await getOrCreateMonthlyPrice(stripe, stripeProductId, unitAmount)

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: seats }],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
        custom_fields: [
          {
            key: "firstname",
            label: { type: "custom", custom: "Prénom" },
            type: "text",
            text: { minimum_length: 1, maximum_length: 50 },
          },
          {
            key: "lastname",
            label: { type: "custom", custom: "Nom" },
            type: "text",
            text: { minimum_length: 1, maximum_length: 50 },
          },
        ],
        subscription_data: {
          description: productDescription,
        },
      }
      if (stripeCustomerId) {
        sessionParams.customer = stripeCustomerId
      } else if (customerEmail) {
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
        ...(!stripeCustomerId && { customer_creation: "always" }),
        custom_fields: [
          {
            key: "firstname",
            label: { type: "custom", custom: "Prénom" },
            type: "text",
            text: { minimum_length: 1, maximum_length: 50 },
          },
          {
            key: "lastname",
            label: { type: "custom", custom: "Nom" },
            type: "text",
            text: { minimum_length: 1, maximum_length: 50 },
          },
        ],
      }
      if (stripeCustomerId) {
        sessionParams.customer = stripeCustomerId
      } else if (customerEmail) {
        sessionParams.customer_email = customerEmail
      }

      const session = await stripe.checkout.sessions.create(sessionParams)
      return { url: session.url!, sessionId: session.id }
    }
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.error("Stripe checkout error:", errMsg, error)
    return { error: `Erreur lors de la création de la session de paiement: ${errMsg}` }
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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"
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

export async function getPaymentStatus(sessionId: string): Promise<{
  paymentStatus: "paid" | "unpaid" | "no_payment_required" | null
  sessionStatus: "open" | "complete" | "expired" | null
  amountTotal: number | null
  currency: string | null
} | { error: string }> {
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    return {
      paymentStatus: session.payment_status as "paid" | "unpaid" | "no_payment_required" | null,
      sessionStatus: session.status as "open" | "complete" | "expired" | null,
      amountTotal: session.amount_total,
      currency: session.currency,
    }
  } catch (error) {
    console.error("Stripe get payment status error:", error)
    return { error: "Erreur lors de la récupération du statut de paiement" }
  }
}

// --- Company payment status ---

export type CompanyPaymentStatus = "ok" | "failed" | "none"

export async function getCompanyPaymentStatus(stripeCustomerId: string): Promise<{
  status: CompanyPaymentStatus
} | { error: string }> {
  try {
    const stripe = getStripe()
    const charges = await stripe.charges.list({
      customer: stripeCustomerId,
      limit: 20,
    })

    const hasFailed = charges.data.some((c) => c.status === "failed")
    return { status: hasFailed ? "failed" : "ok" }
  } catch (error) {
    console.error("Stripe company payment status error:", error)
    return { error: "Erreur lors de la récupération du statut de paiement" }
  }
}

export async function getCompanyPaymentStatuses(customerIds: string[]): Promise<{
  statuses: Record<string, CompanyPaymentStatus>
} | { error: string }> {
  try {
    const stripe = getStripe()
    const results: Record<string, CompanyPaymentStatus> = {}

    await Promise.all(
      customerIds.map(async (id) => {
        try {
          const charges = await stripe.charges.list({
            customer: id,
            limit: 20,
          })
          const hasFailed = charges.data.some((c) => c.status === "failed")
          results[id] = hasFailed ? "failed" : "ok"
        } catch {
          results[id] = "ok"
        }
      })
    )

    return { statuses: results }
  } catch (error) {
    console.error("Stripe batch company status error:", error)
    return { error: "Erreur lors de la récupération des statuts" }
  }
}

export async function getPaymentStatuses(sessionIds: string[]): Promise<{
  statuses: Record<string, { paymentStatus: string; sessionStatus: string }>
} | { error: string }> {
  try {
    const stripe = getStripe()
    const results: Record<string, { paymentStatus: string; sessionStatus: string }> = {}

    await Promise.all(
      sessionIds.map(async (id) => {
        try {
          const session = await stripe.checkout.sessions.retrieve(id)
          results[id] = {
            paymentStatus: session.payment_status,
            sessionStatus: session.status || "unknown",
          }
        } catch {
          results[id] = { paymentStatus: "unknown", sessionStatus: "unknown" }
        }
      })
    )

    return { statuses: results }
  } catch (error) {
    console.error("Stripe batch status error:", error)
    return { error: "Erreur lors de la récupération des statuts" }
  }
}

// --- Subscription status ---

export type StripeSubscriptionStatus = "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "paused" | "trialing" | "unknown"

export async function getSubscriptionStatuses(subscriptionIds: string[]): Promise<{
  statuses: Record<string, StripeSubscriptionStatus>
} | { error: string }> {
  try {
    const stripe = getStripe()
    const results: Record<string, StripeSubscriptionStatus> = {}

    await Promise.all(
      subscriptionIds.map(async (id) => {
        try {
          const subscription = await stripe.subscriptions.retrieve(id)
          results[id] = subscription.status as StripeSubscriptionStatus
        } catch {
          results[id] = "unknown"
        }
      })
    )

    return { statuses: results }
  } catch (error) {
    console.error("Stripe batch subscription status error:", error)
    return { error: "Erreur lors de la récupération des statuts d'abonnement" }
  }
}

// --- Create booking from completed Stripe checkout session ---

export async function createBookingFromStripeSession(sessionId: string): Promise<{
  success: boolean
  bookingId?: string
} | { error: string }> {
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // Only create booking for completed payments
    if (session.payment_status !== "paid" && session.status !== "complete") {
      return { error: "Session non payée" }
    }

    const supabase = await createClient()

    // Idempotency check: don't create duplicate bookings
    const { data: existingBooking } = await supabase
      .from("bookings")
      .select("id")
      .eq("stripe_checkout_session_id", sessionId)
      .maybeSingle()

    if (existingBooking) {
      return { success: true, bookingId: existingBooking.id }
    }

    // Extract metadata
    const siteId = session.metadata?.siteName // siteName field contains the site ID
    const startDate = session.metadata?.start_date
    const endDate = session.metadata?.end_date
    const quantity = session.metadata?.quantity ? parseInt(session.metadata.quantity) : 1
    const referral = session.metadata?.referral || null
    const customerEmail = session.customer_details?.email || null

    if (!siteId || !startDate || !endDate) {
      return { error: "Metadata manquantes dans la session Stripe" }
    }

    // Find a bench or flex_desk resource at this site
    const { data: resource } = await supabase
      .from("resources")
      .select("id")
      .eq("site_id", siteId)
      .in("type", ["bench", "flex_desk"])
      .eq("status", "available")
      .limit(1)
      .maybeSingle()

    if (!resource) {
      return { error: "Aucune ressource disponible sur ce site" }
    }

    // Find user by email
    let userId: string | null = null
    if (customerEmail) {
      const { data: user } = await supabase
        .from("users")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle()

      userId = user?.id || null
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        resource_id: resource.id,
        start_date: `${startDate}T09:00:00Z`,
        end_date: `${endDate}T18:00:00Z`,
        status: "confirmed",
        seats_count: quantity,
        stripe_checkout_session_id: sessionId,
        ...(referral ? { referral } : {}),
      })
      .select("id")
      .single()

    if (bookingError) {
      console.error("Booking creation error:", bookingError)
      return { error: "Erreur lors de la création de la réservation" }
    }

    return { success: true, bookingId: booking.id }
  } catch (error) {
    console.error("Create booking from Stripe session error:", error)
    return { error: "Erreur lors de la création de la réservation" }
  }
}
