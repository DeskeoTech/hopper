"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { CompanyType, SubscriptionPeriod } from "@/lib/types/database"

const HOPPER_RESIDENCE_PLAN_ID = "62ccff00-36a8-45b2-85bc-82c32d26dc62"

export async function updateCompanyHeader(
  companyId: string,
  data: { name: string | null; company_type: CompanyType | null; meeting_room_only?: boolean }
) {
  const supabase = createAdminClient()

  const { error } = await supabase
    .from("companies")
    .update({
      name: data.name,
      company_type: data.company_type,
      meeting_room_only: data.meeting_room_only ?? false,
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
  const supabase = createAdminClient()

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
  from_spacebring?: boolean
  meeting_room_only?: boolean
  spacebring_plan_name?: string | null
  spacebring_monthly_price?: number | null
  spacebring_monthly_credits?: number | null
  spacebring_seats?: number | null
  spacebring_start_date?: string | null
}) {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { error: "Non authentifié" }
  }

  const supabase = await createClient()
  const isOffPlatform = data.from_spacebring === true
  const isMeetingRoomOnly = data.meeting_room_only === true
  const today = new Date().toISOString().split("T")[0]

  const { data: company, error } = await supabase
    .from("companies")
    .insert({
      name: data.name,
      company_type: data.company_type,
      contact_email: data.contact_email || null,
      phone: data.phone || null,
      address: data.address || null,
      main_site_id: data.main_site_id || null,
      from_spacebring: isOffPlatform,
      meeting_room_only: isMeetingRoomOnly,
      spacebring_plan_name: isOffPlatform ? (data.spacebring_plan_name || null) : null,
      spacebring_monthly_price: isOffPlatform ? (data.spacebring_monthly_price ?? null) : null,
      spacebring_monthly_credits: isOffPlatform ? (data.spacebring_monthly_credits ?? null) : null,
      spacebring_seats: isOffPlatform ? (data.spacebring_seats ?? null) : null,
      spacebring_start_date: isOffPlatform ? (data.spacebring_start_date || null) : null,
      onboarding_done: isOffPlatform || isMeetingRoomOnly ? true : null,
      subscription_start_date: (isOffPlatform && data.spacebring_start_date) ? data.spacebring_start_date : (isMeetingRoomOnly ? today : null),
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

export async function getCompanyDocumentUrl(storagePath: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase.storage
    .from("company-documents")
    .createSignedUrl(storagePath, 3600)

  if (error || !data?.signedUrl) {
    return { error: "Impossible de générer le lien du document" }
  }

  return { url: data.signedUrl }
}

export async function uploadCompanyKbisAdmin(companyId: string, formData: FormData) {
  const supabase = createAdminClient()

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "Format non accepté. Utilisez PDF, JPG ou PNG." }
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: "Le fichier est trop volumineux (max 10 Mo)" }
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf"
  const fileName = `${companyId}/kbis/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("company-documents")
    .upload(fileName, file, { cacheControl: "3600", upsert: false })

  if (uploadError) {
    return { error: "Erreur lors de l'upload du fichier" }
  }

  const { error: updateError } = await supabase
    .from("companies")
    .update({ kbis_storage_path: fileName, updated_at: new Date().toISOString() })
    .eq("id", companyId)

  if (updateError) {
    await supabase.storage.from("company-documents").remove([fileName])
    return { error: "Erreur lors de la mise à jour" }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}

export async function deleteCompanyKbis(companyId: string, storagePath: string) {
  const supabase = createAdminClient()

  const { error: removeError } = await supabase.storage
    .from("company-documents")
    .remove([storagePath])

  if (removeError) {
    return { error: "Erreur lors de la suppression du fichier" }
  }

  const { error: updateError } = await supabase
    .from("companies")
    .update({ kbis_storage_path: null, updated_at: new Date().toISOString() })
    .eq("id", companyId)

  if (updateError) {
    return { error: "Erreur lors de la mise à jour" }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}

export async function uploadCompanyDocument(
  companyId: string,
  documentType: "identity_document" | "rib",
  formData: FormData
) {
  const supabase = createAdminClient()

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "Format non accepté. Utilisez PDF, JPG ou PNG." }
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: "Le fichier est trop volumineux (max 10 Mo)" }
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf"
  const fileName = `${companyId}/${documentType}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("company-documents")
    .upload(fileName, file, { cacheControl: "3600", upsert: false })

  if (uploadError) {
    return { error: "Erreur lors de l'upload du fichier" }
  }

  const columnName = documentType === "identity_document"
    ? "identity_document_storage_path"
    : "rib_storage_path"

  const { error: updateError } = await supabase
    .from("companies")
    .update({ [columnName]: fileName, updated_at: new Date().toISOString() })
    .eq("id", companyId)

  if (updateError) {
    await supabase.storage.from("company-documents").remove([fileName])
    return { error: "Erreur lors de la mise à jour" }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}

export async function deleteCompanyDocument(
  companyId: string,
  documentType: "identity_document" | "rib",
  storagePath: string
) {
  const supabase = createAdminClient()

  const { error: removeError } = await supabase.storage
    .from("company-documents")
    .remove([storagePath])

  if (removeError) {
    return { error: "Erreur lors de la suppression du fichier" }
  }

  const columnName = documentType === "identity_document"
    ? "identity_document_storage_path"
    : "rib_storage_path"

  const { error: updateError } = await supabase
    .from("companies")
    .update({ [columnName]: null, updated_at: new Date().toISOString() })
    .eq("id", companyId)

  if (updateError) {
    return { error: "Erreur lors de la mise à jour" }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}

export async function updateSpacebringSubscription(
  companyId: string,
  data: {
    from_spacebring: boolean
    spacebring_plan_name: string | null
    spacebring_monthly_price: number | null
    spacebring_monthly_credits: number | null
    spacebring_seats: number | null
    spacebring_start_date: string | null
  }
) {
  const supabase = createAdminClient()

  // Build update payload
  const updateData: Record<string, unknown> = {
    from_spacebring: data.from_spacebring,
    spacebring_plan_name: data.spacebring_plan_name,
    spacebring_monthly_price: data.spacebring_monthly_price,
    spacebring_monthly_credits: data.spacebring_monthly_credits,
    spacebring_seats: data.spacebring_seats,
    spacebring_start_date: data.spacebring_start_date,
    updated_at: new Date().toISOString(),
  }

  // Sync subscription_start_date for active client detection on homepage
  if (data.from_spacebring && data.spacebring_start_date) {
    updateData.subscription_start_date = data.spacebring_start_date
  } else if (!data.from_spacebring) {
    // When disabling off-platform, check if company has a Stripe subscription before clearing dates
    const { data: company } = await supabase
      .from("companies")
      .select("customer_id_stripe, subscription_start_date")
      .eq("id", companyId)
      .single()

    // Only clear subscription dates if no Stripe subscription exists
    if (!company?.customer_id_stripe) {
      updateData.subscription_start_date = null
      updateData.subscription_end_date = null
    }
  }

  const { error } = await supabase
    .from("companies")
    .update(updateData)
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
  return { success: true }
}

export async function getAvailablePlans() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("plans")
    .select("id, name, recurrence, price_per_seat_month, service_type")
    .eq("archived", false)
    .eq("service_type", "plan")
    .order("name")

  if (error) {
    return { error: error.message }
  }

  return { data: data || [] }
}

export async function createCompanyContract(
  companyId: string,
  data: {
    planId: string
    numberOfSeats: number
    startDate: string
    endDate?: string | null
  }
) {
  const supabase = createAdminClient()

  const { error } = await supabase.from("contracts").insert({
    company_id: companyId,
    plan_id: data.planId,
    Number_of_seats: data.numberOfSeats,
    start_date: data.startDate,
    end_date: data.endDate || null,
    status: "active",
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/clients/${companyId}`)
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
