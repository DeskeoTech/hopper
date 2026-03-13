"use server"

import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"
import { getStorageUrl } from "@/lib/utils"

async function verifyHopperAdmin(): Promise<{
  authorized: boolean
  error: string | null
  adminId: string | null
}> {
  const authUser = await getUser()
  if (!authUser?.email) {
    return { authorized: false, error: "Non authentifié", adminId: null }
  }

  const supabase = await createClient()
  const { data: user } = await supabase
    .from("users")
    .select("id, is_hopper_admin")
    .eq("email", authUser.email)
    .single()

  if (!user?.is_hopper_admin) {
    return { authorized: false, error: "Accès non autorisé", adminId: null }
  }

  return { authorized: true, error: null, adminId: user.id }
}

// --- Types for the café page ---

export interface CafeUserSearchResult {
  id: string
  first_name: string | null
  last_name: string | null
  company_name: string | null
}

export interface CafeUserFiche {
  id: string
  first_name: string | null
  last_name: string | null
  photo_url: string | null
  company_name: string | null
  plan_name: string | null
  daily_drink_limit: number
  today_consumption_count: number
  last_consumption_at: string | null
  eligible_beverages: { id: string; name: string }[]
  contract_status: string | null
}

export interface CafeBeverageWithPlans {
  id: string
  name: string
  plan_names: string[]
}

// --- Search users with active café pass ---

