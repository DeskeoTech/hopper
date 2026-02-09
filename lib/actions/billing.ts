"use server"

import Stripe from "stripe"
import { createClient, getUser } from "@/lib/supabase/server"

interface BillingPortalResult {
  url?: string
  error?: string
}

/**
 * Creates a Stripe Billing Portal session.
 * Looks up the company's Stripe customer ID and creates a portal session directly.
 */
export async function createBillingPortalSession(
  returnUrl: string
): Promise<BillingPortalResult> {
  const user = await getUser()

  if (!user?.email) {
    return { error: "Non authentifié" }
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY
  if (!stripeSecretKey) {
    return { error: "Configuration Stripe manquante" }
  }

  try {
    const supabase = await createClient()

    // Get user's company_id and role
    const { data: userProfile } = await supabase
      .from("users")
      .select("company_id, role")
      .eq("email", user.email)
      .single()

    if (userProfile?.role !== "admin") {
      return { error: "Accès non autorisé" }
    }

    if (!userProfile?.company_id) {
      return { error: "Entreprise non trouvée" }
    }

    // Get company's Stripe customer ID
    const { data: company } = await supabase
      .from("companies")
      .select("customer_id_stripe")
      .eq("id", userProfile.company_id)
      .single()

    if (!company?.customer_id_stripe) {
      return { error: "Compte Stripe non configuré pour cette entreprise" }
    }

    const stripe = new Stripe(stripeSecretKey)
    const session = await stripe.billingPortal.sessions.create({
      customer: company.customer_id_stripe,
      return_url: returnUrl,
    })

    return { url: session.url }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erreur lors de la création de la session",
    }
  }
}
