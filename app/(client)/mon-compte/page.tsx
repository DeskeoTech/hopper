import { createClient, getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MonComptePage } from "@/components/client/mon-compte-page"
import type { ContractForDisplay, PlanRecurrence } from "@/lib/types/database"

export default async function MonComptePageRoute() {
  const authUser = await getUser()
  if (!authUser?.email) {
    redirect("/login")
  }

  const supabase = await createClient()

  const { data: userProfile } = await supabase
    .from("users")
    .select("company_id, role, companies (from_spacebring, spacebring_plan_name, spacebring_seats, spacebring_start_date)")
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    redirect("/login")
  }

  // Fetch all company contracts for admin users (Forfait tab is admin-only)
  let contracts: ContractForDisplay[] = []
  if (userProfile.company_id && userProfile.role === "admin") {
    const { data: contractsData } = await supabase
      .from("contracts")
      .select(`
        id,
        status,
        start_date,
        end_date,
        Number_of_seats,
        plans (name, recurrence)
      `)
      .eq("company_id", userProfile.company_id)
      .order("start_date", { ascending: false })
      .limit(50)

    contracts = (contractsData || []).map((c) => {
      const plan = c.plans as unknown as { name: string; recurrence: PlanRecurrence | null } | null
      return {
        id: c.id,
        status: c.status as "active" | "suspended" | "terminated",
        start_date: c.start_date,
        end_date: c.end_date,
        plan_name: plan?.name || "Pass",
        plan_recurrence: plan?.recurrence || null,
        site_name: null,
        number_of_seats: c.Number_of_seats ? Number(c.Number_of_seats) : null,
      }
    })
  }

  // For Spacebring companies with no contracts, create a synthetic contract
  const company = userProfile.companies as { from_spacebring: boolean | null; spacebring_plan_name: string | null; spacebring_seats: number | null; spacebring_start_date: string | null } | null
  if (contracts.length === 0 && company?.from_spacebring && company.spacebring_plan_name) {
    contracts = [{
      id: "spacebring",
      status: "active",
      start_date: company.spacebring_start_date,
      end_date: null,
      plan_name: company.spacebring_plan_name,
      plan_recurrence: null,
      site_name: null,
      number_of_seats: company.spacebring_seats,
    }]
  }

  return (
    <MonComptePage
      contracts={contracts}
    />
  )
}
