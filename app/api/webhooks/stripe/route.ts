import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY_HOPPER_COWORKING
  if (!key) throw new Error("STRIPE_SECRET_KEY_HOPPER_COWORKING manquante")
  return new Stripe(key, { apiVersion: "2024-12-18.acacia" })
}

export async function POST(request: Request) {
  if (!STRIPE_WEBHOOK_SECRET) {
    console.error("STRIPE_WEBHOOK_SECRET not configured")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(body, signature, STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    console.error("Webhook signature verification failed:", message)
    return new Response(`Webhook Error: ${message}`, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      // Subscription status changes (covers most cases)
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const subscriptionId = subscription.id
        const stripeStatus = subscription.status

        // Map Stripe status to contract status
        let contractStatus: "active" | "suspended" | "terminated"
        if (stripeStatus === "active" || stripeStatus === "trialing") {
          contractStatus = "active"
        } else if (stripeStatus === "canceled" || stripeStatus === "unpaid" || stripeStatus === "incomplete_expired") {
          contractStatus = "terminated"
        } else {
          // past_due, incomplete, paused
          contractStatus = "suspended"
        }

        await supabase
          .from("contracts")
          .update({
            status: contractStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("Subscription_ID", subscriptionId)

        console.log(`Webhook: subscription ${subscriptionId} → ${contractStatus} (stripe: ${stripeStatus})`)
        break
      }

      // Payment failed on invoice (subscription payment)
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id

        if (subscriptionId) {
          await supabase
            .from("contracts")
            .update({
              status: "suspended",
              updated_at: new Date().toISOString(),
            })
            .eq("Subscription_ID", subscriptionId)

          console.log(`Webhook: invoice payment failed for subscription ${subscriptionId} → suspended`)
        }
        break
      }

      // Payment succeeded → reactivate if suspended
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription?.id

        if (subscriptionId) {
          // Only reactivate if currently suspended (don't touch terminated)
          await supabase
            .from("contracts")
            .update({
              status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("Subscription_ID", subscriptionId)
            .eq("status", "suspended")

          console.log(`Webhook: invoice paid for subscription ${subscriptionId} → reactivated if suspended`)
        }
        break
      }

      // SEPA hors plateforme: checkout completed → create contract + save customer ID
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.metadata?.type !== "sepa_hors_plateforme") break
        if (session.mode !== "subscription") break

        const companyId = session.metadata.company_id
        const sessionSubscriptionId = typeof session.subscription === "string"
          ? session.subscription
          : (session.subscription as Stripe.Subscription)?.id

        const customerId = typeof session.customer === "string"
          ? session.customer
          : (session.customer as Stripe.Customer)?.id

        // Save customer_id_stripe on the company
        if (customerId && companyId) {
          await supabase
            .from("companies")
            .update({ customer_id_stripe: customerId })
            .eq("id", companyId)
        }

        // Create contract with the off-platform plan
        const PLAN_HORS_PLATEFORME_ID = "62ccff00-36a8-45b2-85bc-82c32d26dc62"
        if (sessionSubscriptionId && companyId) {
          // Idempotency: don't create duplicate contracts
          const { data: existing } = await supabase
            .from("contracts")
            .select("id")
            .eq("Subscription_ID", sessionSubscriptionId)
            .maybeSingle()

          if (!existing) {
            await supabase.from("contracts").insert({
              company_id: companyId,
              plan_id: PLAN_HORS_PLATEFORME_ID,
              Number_of_seats: 1,
              start_date: new Date().toISOString().split("T")[0],
              status: "active",
              Subscription_ID: sessionSubscriptionId,
            })
          }

          // Switch company to platform (from_spacebring → false)
          await supabase
            .from("companies")
            .update({ from_spacebring: false })
            .eq("id", companyId)

          console.log(`Webhook: SEPA checkout completed for company ${companyId}, subscription ${sessionSubscriptionId}`)
        }
        break
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err)
    return new Response("Webhook processing error", { status: 500 })
  }

  return new Response("ok", { status: 200 })
}
