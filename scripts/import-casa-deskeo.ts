import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// ── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!

if (!SUPABASE_URL || !SUPABASE_SECRET_KEY) {
  console.error(
    "Missing env vars. Usage:\n  SUPABASE_SECRET_KEY=xxx npx tsx scripts/import-casa-deskeo.ts"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const DESKEO_SPACEBRING_ID = "fc70fe40-774f-11ef-9b8f-51316a57cf6f"

const EXCLUDED_EMAILS = new Set([
  "hoppercollections@spacebring.com",
  "support@deskeo.fr",
  "re@deskeo.fr",
  "audreylm33@gmail.com", // test test
  "etrillarddamien@gmail.com", // Damien test2
  "deleted user",
])

const DRY_RUN = process.argv.includes("--dry-run")

// ── CSV Parsing ─────────────────────────────────────────────────────────────

function parseCSV(content: string): Record<string, string>[] {
  const lines = content.split("\n")
  const headers = parseCSVLine(lines[0])
  const records: Record<string, string>[] = []

  let i = 1
  while (i < lines.length) {
    // Handle multi-line fields (enclosed in quotes)
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
  // Format: "20 janv. 2025" or "1 mars 2025"
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

  // 2. Parse CSV files
  const companiesCSV = readFileSync(
    resolve(__dirname, "../.context/attachments/report-companies.csv"),
    "utf-8"
  )
  const usersCSV = readFileSync(
    resolve(__dirname, "../.context/attachments/report-users (1).csv"),
    "utf-8"
  )

  const companiesData = parseCSV(companiesCSV)
  const usersData = parseCSV(usersCSV)

  console.log(`CSV : ${companiesData.length} entreprises, ${usersData.length} utilisateurs\n`)

  // 3. Filter companies (exclude DESKEO)
  const companiesToImport = companiesData.filter((c) => c.ID !== DESKEO_SPACEBRING_ID)
  console.log(`Entreprises à importer (hors DESKEO) : ${companiesToImport.length}`)

  // 4. Filter users
  const usersToImport = usersData.filter((u) => {
    const companyId = u["Company ID"]
    const email = (u.Email || "").toLowerCase()

    // Exclude users without company
    if (!companyId) return false
    // Exclude DESKEO employees
    if (companyId === DESKEO_SPACEBRING_ID) return false
    // Exclude test/system accounts
    if (EXCLUDED_EMAILS.has(email)) return false
    // Exclude "Deleted User"
    if (u.Name === "Deleted User" || u.Surname === "Deleted User") return false

    return true
  })
  console.log(`Utilisateurs à importer : ${usersToImport.length}\n`)

  // 5. Count users per company to determine company_type
  const userCountByCompany = new Map<string, number>()
  for (const u of usersToImport) {
    const cid = u["Company ID"]
    userCountByCompany.set(cid, (userCountByCompany.get(cid) || 0) + 1)
  }

  // 6. Import companies
  console.log("── Etape 2 : Import des entreprises ──")
  const spacebringToSupabaseCompanyId = new Map<string, string>()
  let companiesCreated = 0
  let companiesSkipped = 0

  for (const c of companiesToImport) {
    const name = c.Title
    if (!name) continue

    // Check if company already exists
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("name", name)
      .maybeSingle()

    if (existing) {
      console.log(`  ⏭️  "${name}" existe déjà (${existing.id})`)
      spacebringToSupabaseCompanyId.set(c.ID, existing.id)
      companiesSkipped++
      continue
    }

    const userCount = userCountByCompany.get(c.ID) || 0
    const companyType = userCount <= 1 ? "self_employed" : "multi_employee"

    const subscriptionPeriod = c["Subscription period"]
      ? c["Subscription period"] === "Week"
        ? "week"
        : "month"
      : null

    const insertData: Record<string, unknown> = {
      name,
      main_site_id: site.id,
      company_type: companyType,
      subscription_period: subscriptionPeriod,
      subscription_start_date: parseFrenchDate(c["Subscription start date"]) || null,
      subscription_end_date: parseFrenchDate(c["Subscription end date"]) || null,
    }

    // Parse billing address
    const billingDetails = c["Billing details"]
    if (billingDetails) {
      insertData.address = billingDetails.replace(/\n/g, ", ")
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Créerait "${name}" (${companyType})`)
      spacebringToSupabaseCompanyId.set(c.ID, `dry-${c.ID}`)
      companiesCreated++
      continue
    }

    const { data: created, error } = await supabase
      .from("companies")
      .insert(insertData)
      .select("id")
      .single()

    if (error) {
      console.error(`  ❌ Erreur pour "${name}": ${error.message}`)
      continue
    }

    console.log(`  ✅ "${name}" créée (${created.id})`)
    spacebringToSupabaseCompanyId.set(c.ID, created.id)
    companiesCreated++
  }

  console.log(`\nEntreprises : ${companiesCreated} créées, ${companiesSkipped} existantes\n`)

  // 7. Import users
  console.log("── Etape 3 : Import des utilisateurs ──")
  let usersCreated = 0
  let usersSkipped = 0
  let authCreated = 0
  let authSkipped = 0

  for (const u of usersToImport) {
    const email = (u.Email || "").toLowerCase().trim()
    if (!email) continue

    const spacebringCompanyId = u["Company ID"]
    const supabaseCompanyId = spacebringToSupabaseCompanyId.get(spacebringCompanyId)

    if (!supabaseCompanyId) {
      console.log(`  ⚠️  Entreprise introuvable pour ${email} (spacebring: ${spacebringCompanyId})`)
      continue
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    if (existingUser) {
      console.log(`  ⏭️  ${email} existe déjà`)
      usersSkipped++
      continue
    }

    const role = u["Company role"] === "Manager" ? "admin" : "user"

    const insertData: Record<string, unknown> = {
      first_name: u.Name || null,
      last_name: u.Surname || null,
      email,
      phone: u["Phone number"] || null,
      company_id: DRY_RUN ? null : supabaseCompanyId,
      role,
      status: "active",
    }

    if (DRY_RUN) {
      console.log(`  [DRY] Créerait ${email} (${role}) → ${u["Company title"]}`)
      usersCreated++
      authCreated++
      continue
    }

    const { error: userError } = await supabase.from("users").insert(insertData)

    if (userError) {
      console.error(`  ❌ Erreur user ${email}: ${userError.message}`)
      continue
    }

    console.log(`  ✅ ${email} (${role}) → ${u["Company title"]}`)
    usersCreated++

    // Create Supabase Auth account
    const { error: authError } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message?.includes("already been registered")) {
        authSkipped++
      } else {
        console.error(`  ⚠️  Auth error for ${email}: ${authError.message}`)
      }
    } else {
      authCreated++
    }
  }

  console.log(`\nUtilisateurs : ${usersCreated} créés, ${usersSkipped} existants`)
  console.log(`Auth : ${authCreated} comptes créés, ${authSkipped} existaient déjà`)
  console.log("\n✅ Import terminé !")
}

main().catch((err) => {
  console.error("Erreur fatale:", err)
  process.exit(1)
})
