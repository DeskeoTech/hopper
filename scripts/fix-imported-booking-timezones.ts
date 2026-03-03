import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { resolve } from "path"

// ── Load .env.local if present ──────────────────────────────────────────────
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

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    "Missing env vars. Usage:\n  npx tsx scripts/fix-imported-booking-timezones.ts [--dry-run]"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DRY_RUN = process.argv.includes("--dry-run")

async function main() {
  console.log(DRY_RUN ? "🔍 DRY RUN MODE\n" : "🚀 FIX MODE\n")

  // 1. Find Casa Deskeo site
  console.log("── Etape 1 : Recherche du site CASA DESKEO ──")
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name")
    .or("name.ilike.%casa%,name.ilike.%victoire%")

  if (!sites || sites.length === 0) {
    console.error("Site CASA DESKEO introuvable !")
    process.exit(1)
  }
  const site = sites[0]
  console.log(`Site trouvé : "${site.name}" (${site.id})\n`)

  // 2. Find meeting room resources
  console.log("── Etape 2 : Chargement des salles de réunion ──")
  const { data: resources } = await supabase
    .from("resources")
    .select("id, name")
    .eq("site_id", site.id)
    .eq("type", "meeting_room")

  if (!resources || resources.length === 0) {
    console.error("Aucune salle de réunion trouvée !")
    process.exit(1)
  }

  const meetingRoomIds = resources.map((r) => r.id)
  console.log(`${resources.length} salles de réunion trouvées\n`)

  // 3. Fix bookings using SQL with AT TIME ZONE
  // The imported bookings have Paris local times stored as UTC.
  // Example: 09:00 Paris was stored as 09:00 UTC (should be 08:00 UTC in winter).
  // The SQL converts: interpret the stored UTC value as Paris time, then store as proper UTC.
  console.log("── Etape 3 : Correction des fuseaux horaires ──")

  // First, let's see how many bookings will be affected
  const { data: bookings, error: fetchError } = await supabase
    .from("bookings")
    .select("id, start_date, end_date, resource_id")
    .in("resource_id", meetingRoomIds)

  if (fetchError) {
    console.error(`Erreur: ${fetchError.message}`)
    process.exit(1)
  }

  console.log(`${bookings?.length || 0} réservations à corriger\n`)

  if (!bookings || bookings.length === 0) {
    console.log("Aucune réservation à corriger.")
    return
  }

  // Show a few examples
  console.log("Exemples de corrections :")
  for (const b of bookings.slice(0, 5)) {
    const room = resources.find((r) => r.id === b.resource_id)
    const oldStart = new Date(b.start_date)
    const oldEnd = new Date(b.end_date)

    // Determine the Paris offset for this date
    // We need to figure out what the correct UTC time should be
    // The stored time is the Paris local time but in UTC
    // We need to convert: treat stored UTC as Paris, get real UTC
    const parisOffset = getParisOffsetHours(oldStart)

    const newStart = new Date(oldStart.getTime() - parisOffset * 60 * 60 * 1000)
    const newEnd = new Date(oldEnd.getTime() - parisOffset * 60 * 60 * 1000)

    console.log(
      `  ${room?.name || "?"}: ${formatTime(oldStart)} → ${formatTime(newStart)} (offset: -${parisOffset}h)`
    )
  }
  console.log()

  if (DRY_RUN) {
    console.log("[DRY RUN] Aucune modification effectuée\n")
    return
  }

  // Use Supabase RPC to run raw SQL for the timezone conversion
  // This correctly handles DST transitions
  const { error: updateError } = await supabase.rpc("exec_sql", {
    query: `
      UPDATE bookings
      SET
        start_date = start_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris',
        end_date = end_date AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Paris',
        updated_at = now()
      WHERE resource_id = ANY($1::uuid[])
    `,
    params: [meetingRoomIds],
  })

  if (updateError) {
    // If RPC doesn't exist, fall back to batch updates
    console.log("RPC exec_sql non disponible, mise à jour par batch...\n")

    const BATCH_SIZE = 50
    let updated = 0
    let errors = 0

    for (let i = 0; i < bookings.length; i += BATCH_SIZE) {
      const batch = bookings.slice(i, i + BATCH_SIZE)
      const updates = batch.map((b) => {
        const oldStart = new Date(b.start_date)
        const oldEnd = new Date(b.end_date)
        const startOffset = getParisOffsetHours(oldStart)
        const endOffset = getParisOffsetHours(oldEnd)

        return {
          id: b.id,
          start_date: new Date(oldStart.getTime() - startOffset * 60 * 60 * 1000).toISOString(),
          end_date: new Date(oldEnd.getTime() - endOffset * 60 * 60 * 1000).toISOString(),
        }
      })

      // Update each booking individually (Supabase doesn't support batch update well)
      for (const u of updates) {
        const { error } = await supabase
          .from("bookings")
          .update({
            start_date: u.start_date,
            end_date: u.end_date,
            updated_at: new Date().toISOString(),
          })
          .eq("id", u.id)

        if (error) {
          console.error(`  ❌ Erreur ${u.id}: ${error.message}`)
          errors++
        } else {
          updated++
        }
      }

      console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} : ${batch.length} mises à jour`)
    }

    console.log(`\nTotal : ${updated} mises à jour, ${errors} erreurs\n`)
  } else {
    console.log(`✅ ${bookings.length} réservations corrigées via SQL\n`)
  }

  // Verify a few results
  console.log("── Vérification ──")
  const { data: verified } = await supabase
    .from("bookings")
    .select("id, start_date, end_date, resource_id")
    .in("resource_id", meetingRoomIds)
    .order("start_date", { ascending: true })
    .limit(5)

  if (verified) {
    for (const b of verified) {
      const room = resources.find((r) => r.id === b.resource_id)
      const start = new Date(b.start_date)
      const end = new Date(b.end_date)
      // Display in Paris time
      const parisStart = new Date(start.getTime() + getParisOffsetHours(start) * 60 * 60 * 1000)
      const parisEnd = new Date(end.getTime() + getParisOffsetHours(end) * 60 * 60 * 1000)
      console.log(
        `  ${room?.name || "?"}: UTC ${formatTime(start)} → Paris ${formatTime(parisStart)}`
      )
    }
  }

  console.log("\n✅ Terminé !")
}

/**
 * Get the UTC offset for Europe/Paris at a given date.
 * CET = UTC+1 (winter), CEST = UTC+2 (summer)
 */
function getParisOffsetHours(date: Date): number {
  // Use Intl to get the correct offset for any date
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }))
  const parisDate = new Date(date.toLocaleString("en-US", { timeZone: "Europe/Paris" }))
  return (parisDate.getTime() - utcDate.getTime()) / (60 * 60 * 1000)
}

function formatTime(date: Date): string {
  return `${date.toISOString().slice(0, 10)} ${date.getUTCHours().toString().padStart(2, "0")}:${date.getUTCMinutes().toString().padStart(2, "0")}`
}

main().catch((err) => {
  console.error("Erreur fatale:", err)
  process.exit(1)
})
