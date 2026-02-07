"use server"

import { revalidatePath } from "next/cache"
import { getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  userInfoSchema,
  companyInfoSchema,
  type UserInfoFormData,
  type CompanyInfoFormData,
} from "@/lib/validations/user-company-info"

export async function updateUserProfile(userId: string, data: UserInfoFormData) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  const validationResult = userInfoSchema.safeParse(data)
  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message }
  }

  // Use admin client to bypass RLS recursive policy on users table
  const supabase = createAdminClient()

  // Use authenticated email as source of truth to identify the user
  const email = authUser.email
  if (!email) {
    return { error: "Email non disponible" }
  }

  // Verify the userId matches the authenticated user's email
  const { data: userProfile } = await supabase
    .from("users")
    .select("id")
    .eq("email", email)
    .single()

  if (userProfile?.id !== userId) {
    return { error: "Accès non autorisé" }
  }

  // Update using email as identifier (source of truth from auth)
  const { error } = await supabase
    .from("users")
    .update({
      first_name: data.first_name,
      last_name: data.last_name,
      phone: data.phone,
      updated_at: new Date().toISOString(),
    })
    .eq("email", email)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
  return { success: true }
}

export async function updateCompanyProfile(
  companyId: string,
  data: CompanyInfoFormData
) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  const validationResult = companyInfoSchema.safeParse(data)
  if (!validationResult.success) {
    return { error: validationResult.error.errors[0].message }
  }

  // Use admin client to bypass RLS recursive policy on users table
  const supabase = createAdminClient()

  // Verify user belongs to this company
  const { data: userProfile } = await supabase
    .from("users")
    .select("company_id")
    .eq("email", authUser.email)
    .single()

  if (userProfile?.company_id !== companyId) {
    return { error: "Accès non autorisé à cette entreprise" }
  }

  const { error } = await supabase
    .from("companies")
    .update({
      name: data.name,
      address: data.address,
      company_type: data.company_type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
  return { success: true }
}

export async function uploadCompanyKbis(companyId: string, formData: FormData) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  // Use admin client to bypass RLS recursive policy on users table
  const supabase = createAdminClient()

  // Verify user belongs to this company
  const { data: userProfile } = await supabase
    .from("users")
    .select("company_id")
    .eq("email", authUser.email)
    .single()

  if (userProfile?.company_id !== companyId) {
    return { error: "Accès non autorisé à cette entreprise" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop()
  const fileName = `${companyId}/kbis/${Date.now()}.${fileExt}`

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from("company-documents")
    .upload(fileName, file)

  if (uploadError) {
    return { error: uploadError.message }
  }

  // Update company with kbis_storage_path
  const { error: dbError } = await supabase
    .from("companies")
    .update({
      kbis_storage_path: fileName,
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)

  if (dbError) {
    // Cleanup uploaded file if db update fails
    await supabase.storage.from("company-documents").remove([fileName])
    return { error: dbError.message }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
  return { success: true, storagePath: fileName }
}

export async function completeUserCompanyProfile(
  userId: string,
  companyId: string,
  userData: UserInfoFormData,
  companyData: CompanyInfoFormData,
  kbisFormData?: FormData
) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  // Update user info
  const userResult = await updateUserProfile(userId, userData)
  if (userResult.error) {
    return { error: userResult.error }
  }

  // Update company info
  const companyResult = await updateCompanyProfile(companyId, companyData)
  if (companyResult.error) {
    return { error: companyResult.error }
  }

  // Upload KBIS if SAS and file provided
  if (companyData.company_type === "multi_employee" && kbisFormData) {
    const kbisResult = await uploadCompanyKbis(companyId, kbisFormData)
    if (kbisResult.error) {
      return { error: kbisResult.error }
    }
  }

  revalidatePath("/compte")
  revalidatePath("/mon-compte")
  return { success: true }
}
