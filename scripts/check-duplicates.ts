import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

const envPath = resolve(__dirname, "../.env.local")
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, "utf-8")
  for (const line of envContent.split("\n")) {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const value = match[2].trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // Get Casa Deskeo site
  const { data: sites } = await supabase.from("sites").select("id").or("name.ilike.%casa%,name.ilike.%victoire%")
  const siteId = sites![0].id

  // Get resources for this site
  const { data: resources } = await supabase.from("resources").select("id, name").eq("site_id", siteId)
  const resourceIds = resources!.map((r) => r.id)
  const resourceNames = new Map(resources!.map((r) => [r.id, r.name]))

  // Get all bookings for these resources
  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, user_id, resource_id, start_date, end_date, status, credits_used")
    .in("resource_id", resourceIds)
    .order("start_date")

  // Get users for display
  const userIds = [...new Set(bookings!.map((b) => b.user_id).filter(Boolean))]
  const { data: users } = await supabase.from("users").select("id, email, first_name, last_name").in("id", userIds)
  const userMap = new Map(users!.map((u) => [u.id, u]))

  // Find duplicates: same user_id + resource_id + start_date + end_date
  const seen = new Map<string, (typeof bookings)[number][]>()
  for (const b of bookings!) {
    const key = [b.user_id, b.resource_id, b.start_date, b.end_date].join("|")
    if (!seen.has(key)) seen.set(key, [])
    seen.get(key)!.push(b)
  }

  const duplicates = [...seen.entries()].filter(([, group]) => group.length > 1)

  console.log("Total réservations Casa Deskeo:", bookings!.length)
  console.log("Groupes de doublons:", duplicates.length)
  console.log()

  if (duplicates.length === 0) {
    console.log("✅ Aucun doublon trouvé")
    return
  }

  for (const [, group] of duplicates) {
    const first = group[0]
    const user = userMap.get(first.user_id)
    const room = resourceNames.get(first.resource_id)
    console.log("─────────────────────────────────")
    console.log("Salle:", room, "| User:", user?.email || first.user_id)
    console.log("Date:", first.start_date, "→", first.end_date)
    console.log("Occurrences:", group.length)
    for (const b of group) {
      console.log("  -", b.id, "| status:", b.status, "| credits:", b.credits_used)
    }
  }

  const toRemove = duplicates.reduce((sum, [, group]) => sum + group.length - 1, 0)
  console.log()
  console.log("Total doublons à supprimer:", toRemove)
}

main().catch(console.error)