export async function searchCafeUsers(
  query: string
): Promise<{ data: CafeUserSearchResult[]; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { data: [], error: auth.error }

  if (!query || query.trim().length < 2) return { data: [], error: null }

  const supabase = await createClient()
  const searchTerm = `%${query.trim()}%`

  const { data: users, error } = await supabase
    .from("users")
    .select("id, first_name, last_name, company_id, companies(name)")
    .not("cafe_contract_id", "is", null)
    .eq("status", "active")
    .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`)
    .order("last_name")
    .limit(10)

  if (error) return { data: [], error: error.message }

  const results: CafeUserSearchResult[] = (users || []).map((u: Record<string, unknown>) => ({
    id: u.id as string,
    first_name: u.first_name as string | null,
    last_name: u.last_name as string | null,
    company_name: (u.companies as Record<string, unknown> | null)?.name as string | null,
  }))

  return { data: results, error: null }
}

// --- Get user fiche for barista view ---

export async function getCafeUserFiche(
  userId: string
): Promise<{ data: CafeUserFiche | null; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { data: null, error: auth.error }

  const supabase = await createClient()

  // Fetch user with contract -> plan
  const { data: user, error: userError } = await supabase
    .from("users")
    .select(
      "id, first_name, last_name, photo_storage_path, company_id, cafe_contract_id, companies(name)"
    )
    .eq("id", userId)
    .single()

  if (userError || !user) {
    return { data: null, error: "Utilisateur non trouvé" }
  }

  if (!user.cafe_contract_id) {
    return { data: null, error: "Cet utilisateur n'a pas de pass café" }
  }

  // Fetch contract -> plan
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status, plan_id, plans(name, daily_drink_limit)")
    .eq("id", user.cafe_contract_id)
    .single()

  if (!contract) {
    return { data: null, error: "Contrat café non trouvé" }
  }

  const plan = contract.plans as Record<string, unknown> | null
  const planName = (plan?.name as string) || "Inconnu"
  const dailyLimit = (plan?.daily_drink_limit as number) || 2

  // Get today's consumption count (Paris timezone)
  const now = new Date()
  const parisDate = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  // parisDate = "DD/MM/YYYY", convert to ISO start of day
  const [day, month, year] = parisDate.split("/")
  const todayStart = `${year}-${month}-${day}T00:00:00+01:00`

  const { count: todayCount } = await supabase
    .from("cafe_consumptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart)

  // Get last consumption timestamp
  const { data: lastConso } = await supabase
    .from("cafe_consumptions")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Get eligible beverages for user's plan
  const { data: eligibleBeverages } = await supabase
    .from("cafe_beverage_plan_eligibility")
    .select("beverage_id, cafe_beverages(id, name)")
    .eq("plan_name", planName)

  const beverages: { id: string; name: string }[] = (eligibleBeverages || []).map(
    (e: Record<string, unknown>) => {
      const bev = e.cafe_beverages as Record<string, unknown> | null
      return {
        id: (bev?.id as string) || "",
        name: (bev?.name as string) || "",
      }
    }
  )

  const photoUrl = user.photo_storage_path
    ? getStorageUrl("user-photos", user.photo_storage_path)
    : null

  return {
    data: {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      photo_url: photoUrl,
      company_name: (user.companies as Record<string, unknown> | null)?.name as string | null,
      plan_name: planName,
      daily_drink_limit: dailyLimit,
      today_consumption_count: todayCount || 0,
      last_consumption_at: lastConso?.created_at || null,
      eligible_beverages: beverages,
      contract_status: contract.status,
    },
    error: null,
  }
}

// --- Record consumption ---

export async function recordConsumption(
  userId: string,
  beverageIds: string[],
  adminId: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  if (!beverageIds.length) return { success: false, error: "Aucune boisson sélectionnée" }

  const supabase = await createClient()
  const adminClient = createAdminClient()

  // Re-fetch user + plan for validation
  const { data: user } = await supabase
    .from("users")
    .select("id, cafe_contract_id")
    .eq("id", userId)
    .single()

  if (!user?.cafe_contract_id) {
    return { success: false, error: "Cet utilisateur n'a pas de pass café" }
  }

  const { data: contract } = await supabase
    .from("contracts")
    .select("id, status, plan_id, plans(name, daily_drink_limit)")
    .eq("id", user.cafe_contract_id)
    .single()

  if (!contract || contract.status !== "active") {
    return { success: false, error: "Le forfait café n'est pas actif" }
  }

  const plan = contract.plans as Record<string, unknown> | null
  const planName = (plan?.name as string) || ""
  const dailyLimit = (plan?.daily_drink_limit as number) || 2

  // Check today's consumption (Paris timezone)
  const now = new Date()
  const parisDate = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now)
  const [day, month, year] = parisDate.split("/")
  const todayStart = `${year}-${month}-${day}T00:00:00+01:00`

  const { count: todayCount } = await supabase
    .from("cafe_consumptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", todayStart)

  if ((todayCount || 0) + beverageIds.length > dailyLimit) {
    const remaining = dailyLimit - (todayCount || 0)
    return {
      success: false,
      error: `Limite journalière atteinte. ${remaining > 0 ? `Il reste ${remaining} consommation(s) possible(s).` : "Aucune consommation restante aujourd'hui."}`,
    }
  }

  // Check 58-minute cooldown
  const { data: lastConso } = await supabase
    .from("cafe_consumptions")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (lastConso) {
    const lastTime = new Date(lastConso.created_at).getTime()
    const diffMinutes = (now.getTime() - lastTime) / (1000 * 60)
    if (diffMinutes < 58) {
      const waitMinutes = Math.ceil(58 - diffMinutes)
      return {
        success: false,
        error: `Veuillez attendre encore ${waitMinutes} minute(s) avant la prochaine consommation.`,
      }
    }
  }

  // Verify beverage eligibility
  const { data: eligibleBevs } = await supabase
    .from("cafe_beverage_plan_eligibility")
    .select("beverage_id")
    .eq("plan_name", planName)
    .in("beverage_id", beverageIds)

  const eligibleIds = new Set((eligibleBevs || []).map((e: Record<string, unknown>) => e.beverage_id as string))
  const invalidIds = beverageIds.filter((id) => !eligibleIds.has(id))
  if (invalidIds.length > 0) {
    return { success: false, error: "Certaines boissons ne sont pas incluses dans ce forfait." }
  }

  // Insert consumptions
  const rows = beverageIds.map((beverageId) => ({
    user_id: userId,
    beverage_id: beverageId,
    served_by_admin_id: adminId,
  }))

  const { error: insertError } = await adminClient.from("cafe_consumptions").insert(rows)

  if (insertError) {
    return { success: false, error: insertError.message }
  }

  revalidatePath("/cafe")
  return { success: true, error: null }
}

// --- CRUD Beverages ---

export async function getCafeBeverages(): Promise<{
  data: CafeBeverageWithPlans[]
  error: string | null
}> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { data: [], error: auth.error }

  const supabase = await createClient()

  const { data: beverages, error } = await supabase
    .from("cafe_beverages")
    .select("id, name, cafe_beverage_plan_eligibility(plan_name)")
    .order("name")

  if (error) return { data: [], error: error.message }

  const results: CafeBeverageWithPlans[] = (beverages || []).map(
    (b: Record<string, unknown>) => ({
      id: b.id as string,
      name: b.name as string,
      plan_names: ((b.cafe_beverage_plan_eligibility as Record<string, unknown>[]) || [])
        .map((e) => e.plan_name as string)
        .filter((pn) => SOLD_CAFE_PLANS.includes(pn)),
    })
  )

  return { data: results, error: null }
}

export async function createCafeBeverage(
  name: string,
  planNames: string[]
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  if (!name.trim()) return { success: false, error: "Le nom est requis" }

  const adminClient = createAdminClient()

  const { data: beverage, error: insertError } = await adminClient
    .from("cafe_beverages")
    .insert({ name: name.trim() })
    .select("id")
    .single()

  if (insertError) {
    if (insertError.code === "23505") {
      return { success: false, error: "Cette boisson existe déjà" }
    }
    return { success: false, error: insertError.message }
  }

  if (planNames.length > 0) {
    const rows = planNames.map((pn) => ({
      beverage_id: beverage.id,
      plan_name: pn,
    }))
    await adminClient.from("cafe_beverage_plan_eligibility").insert(rows)
  }

  revalidatePath("/cafe")
  return { success: true, error: null }
}

export async function updateCafeBeverage(
  id: string,
  name: string,
  planNames: string[]
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  if (!name.trim()) return { success: false, error: "Le nom est requis" }

  const adminClient = createAdminClient()

  const { error: updateError } = await adminClient
    .from("cafe_beverages")
    .update({ name: name.trim() })
    .eq("id", id)

  if (updateError) {
    if (updateError.code === "23505") {
      return { success: false, error: "Cette boisson existe déjà" }
    }
    return { success: false, error: updateError.message }
  }

  // Replace eligibility
  await adminClient.from("cafe_beverage_plan_eligibility").delete().eq("beverage_id", id)

  if (planNames.length > 0) {
    const rows = planNames.map((pn) => ({
      beverage_id: id,
      plan_name: pn,
    }))
    await adminClient.from("cafe_beverage_plan_eligibility").insert(rows)
  }

  revalidatePath("/cafe")
  return { success: true, error: null }
}

export async function deleteCafeBeverage(
  id: string
): Promise<{ success: boolean; error: string | null }> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { success: false, error: auth.error }

  const adminClient = createAdminClient()

  const { error } = await adminClient.from("cafe_beverages").delete().eq("id", id)

  if (error) return { success: false, error: error.message }

  revalidatePath("/cafe")
  return { success: true, error: null }
}

// --- Get sold café plan names (for beverage form + display) ---

// Only plans currently sold on the platform
const SOLD_CAFE_PLANS = [
  "JUICE BOOST 3 DAYS",
  "COLOR LATTE CLUB 3 DAYS",
  "INFINITY COFFEE CHOICE 3 DAYS",
  "UNLIMITED ESPRESSO 5 DAYS",
  "JUICE BOOST 5 DAYS",
  "COLOR LATTE CLUB 5 DAYS",
  "INFINITY COFFEE CHOICE 5 DAYS",
]

export async function getCafePlanNames(): Promise<string[]> {
  return SOLD_CAFE_PLANS
}

// --- Get café plans with Stripe price IDs for a given site ---

export interface CafePlanWithPrice {
  name: string
  price_per_seat_month: number
  stripe_price_id: string
}

export async function getCafePlansForSite(siteId: string): Promise<CafePlanWithPrice[]> {
  const supabase = createAdminClient()

  // Determine the stripe account for this site
  const { data: site } = await supabase
    .from("sites")
    .select("stripe_account")
    .eq("id", siteId)
    .single()

  const stripeAccount = site?.stripe_account || "hopper-coworking"
  const priceColumn = stripeAccount !== "hopper-coworking"
    ? `stripe_price_id_${stripeAccount}`
    : "stripe_price_id"

  const { data: plans } = await supabase
    .from("plans")
    .select(`name, price_per_seat_month, ${priceColumn}`)
    .eq("service_type", "coffee_subscription")
    .eq("archived", false)
    .in("name", SOLD_CAFE_PLANS)
    .order("price_per_seat_month")

  if (!plans) return []

  return plans
    .filter((p) => p[priceColumn])
    .map((p) => ({
      name: p.name,
      price_per_seat_month: p.price_per_seat_month,
      stripe_price_id: p[priceColumn] as string,
    }))
}

// --- Dashboard stats ---

export interface CafeDashboardDay {
  date: string // YYYY-MM-DD
  total: number
  by_beverage: Record<string, number>
}

export async function getCafeDashboardData(days: number = 30): Promise<{
  data: CafeDashboardDay[]
  error: string | null
}> {
  const auth = await verifyHopperAdmin()
  if (!auth.authorized) return { data: [], error: auth.error }

  const supabase = await createClient()

  // Fetch consumptions for the last N days
  const since = new Date()
  since.setDate(since.getDate() - days)

  const { data: consumptions, error } = await supabase
    .from("cafe_consumptions")
    .select("created_at, beverage_id, cafe_beverages(name)")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })

  if (error) return { data: [], error: error.message }

  // Group by day (Paris timezone) and beverage
  const dayMap = new Map<string, { total: number; by_beverage: Record<string, number> }>()

  for (const c of consumptions || []) {
    const dt = new Date(c.created_at as string)
    const dateStr = dt.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" }) // YYYY-MM-DD
    const bevName = (c.cafe_beverages as Record<string, unknown> | null)?.name as string || "Inconnu"

    if (!dayMap.has(dateStr)) {
      dayMap.set(dateStr, { total: 0, by_beverage: {} })
    }
    const day = dayMap.get(dateStr)!
    day.total++
    day.by_beverage[bevName] = (day.by_beverage[bevName] || 0) + 1
  }

  // Fill in missing days with zeros
  const result: CafeDashboardDay[] = []
  const current = new Date(since)
  const today = new Date()
  while (current <= today) {
    const dateStr = current.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" })
    const existing = dayMap.get(dateStr)
    result.push({
      date: dateStr,
      total: existing?.total || 0,
      by_beverage: existing?.by_beverage || {},
    })
    current.setDate(current.getDate() + 1)
  }

  return { data: result, error: null }
}
