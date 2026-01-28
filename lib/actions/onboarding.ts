"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface OnboardingData {
  userId: string
  companyId: string | null
  companyType: "self_employed" | "multi_employee"
  companyInfo: {
    name: string
    address: string
    contact_email: string
  }
}

export async function completeOnboarding(data: OnboardingData) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  const supabase = await createClient()

  // Validate required fields
  if (!data.companyInfo.name.trim()) {
    return { error: "Le nom de l'entreprise est requis" }
  }
  if (!data.companyInfo.address.trim()) {
    return { error: "L'adresse est requise" }
  }
  if (!data.companyInfo.contact_email.trim()) {
    return { error: "L'email de contact est requis" }
  }

  const now = new Date().toISOString()

  if (data.companyId) {
    // Update existing company
    const { error: updateError } = await supabase
      .from("companies")
      .update({
        name: data.companyInfo.name.trim(),
        address: data.companyInfo.address.trim(),
        contact_email: data.companyInfo.contact_email.trim(),
        company_type: data.companyType,
        onboarding_done: true,
        updated_at: now,
      })
      .eq("id", data.companyId)

    if (updateError) {
      console.error("Error updating company:", updateError)
      return { error: "Erreur lors de la mise à jour de l'entreprise" }
    }
  } else {
    // Create new company and link to user
    const { data: newCompany, error: createError } = await supabase
      .from("companies")
      .insert({
        name: data.companyInfo.name.trim(),
        address: data.companyInfo.address.trim(),
        contact_email: data.companyInfo.contact_email.trim(),
        company_type: data.companyType,
        onboarding_done: true,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single()

    if (createError || !newCompany) {
      console.error("Error creating company:", createError)
      return { error: "Erreur lors de la création de l'entreprise" }
    }

    // Link company to user
    const { error: linkError } = await supabase
      .from("users")
      .update({
        company_id: newCompany.id,
        updated_at: now,
      })
      .eq("id", data.userId)

    if (linkError) {
      console.error("Error linking company to user:", linkError)
      return { error: "Erreur lors de la liaison de l'entreprise" }
    }
  }

  revalidatePath("/")
  revalidatePath("/compte")
  revalidatePath("/mon-compte")

  return { success: true }
}

export async function uploadOnboardingKbis(companyId: string, formData: FormData) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  const supabase = await createClient()

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  // Validate file type
  const allowedTypes = ["application/pdf", "image/jpeg", "image/png"]
  if (!allowedTypes.includes(file.type)) {
    return { error: "Format de fichier non accepté. Utilisez PDF, JPG ou PNG." }
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: "Le fichier est trop volumineux (max 10 Mo)" }
  }

  // Generate file path
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf"
  const fileName = `${companyId}/kbis/${Date.now()}.${fileExt}`

  // Upload to Supabase storage
  const { error: uploadError } = await supabase.storage
    .from("company-documents")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    })

  if (uploadError) {
    console.error("Error uploading KBIS:", uploadError)
    return { error: "Erreur lors de l'upload du fichier" }
  }

  // Update company with KBIS path
  const { error: updateError } = await supabase
    .from("companies")
    .update({
      kbis_storage_path: fileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (updateError) {
    // Cleanup uploaded file if database update fails
    await supabase.storage.from("company-documents").remove([fileName])
    console.error("Error updating company KBIS path:", updateError)
    return { error: "Erreur lors de la mise à jour du KBIS" }
  }

  revalidatePath("/")
  revalidatePath("/compte")
  revalidatePath("/mon-compte")

  return { success: true, path: fileName }
}
