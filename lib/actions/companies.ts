"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { CompanyType, SubscriptionPeriod } from "@/lib/types/database"

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
