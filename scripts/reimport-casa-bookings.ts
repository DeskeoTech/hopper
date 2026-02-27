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
    "Missing env vars. Usage:\n  npx tsx scripts/reimport-casa-bookings.ts [--dry-run]"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DRY_RUN = process.argv.includes("--dry-run")

// ── CSV Parsing ─────────────────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
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
  console.log(DRY_RUN ? "🔍 DRY RUN MODE\n" : "🚀 IMPORT MODE\n")

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

  // 2. Load resources
  console.log("── Etape 2 : Chargement des ressources ──")
  const { data: resources } = await supabase
    .from("resources")
    .select("id, name, type")
    .eq("site_id", site.id)

  if (!resources || resources.length === 0) {
    console.error("Aucune ressource trouvée !")
    process.exit(1)
  }

  const meetingRoomIds = resources.filter((r) => r.type === "meeting_room").map((r) => r.id)
  const resourceMap = new Map<string, string>()
  for (const r of resources) {
    resourceMap.set(r.name.toLowerCase(), r.id)
  }
  console.log(`${resources.length} ressources, ${meetingRoomIds.length} salles de réunion\n`)

  // 3. DELETE all existing meeting room bookings for Casa Deskeo
  console.log("── Etape 3 : Suppression des réservations salles existantes ──")
  const { data: existingBookings } = await supabase
    .from("bookings")
    .select("id")
    .in("resource_id", meetingRoomIds)

  const existingCount = existingBookings?.length || 0
  console.log(`${existingCount} réservations existantes à supprimer`)

  if (existingCount > 0 && !DRY_RUN) {
    const BATCH_DELETE = 100
    let deleted = 0
    const ids = existingBookings!.map((b) => b.id)
    for (let i = 0; i < ids.length; i += BATCH_DELETE) {
      const batch = ids.slice(i, i + BATCH_DELETE)
      const { error } = await supabase.from("bookings").delete().in("id", batch)
      if (error) {
        console.error(`  ❌ Erreur suppression batch: ${error.message}`)
      } else {
        deleted += batch.length
        console.log(`  🗑️  Batch ${Math.floor(i / BATCH_DELETE) + 1} : ${batch.length} supprimées`)
      }
    }
    console.log(`Total supprimé : ${deleted}\n`)
  } else if (DRY_RUN) {
    console.log(`[DRY] Supprimerait ${existingCount} réservations\n`)
  }

  // 4. Parse CSV
  console.log("── Etape 4 : Lecture du CSV ──")
  const csvContent = readFileSync(
    resolve(__dirname, "../.context/attachments/report-bookings (3)-v1.csv"),
    "utf-8"
  )
  const bookingsData = parseCSV(csvContent)
  const activeBookings = bookingsData.filter((b) => !b["Delete date"])
  console.log(`${bookingsData.length} lignes, ${activeBookings.length} actives\n`)

  // Deduplicate: same owner email + room + date + start time
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
  console.log(`${uniqueBookings.length} uniques (${duplicatesSkipped} doublons CSV)\n`)

  // 5. Find/create Deskeo company
  console.log("── Etape 5 : Recherche entreprise DESKEO ──")
  const { data: deskeoCompany } = await supabase
    .from("companies")
    .select("id, name")
    .ilike("name", "%deskeo%")
    .limit(1)
    .maybeSingle()

  let deskeoCompanyId: string | null = null
  if (deskeoCompany) {
    deskeoCompanyId = deskeoCompany.id
    console.log(`Entreprise DESKEO trouvée : ${deskeoCompany.name} (${deskeoCompany.id})\n`)
  } else {
    console.log("Entreprise DESKEO non trouvée, création...")
    if (!DRY_RUN) {
      const { data: created, error } = await supabase
        .from("companies")
        .insert({ name: "DESKEO", company_type: "multi_employee", main_site_id: site.id })
        .select("id")
        .single()
      if (error) {
        console.error(`❌ Erreur création DESKEO: ${error.message}`)
        process.exit(1)
      }
      deskeoCompanyId = created.id
      console.log(`Entreprise DESKEO créée (${created.id})\n`)
    } else {
      console.log("[DRY] Créerait l'entreprise DESKEO\n")
    }
  }

  // 6. Load existing users & create missing @deskeo.fr users
  console.log("── Etape 6 : Chargement des utilisateurs ──")
  const { data: allUsers } = await supabase.from("users").select("id, email, company_id")
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
  console.log(`${userByEmail.size} utilisateurs existants\n`)

  // Collect all @deskeo.fr emails from CSV that don't exist
  const deskeoEmailsNeeded = new Set<string>()
  const deskeoUserInfo = new Map<string, { firstName: string; lastName: string }>()
  for (const b of uniqueBookings) {
    const email = b["Owner email"].toLowerCase().trim()
    if (email.endsWith("@deskeo.fr") && !userByEmail.has(email)) {
      deskeoEmailsNeeded.add(email)
      deskeoUserInfo.set(email, {
        firstName: b["Owner name"],
        lastName: b["Owner surname"],
      })
    }
  }

  if (deskeoEmailsNeeded.size > 0) {
    console.log(`── Etape 6b : Création de ${deskeoEmailsNeeded.size} utilisateurs @deskeo.fr ──`)
    for (const email of [...deskeoEmailsNeeded].sort()) {
      const info = deskeoUserInfo.get(email)!
      if (DRY_RUN) {
        console.log(`  [DRY] Créerait ${email} (${info.firstName} ${info.lastName})`)
        userByEmail.set(email, { id: `dry-${email}`, company_id: deskeoCompanyId })
        continue
      }

      const { data: created, error } = await supabase
        .from("users")
        .insert({
          email,
          first_name: info.firstName || null,
          last_name: info.lastName || null,
          company_id: deskeoCompanyId,
          role: "user",
          status: "active",
        })
        .select("id")
        .single()

      if (error) {
        console.error(`  ❌ Erreur création ${email}: ${error.message}`)
        continue
      }

      console.log(`  ✅ ${email} (${info.firstName} ${info.lastName}) → ${created.id}`)
      userByEmail.set(email, { id: created.id, company_id: deskeoCompanyId })

      // Create Supabase Auth account
      const { error: authError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
      })
      if (authError && !authError.message?.includes("already been registered")) {
        console.error(`  ⚠️  Auth error for ${email}: ${authError.message}`)
      }
    }
    console.log()
  }

  // 7. Import bookings
  console.log("── Etape 7 : Import des réservations ──")
  let skippedNoUser = 0
  let skippedNoResource = 0
  let errors = 0
  const unmatchedEmails = new Set<string>()
  const unmatchedRooms = new Set<string>()
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
      errors++
      continue
    }

    const resourceId = resourceMap.get(roomName.toLowerCase())
    if (!resourceId) {
      unmatchedRooms.add(roomName)
      skippedNoResource++
      continue
    }

    const user = userByEmail.get(email)
    if (!user) {
      unmatchedEmails.add(email)
      skippedNoUser++
      continue
    }

    const startDate = `${dateStr}T${startTime}:00`
    const endDate = `${dateStr}T${endTime}:00`

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

  console.log(`${toInsert.length} réservations à insérer\n`)

  if (DRY_RUN) {
    console.log("[DRY RUN] Aucune insertion effectuée\n")
  } else {
    const BATCH_SIZE = 50
    let created = 0
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const batch = toInsert.slice(i, i + BATCH_SIZE)
      const { error } = await supabase.from("bookings").insert(batch)
      if (error) {
        console.error(`  ❌ Erreur batch ${i / BATCH_SIZE + 1}: ${error.message}`)
        errors += batch.length
      } else {
        created += batch.length
        console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} : ${batch.length} insérées`)
      }
    }
    console.log(`\nTotal insérées : ${created}\n`)
  }

  // Summary
  console.log("══════════════════════════════════════")
  console.log("           RÉSUMÉ DE L'IMPORT")
  console.log("══════════════════════════════════════")
  console.log(`  Supprimées (ancien) : ${existingCount}`)
  console.log(`  Total CSV           : ${bookingsData.length}`)
  console.log(`  Supprimées CSV      : ${bookingsData.length - activeBookings.length}`)
  console.log(`  Doublons CSV        : ${duplicatesSkipped}`)
  console.log(`  Users @deskeo créés : ${deskeoEmailsNeeded.size}`)
  console.log(`  Sans utilisateur    : ${skippedNoUser}`)
  console.log(`  Sans ressource      : ${skippedNoResource}`)
  console.log(`  Erreurs             : ${errors}`)
  console.log(`  ────────────────────────────────────`)
  console.log(`  À insérer           : ${toInsert.length}`)
  console.log("══════════════════════════════════════\n")

  if (unmatchedEmails.size > 0) {
    console.log(`⚠️  Emails non trouvés (${unmatchedEmails.size}) :`)
    for (const e of [...unmatchedEmails].sort()) console.log(`    - ${e}`)
    console.log()
  }
  if (unmatchedRooms.size > 0) {
    console.log(`⚠️  Salles non trouvées (${unmatchedRooms.size}) :`)
    for (const r of [...unmatchedRooms].sort()) console.log(`    - ${r}`)
    console.log()
  }

  console.log("✅ Terminé !")
}

main().catch((err) => {
  console.error("Erreur fatale:", err)
  process.exit(1)
})
