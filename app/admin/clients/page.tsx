import { createClient } from "@/lib/supabase/server"
import { CompaniesTable } from "@/components/admin/companies-table"
import { CompanySearch } from "@/components/admin/company-search"
import { Briefcase } from "lucide-react"

interface ClientsPageProps {
  searchParams: Promise<{ search?: string; type?: string }>
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const { search, type } = await searchParams
  const supabase = await createClient()

  // Build query for companies
  let query = supabase.from("companies").select("*").order("name")

  // Apply search filter
  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_email.ilike.%${search}%`)
  }

  // Apply type filter
  if (type && type !== "all") {
    query = query.eq("company_type", type)
  }

  const { data: companies, error } = await query

  // Fetch user counts per company
  const { data: userCounts } = await supabase
    .from("users")
    .select("company_id")

  // Build user count map
  const userCountMap: Record<string, number> = {}
  userCounts?.forEach((user) => {
    if (user.company_id) {
      userCountMap[user.company_id] = (userCountMap[user.company_id] || 0) + 1
    }
  })

  // Fetch site counts per company
  const { data: companySites } = await supabase
    .from("company_sites")
    .select("company_id")

  // Build site count map
  const siteCountMap: Record<string, number> = {}
  companySites?.forEach((cs) => {
    siteCountMap[cs.company_id] = (siteCountMap[cs.company_id] || 0) + 1
  })

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des clients: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="type-h2 text-foreground">Clients</h1>
        <p className="mt-1 text-muted-foreground">Gérez vos entreprises clientes et leurs utilisateurs</p>
      </div>

      {/* Search & Filters */}
      <CompanySearch />

      {/* Results count */}
      {companies && (
        <p className="text-sm text-muted-foreground">
          {companies.length} entreprise{companies.length !== 1 ? "s" : ""} trouvée{companies.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Companies Table */}
      {companies && companies.length > 0 ? (
        <CompaniesTable
          companies={companies.map((company) => ({
            ...company,
            userCount: userCountMap[company.id] || 0,
            siteCount: siteCountMap[company.id] || 0,
          }))}
        />
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12">
          <Briefcase className="mb-4 h-12 w-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {search || type ? "Aucune entreprise ne correspond à vos critères" : "Aucune entreprise trouvée"}
          </p>
        </div>
      )}
    </div>
  )
}
