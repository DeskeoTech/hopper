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
    "Missing env vars. Usage:\n  SUPABASE_SECRET_KEY=xxx npx tsx scripts/import-casa-bookings.ts [--dry-run]"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DRY_RUN = process.argv.includes("--dry-run")

// ── CSV Parsing ─────────────────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  // Remove BOM if present
  const clean = content.replace(/^\uFEFF/, "")
  const lines = clean.split("\n")
  const headers = parseCSVLine(lines[0])
  const records: Record<string, string>[] = []

  let i = 1
  while (i < lines.length) {
    let line = lines[i]
    while (line && countQuotes(line) % 2 !== 0 && i + 1 < lines.length) {
      i++
      line += "\n" + lines[i]
    }
    i++

    if (!line.trim()) continue

    const values = parseCSVLine(line)
    const record: Record<string, string> = {}
    headers.forEach((h, idx) => {
      record[h.trim()] = (values[idx] || "").trim()
    })
    records.push(record)
  }

  return records
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === "," && !inQuotes) {
      result.push(current)
      current = ""
    } else {
      current += char
    }
  }
  result.push(current)
  return result
}

function countQuotes(line: string): number {
  let count = 0
  for (const char of line) {
    if (char === '"') count++
  }
  return count
}

// ── Date parsing ────────────────────────────────────────────────────────────

const MONTHS_FR: Record<string, string> = {
  "janv.": "01", "févr.": "02", "mars": "03", "avr.": "04",
  "mai": "05", "juin": "06", "juil.": "07", "août": "08",
  "sept.": "09", "oct.": "10", "nov.": "11", "déc.": "12",
}

