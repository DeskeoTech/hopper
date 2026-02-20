"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { CompanyType, SubscriptionPeriod } from "@/lib/types/database"

const HOPPER_RESIDENCE_PLAN_ID = "62ccff00-36a8-45b2-85bc-82c32d26dc62"

export async function updateCompanyHeader(
  companyId: string,
  data: { name: string | null; company_type: CompanyType | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({
      name: data.name,
      company_type: data.company_type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function updateCompanyContact(
  companyId: string,
  data: { address: string | null; phone: string | null; contact_email: string | null }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({
      address: data.address || null,
      phone: data.phone || null,
      contact_email: data.contact_email || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function updateCompanySubscription(
  companyId: string,
  data: {
    subscription_period: SubscriptionPeriod | null
    subscription_start_date: string | null
    subscription_end_date: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({
      subscription_period: data.subscription_period,
      subscription_start_date: data.subscription_start_date || null,
      subscription_end_date: data.subscription_end_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/abonnements")
  return { success: true }
}

export async function cancelCompanySubscription(companyId: string, endDate: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({
      subscription_end_date: endDate,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/abonnements")
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function createCompanySubscription(
  companyId: string,
  data: {
    subscription_period: SubscriptionPeriod
    subscription_start_date: string
    subscription_end_date?: string | null
  }
) {
  const supabase = await createClient()

  const { error } = await supabase
    .from("companies")
    .update({
      subscription_period: data.subscription_period,
      subscription_start_date: data.subscription_start_date,
      subscription_end_date: data.subscription_end_date || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/abonnements")
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function createCompany(data: {
  name: string
  company_type: CompanyType | null
  contact_email: string | null
  phone: string | null
  address: string | null
  main_site_id?: string | null
  numberOfSeats?: number | null
  initialCredits?: number | null
}) {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { error: "Non authentifié" }
  }

  const supabase = await createClient()

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      name: data.name,
      company_type: data.company_type,
      contact_email: data.contact_email || null,
      phone: data.phone || null,
      address: data.address || null,
      main_site_id: data.main_site_id || null,
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  const companyId = company.id

  // Créer le contrat "Hopper Résidence" si des postes sont définis
  if (data.numberOfSeats && data.numberOfSeats > 0) {
    const { error: contractError } = await supabase.from("contracts").insert({
      company_id: companyId,
      plan_id: HOPPER_RESIDENCE_PLAN_ID,
      Number_of_seats: data.numberOfSeats,
      start_date: new Date().toISOString().split("T")[0],
      status: "active",
    })

    if (contractError) {
      return { error: contractError.message }
    }
  }

  // Attribuer les crédits initiaux si définis
  if (data.initialCredits && data.initialCredits > 0) {
    const adminClient = createAdminClient()
    const reason = "Attribution initiale"

    const { data: currentBalance } = await adminClient.rpc("get_company_valid_credits", {
      p_company_id: companyId,
    })
    const balanceBefore = currentBalance ?? 0

    const { data: creditRecord, error: creditError } = await adminClient
      .from("credits")
      .insert({
        company_id: companyId,
        allocated_credits: data.initialCredits,
        remaining_balance: data.initialCredits,
        expiration: null,
        reason,
      })
      .select("id")
      .single()

    if (creditError) {
      return { error: creditError.message }
    }

    const { error: txError } = await adminClient.from("credit_transactions").insert({
      credit_id: creditRecord.id,
      company_id: companyId,
      transaction_type: "allocation",
      amount: data.initialCredits,
      balance_before: balanceBefore,
      balance_after: balanceBefore + data.initialCredits,
      reason,
    })

    if (txError) {
      return { error: txError.message }
    }
  }

  revalidatePath("/admin/clients")
  return { success: true, companyId }
}

export async function updateCompanyMainSite(
  companyId: string,
  mainSiteId: string | null
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("companies")
    .update({
      main_site_id: mainSiteId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function deactivateCompany(companyId: string) {
  const supabase = createAdminClient()
  const today = new Date().toISOString().split("T")[0]

  const { error } = await supabase
    .from("companies")
    .update({
      subscription_end_date: today,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function reactivateCompany(companyId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("companies")
    .update({
      subscription_end_date: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  revalidatePath("/admin/clients")
  return { success: true }
}

export async function deleteCompany(
  companyId: string
): Promise<{ success: boolean; error: string | null }> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { success: false, error: "Non authentifié" }
  }

  if (authUser.email !== "tech@deskeo.fr") {
    return { success: false, error: "Accès non autorisé" }
  }

  const supabase = createAdminClient()

  // Dissocier les utilisateurs de l'entreprise
  const { error: usersError } = await supabase
    .from("users")
    .update({ company_id: null, contract_id: null })
    .eq("company_id", companyId)

  if (usersError) {
    return { success: false, error: usersError.message }
  }

  // Supprimer les transactions de crédits liées
  const { error: txError } = await supabase
    .from("credit_transactions")
    .delete()
    .eq("company_id", companyId)

  if (txError) {
    return { success: false, error: txError.message }
  }

  // Supprimer les crédits liés
  const { error: creditsError } = await supabase
    .from("credits")
    .delete()
    .eq("company_id", companyId)

  if (creditsError) {
    return { success: false, error: creditsError.message }
  }

  // Supprimer les contrats liés
  const { error: contractsError } = await supabase
    .from("contracts")
    .delete()
    .eq("company_id", companyId)

  if (contractsError) {
    return { success: false, error: contractsError.message }
  }

  // Supprimer l'entreprise
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", companyId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath("/admin/clients")
  return { success: true, error: null }
}
