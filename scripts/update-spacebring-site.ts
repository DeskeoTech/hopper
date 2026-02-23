import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

async function main() {
  // Find SAINTE ANNE site
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name")
    .ilike("name", "%sainte%anne%")

  if (!sites || sites.length === 0) {
    const { data: allSites } = await supabase.from("sites").select("id, name")
    console.log("Site SAINTE ANNE introuvable. Sites disponibles:", allSites)
    process.exit(1)
  }

  const site = sites[0]
  console.log(`Site trouvé : "${site.name}" (${site.id})`)

  // Update the 5 imported companies
  const companyNames = ["GEO VELO", "INDY PARIS", "KPLER", "BGP ESCAPE", "LB superfoods"]
  const { data: companies } = await supabase
    .from("companies")
    .select("id, name, main_site_id")
    .in("name", companyNames)

  if (!companies || companies.length === 0) {
    console.error("Aucune company trouvée")
    process.exit(1)
  }

  console.log(`\n${companies.length} companies à mettre à jour:\n`)

  for (const c of companies) {
    const { error } = await supabase
      .from("companies")
      .update({ main_site_id: site.id })
      .eq("id", c.id)

    if (error) {
      console.error(`  ❌ ${c.name}: ${error.message}`)
    } else {
      console.log(`  ✅ ${c.name} → main_site_id = ${site.id}`)
    }
  }

  console.log("\n✅ Terminé")
}

main().catch((err) => {
  console.error("Erreur:", err)
  process.exit(1)
})
