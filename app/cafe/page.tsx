import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getAdminProfile } from "@/lib/supabase/server"
import { getCafeBeverages, getCafePlanNames, getCafeDashboardData } from "@/lib/actions/cafe"
import { CafeScannerTab } from "@/components/admin/cafe/cafe-scanner-tab"
import { CafeBeveragesTab } from "@/components/admin/cafe/cafe-beverages-tab"
import { CafePlansTab } from "@/components/admin/cafe/cafe-plans-tab"
import { CafeDashboardTab } from "@/components/admin/cafe/cafe-dashboard-tab"
import { redirect } from "next/navigation"

export default async function CafePage() {
  const [adminProfile, beveragesResult, planNames, dashboardResult] = await Promise.all([
    getAdminProfile(),
    getCafeBeverages(),
    getCafePlanNames(),
    getCafeDashboardData(30),
  ])

  if (!adminProfile) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="scanner">
        <TabsList>
          <TabsTrigger value="scanner">Scanner</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="forfaits">Forfaits</TabsTrigger>
          <TabsTrigger value="consommables">Consommables</TabsTrigger>
        </TabsList>

        <TabsContent value="scanner" className="mt-6">
          <CafeScannerTab adminId={adminProfile.id} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <CafeDashboardTab data={dashboardResult.data} />
        </TabsContent>

        <TabsContent value="forfaits" className="mt-6">
          <CafePlansTab />
        </TabsContent>

        <TabsContent value="consommables" className="mt-6">
          <CafeBeveragesTab
            initialBeverages={beveragesResult.data}
            allPlanNames={planNames}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
