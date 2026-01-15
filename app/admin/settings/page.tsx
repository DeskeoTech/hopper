import { createClient } from "@/lib/supabase/server"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlansTab } from "@/components/admin/settings/plans-tab"
import { Settings } from "lucide-react"
import type { Plan, Site, PlanSite } from "@/lib/types/database"

export default async function SettingsPage() {
  const supabase = await createClient()

  // Fetch plans
  const { data: plans, error: plansError } = await supabase
    .from("plans")
    .select("*")
    .order("name")

  // Fetch sites
  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("*")
    .order("name")

  // Fetch plan-site associations
  const { data: planSites, error: planSitesError } = await supabase
    .from("plan_sites")
    .select("*")

  const error = plansError || sitesError || planSitesError

  if (error) {
    return (
      <div className="flex items-center justify-center p-12">
        <p className="text-destructive">Erreur lors du chargement des données: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="type-h2 text-foreground">Paramètres</h1>
        <p className="mt-1 text-muted-foreground">Gérez la configuration de votre espace Hopper</p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="plans" className="w-full">
        <TabsList>
          <TabsTrigger value="plans">Forfaits</TabsTrigger>
          <TabsTrigger value="general">Général</TabsTrigger>
        </TabsList>
        <TabsContent value="plans" className="mt-6">
          <PlansTab
            plans={(plans || []) as Plan[]}
            sites={(sites || []) as Site[]}
            planSites={(planSites || []) as PlanSite[]}
          />
        </TabsContent>
        <TabsContent value="general" className="mt-6">
          <div className="flex flex-col items-center justify-center rounded-lg bg-card p-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted border border-border mb-4">
              <Settings className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">Prochainement disponible</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
