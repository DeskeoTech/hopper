import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"
import { EntreprisePage } from "@/components/client/entreprise-page"
import type { User, Company, ContractStatus, PlanRecurrence } from "@/lib/types/database"

export interface ContractWithSeats {
  id: string
  status: ContractStatus
  start_date: string | null
  end_date: string | null
  plan_name: string
  plan_recurrence: PlanRecurrence | null
  total_seats: number
  assigned_seats: number
}

export interface UserWithContract extends User {
  contract_name: string | null
}

export interface CompanyCreditTransaction {
  id: string
  type: string
  amount: number
  balance_after: number
  reason: string | null
  date: string
  userName: string | null
}

export default async function EntreprisePageRoute() {
  const authUser = await getUser()

  if (!authUser?.email) {
    redirect("/login?error=not_connected")
  }

  const supabase = await createClient()

  // Fetch user profile with company
  const { data: userProfile } = await supabase
    .from("users")
    .select("*, companies (*)")
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    redirect("/login?error=not_connected")
  }

  // Check if user can manage company (admin with a company)
  const company = userProfile.companies as Company | null
  const canManageCompany = userProfile.role === "admin" && company !== null

  if (!canManageCompany || !userProfile.company_id) {
    redirect("/compte")
  }

  // Fetch company contracts with plans
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
    .eq("status", "active")
    .order("start_date", { ascending: false })

  // Fetch company users with their assigned contracts
  const { data: usersData } = await supabase
    .from("users")
    .select(`
      *,
      contracts:contract_id (
        id,
        plans (name)
      )
    `)
    .eq("company_id", userProfile.company_id)
    .order("last_name", { ascending: true })

  // Count users per contract
  const contractUserCounts: Record<string, number> = {}
  for (const user of usersData || []) {
    if (user.contract_id && user.status === "active") {
      contractUserCounts[user.contract_id] = (contractUserCounts[user.contract_id] || 0) + 1
    }
  }

  // Transform contracts
  const contracts: ContractWithSeats[] = (contractsData || []).map((c) => {
    const plan = c.plans as { name: string; recurrence: PlanRecurrence | null } | null
    const totalSeats = c.Number_of_seats ? Number(c.Number_of_seats) : 0
    const assignedSeats = contractUserCounts[c.id] || 0

    return {
      id: c.id,
      status: c.status as ContractStatus,
      start_date: c.start_date,
      end_date: c.end_date,
      plan_name: plan?.name || "Contrat",
      plan_recurrence: plan?.recurrence || null,
      total_seats: totalSeats,
      assigned_seats: assignedSeats,
    }
  })

  // Transform users
  const users: UserWithContract[] = (usersData || []).map((u) => {
    const contract = u.contracts as { id: string; plans: { name: string } | null } | null
    return {
      ...u,
      contract_name: contract?.plans?.name || null,
    }
  })

  // Calculate spacebring seats for off-platform companies
  const spacebringSeats = company?.from_spacebring && company.spacebring_seats
    ? company.spacebring_seats
    : 0

  // Fetch company credit balance
  const { data: creditBalance } = await supabase
    .rpc("get_company_valid_credits", { p_company_id: userProfile.company_id })

  // Fetch company credit transactions
  const { data: creditTransactions } = await supabase
    .from("credit_transactions")
    .select("id, transaction_type, amount, balance_before, balance_after, reason, created_at, user_id, users:user_id(first_name, last_name)")
    .eq("company_id", userProfile.company_id)
    .order("created_at", { ascending: false })
    .limit(50)

  const companyCredits = (creditTransactions || []).map((tx) => {
    const user = tx.users as { first_name: string | null; last_name: string | null } | null
    const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || null
    return {
      id: tx.id as string,
      type: tx.transaction_type as string,
      amount: tx.amount as number,
      balance_after: tx.balance_after as number,
      reason: tx.reason as string | null,
      date: tx.created_at as string,
      userName,
    }
  })

  return (
    <EntreprisePage
      company={company!}
      contracts={contracts}
      users={users}
      currentUserId={userProfile.id}
      spacebringSeats={spacebringSeats}
      creditTransactions={companyCredits}
      creditBalance={creditBalance ?? 0}
    />
  )
}