function parseFrenchDate(dateStr: string): string | null {
  if (!dateStr) return null
  const parts = dateStr.trim().split(" ")
  if (parts.length !== 3) return null

  const day = parts[0].padStart(2, "0")
  const month = MONTHS_FR[parts[1]]
  const year = parts[2]

  if (!month) return null
  return `${year}-${month}-${day}`
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? "🔍 DRY RUN MODE — no changes will be made\n" : "🚀 IMPORT MODE\n")

  // 1. Find CASA DESKEO site
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

  // 2. Get all resources for this site
  console.log("── Etape 2 : Chargement des ressources ──")
  const { data: resources } = await supabase
    .from("resources")
    .select("id, name, type")
    .eq("site_id", site.id)

  if (!resources || resources.length === 0) {
    console.error("Aucune ressource trouvée pour ce site !")
    process.exit(1)
  }

  // Build name → resource_id map (case-insensitive)
  const resourceMap = new Map<string, string>()
  for (const r of resources) {
    resourceMap.set(r.name.toLowerCase(), r.id)
  }
  console.log(`${resources.length} ressources chargées : ${resources.map((r) => r.name).join(", ")}\n`)

  // 3. Parse CSV
  console.log("── Etape 3 : Lecture du CSV ──")
  const csvContent = readFileSync(
    resolve(__dirname, "../.context/attachments/report-bookings (1)-v1.csv"),
    "utf-8"
  )
  const bookingsData = parseCSV(csvContent)
  console.log(`${bookingsData.length} lignes dans le CSV\n`)

  // 4. Filter: remove deleted bookings
  const activeBookings = bookingsData.filter((b) => !b["Delete date"])
  console.log(`${activeBookings.length} réservations actives (${bookingsData.length - activeBookings.length} supprimées)\n`)

  // 5. Deduplicate: same owner email + room + date + start time
  const seen = new Set<string>()
  const uniqueBookings: Record<string, string>[] = []
  let duplicatesSkipped = 0

  for (const b of activeBookings) {
    const key = [
      b["Owner email"].toLowerCase(),
      b["Resource title"].toLowerCase(),
      b["Date"],
      b["Start time"],
    ].join("|")

    if (seen.has(key)) {
      duplicatesSkipped++
      continue
    }
    seen.add(key)
    uniqueBookings.push(b)
  }
  console.log(`${uniqueBookings.length} réservations uniques (${duplicatesSkipped} doublons ignorés)\n`)

  // 6. Load all users for email matching
  console.log("── Etape 4 : Chargement des utilisateurs ──")
  const { data: allUsers } = await supabase
    .from("users")
    .select("id, email, company_id")

  if (!allUsers) {
    console.error("Impossible de charger les utilisateurs !")
    process.exit(1)
  }

  const userByEmail = new Map<string, { id: string; company_id: string | null }>()
  for (const u of allUsers) {
    if (u.email) {
      userByEmail.set(u.email.toLowerCase(), { id: u.id, company_id: u.company_id })
    }
  }
  console.log(`${userByEmail.size} utilisateurs chargés\n`)

  // 7. Load existing bookings for this site to avoid duplicates in DB
  console.log("── Etape 5 : Vérification des réservations existantes ──")
  const resourceIds = resources.map((r) => r.id)
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id, user_id, resource_id, start_date, end_date")
    .in("resource_id", resourceIds)

  const existingBookingKeys = new Set<string>()
  if (existingBookings) {
    for (const eb of existingBookings) {
      const key = `${eb.user_id}|${eb.resource_id}|${eb.start_date}`
      existingBookingKeys.add(key)
    }
  }
  console.log(`${existingBookings?.length || 0} réservations existantes en base\n`)

  // 8. Import bookings
  console.log("── Etape 6 : Import des réservations ──")
  let created = 0
  let skippedNoUser = 0
  let skippedNoResource = 0
  let skippedDuplicateDB = 0
  let errors = 0
  const unmatchedEmails = new Set<string>()
  const unmatchedRooms = new Set<string>()

  const BATCH_SIZE = 50
  const toInsert: Record<string, unknown>[] = []

  for (const b of uniqueBookings) {
    const email = b["Owner email"].toLowerCase().trim()
    const roomName = b["Resource title"]
    const dateStr = parseFrenchDate(b["Date"])
    const startTime = b["Start time"]
    const endTime = b["End time"]
    const creditsUsed = b["Payment price"] ? parseInt(b["Payment price"], 10) : null
    const seatsCount = b["Seats/Quantity booked"] ? parseInt(b["Seats/Quantity booked"], 10) : null

    if (!dateStr || !startTime || !endTime) {
      console.error(`  ❌ Date/heure invalide pour ${b["ID"]}`)
      errors++
      continue
    }

    // Match resource
    const resourceId = resourceMap.get(roomName.toLowerCase())
    if (!resourceId) {
      unmatchedRooms.add(roomName)
      skippedNoResource++
      continue
    }

    // Match user
    const user = userByEmail.get(email)
    if (!user) {
      unmatchedEmails.add(email)
      skippedNoUser++
      continue
    }

    // Build timestamps
    const startDate = `${dateStr}T${startTime}:00`
    const endDate = `${dateStr}T${endTime}:00`

    // Check for existing booking in DB
    const dbKey = `${user.id}|${resourceId}|${startDate}`
    if (existingBookingKeys.has(dbKey)) {
      skippedDuplicateDB++
      continue
    }

    toInsert.push({
      user_id: user.id,
      resource_id: resourceId,
      start_date: startDate,
      end_date: endDate,
      status: "confirmed",
      credits_used: creditsUsed || 0,
      seats_count: seatsCount,
    })
  }

  console.log(`\n${toInsert.length} réservations à insérer`)

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Aucune insertion effectuée`)
  } else {
    // Insert in batches
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from("bookings").insert(batch)

      if (error) {
        console.error(`  ❌ Erreur batch ${i / BATCH_SIZE + 1}: ${error.message}`)
        errors += batch.length
      } else {
        created += batch.length
        console.log(`  ✅ Batch ${i / BATCH_SIZE + 1} : ${batch.length} réservations insérées`)
      }
    }
  }

  // 9. Summary
  console.log("\n══════════════════════════════════════")
  console.log("           RÉSUMÉ DE L'IMPORT")
  console.log("══════════════════════════════════════")
  console.log(`  Total CSV          : ${bookingsData.length}`)
  console.log(`  Supprimées         : ${bookingsData.length - activeBookings.length}`)
  console.log(`  Doublons CSV       : ${duplicatesSkipped}`)
  console.log(`  Doublons en base   : ${skippedDuplicateDB}`)
  console.log(`  Sans utilisateur   : ${skippedNoUser}`)
  console.log(`  Sans ressource     : ${skippedNoResource}`)
  console.log(`  Erreurs            : ${errors}`)
  console.log(`  ────────────────────────────────────`)
  console.log(`  À insérer          : ${toInsert.length}`)
  if (!DRY_RUN) {
    console.log(`  Insérées           : ${created}`)
  }
  console.log("══════════════════════════════════════\n")

  if (unmatchedEmails.size > 0) {
    console.log(`⚠️  Emails non trouvés (${unmatchedEmails.size}) :`)
    for (const e of [...unmatchedEmails].sort()) {
      console.log(`    - ${e}`)
    }
    console.log()
  }

  if (unmatchedRooms.size > 0) {
    console.log(`⚠️  Salles non trouvées (${unmatchedRooms.size}) :`)
    for (const r of [...unmatchedRooms].sort()) {
      console.log(`    - ${r}`)
    }
    console.log()
  }

  console.log("✅ Import terminé !")
}

main().catch((err) => {
  console.error("Erreur fatale:", err)
  process.exit(1)
})
