"use server"

import { getUser } from "@/lib/supabase/server"

const N8N_WEBHOOK_URL = process.env.N8N_BILLING_WEBHOOK_URL!
const N8N_WEBHOOK_SECRET = process.env.N8N_BILLING_WEBHOOK_SECRET!

interface BillingPortalResult {
  url?: string
  error?: string
}

/**
 * Creates a Stripe Billing Portal session via n8n webhook.
 * Follows server-auth-actions: authenticates inside the action.
 */
export async function createBillingPortalSession(
  returnUrl: string
): Promise<BillingPortalResult> {
  const user = await getUser()

  if (!user?.email) {
    return { error: "Non authentifié" }
  }

  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Webhook-Secret": N8N_WEBHOOK_SECRET,
      },
      body: JSON.stringify({
        user_id: user.id,
        email: user.email,
        customer_id: null,
        return_url: returnUrl,
      }),
    })

    if (!response.ok) {
      return { error: "Erreur du service de facturation" }
    }

    const responseText = await response.text()

    if (!responseText || responseText.trim() === "") {
      return { error: "Réponse vide du service de facturation" }
    }

    let result: { url?: string }
    try {
      result = JSON.parse(responseText)
    } catch {
      return { error: "Réponse invalide du service de facturation" }
    }

    if (!result.url) {
      return { error: "URL de facturation non reçue" }
    }

    return { url: result.url }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Erreur lors de la création de la session",
    }
  }
}
