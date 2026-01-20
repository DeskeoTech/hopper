import { z } from "zod"
import type { User, Company } from "@/lib/types/database"

// Schema for user info validation
export const userInfoSchema = z.object({
  first_name: z.string().min(1, "Le prénom est requis"),
  last_name: z.string().min(1, "Le nom est requis"),
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
})

// Schema for company info validation
export const companyInfoSchema = z.object({
  name: z.string().min(1, "Le nom de l'entreprise est requis"),
  address: z.string().min(1, "L'adresse est requise"),
  company_type: z.enum(["self_employed", "multi_employee"], {
    required_error: "Le type d'entreprise est requis",
  }),
})

export type UserInfoFormData = z.infer<typeof userInfoSchema>
export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>

// Combined form data for the modal
export interface CompleteProfileFormData {
  user: UserInfoFormData
  company: CompanyInfoFormData
}

// Helper to check if user info is complete
export function isUserInfoComplete(user: User | null): boolean {
  if (!user) return false
  return !!(user.first_name && user.last_name && user.phone)
}

// Helper to check if company info is complete
export function isCompanyInfoComplete(company: Company | null): boolean {
  if (!company) return true // No company = no need to complete

  const hasBasicInfo = !!(
    company.name &&
    company.address &&
    company.company_type
  )

  // If SAS (multi_employee), KBIS is required
  if (company.company_type === "multi_employee") {
    return hasBasicInfo && !!company.kbis_storage_path
  }

  // If EI (self_employed), only basic info is required
  return hasBasicInfo
}

// Combined helper to check if all required info is complete
export function isUserCompanyInfoComplete(
  user: User | null,
  company: Company | null
): boolean {
  return isUserInfoComplete(user) && isCompanyInfoComplete(company)
}
