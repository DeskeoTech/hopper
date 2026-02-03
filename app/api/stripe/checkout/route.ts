import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

const PASS_PRICES = {
  day: 3000, // 30€ in cents
  week: 10000, // 100€ in cents
  month: 30000, // 300€ in cents
}

export async function POST(request: NextRequest) {
  try {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Configuration Stripe manquante" },
        { status: 500 }
      )
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    })

    const body = await request.json()
    const { siteId, siteName, passType, seats, dates, priceHT } = body

    if (!siteId || !siteName || !passType || !seats || !dates || dates.length === 0) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      )
    }

    const basePrice = PASS_PRICES[passType as keyof typeof PASS_PRICES]
    if (!basePrice) {
      return NextResponse.json(
        { error: "Type de pass invalide" },
        { status: 400 }
      )
    }

    const unitAmount = basePrice * seats
    const isSubscription = passType === "month"

    const passLabels = {
      day: "Day Pass",
      week: "Pass Week",
      month: "Pass Month",
    }

    const metadata = {
      siteId,
      siteName,
      passType,
      seats: seats.toString(),
      startDate: dates[0],
      endDate: dates[dates.length - 1],
      datesCount: dates.length.toString(),
    }

    const successUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reservation?success=true&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reservation?canceled=true`

    if (isSubscription) {
      // Create a price for subscription
      const price = await stripe.prices.create({
        unit_amount: unitAmount,
        currency: "eur",
        recurring: { interval: "month" },
        product_data: {
          name: `${passLabels[passType]} - ${siteName}`,
          description: `${seats} poste${seats > 1 ? "s" : ""} - Abonnement mensuel`,
        },
      })

      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
      })

      return NextResponse.json({ url: session.url, sessionId: session.id })
    } else {
      // One-time payment
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              unit_amount: unitAmount,
              product_data: {
                name: `${passLabels[passType as keyof typeof passLabels]} - ${siteName}`,
                description: `${seats} poste${seats > 1 ? "s" : ""} - ${dates.length} jour${dates.length > 1 ? "s" : ""}`,
              },
            },
            quantity: 1,
          },
        ],
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata,
        allow_promotion_codes: true,
      })

      return NextResponse.json({ url: session.url, sessionId: session.id })
    }
  } catch (error) {
    console.error("Stripe checkout error:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de la session de paiement" },
      { status: 500 }
    )
  }
}
