import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"

// Webhook secrets for each Stripe account
const WEBHOOK_SECRETS: Record<string, string | undefined> = {
  "hopper-coworking": process.env.STRIPE_WEBHOOK_SECRET,
  "icade": process.env.STRIPE_WEBHOOK_SECRET_ICADE,
}

function verifyWebhookEvent(body: string, signature: string): Stripe.Event {
  // Try each webhook secret until one succeeds
  const errors: string[] = []
  for (const [account, secret] of Object.entries(WEBHOOK_SECRETS)) {
    if (!secret) continue
    try {
      // constructEvent only needs the webhook secret, not an API key
      const stripe = new Stripe("sk_not_used", { apiVersion: "2024-12-18.acacia" })
      return stripe.webhooks.constructEvent(body, signature, secret)
    } catch (err) {
      errors.push(`${account}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }
  throw new Error(`Webhook signature verification failed for all accounts: ${errors.join("; ")}`)
}

export async function POST(request: Request) {
  const configuredSecrets = Object.values(WEBHOOK_SECRETS).filter(Boolean)
  if (configuredSecrets.length === 0) {
    console.error("No STRIPE_WEBHOOK_SECRET configured")
    return new Response("Webhook secret not configured", { status: 500 })
  }

  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = verifyWebhookEvent(body, signature)
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
    }
  } catch (err) {
    console.error("Webhook processing error:", err)
    return new Response("Webhook processing error", { status: 500 })
  }

  return new Response("ok", { status: 200 })
}
