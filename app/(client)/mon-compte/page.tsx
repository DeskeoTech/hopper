import { createClient, getUser } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { MonComptePage } from "@/components/client/mon-compte-page"
import { getCompanyContractHistory, type ContractHistoryItem } from "@/lib/actions/contracts"

export default async function MonComptePageRoute() {
  const authUser = await getUser()
  if (!authUser?.email) {
    redirect("/login")
  }

  const supabase = await createClient()

  // Fetch user profile
  const { data: userProfile } = await supabase
    .from("users")
    .select(`
      *,
      companies (*)
    `)
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    redirect("/login")
  }

  // Fetch contract history if company exists
  let contractHistory: ContractHistoryItem[] | null = null
  if (userProfile.company_id) {
    const result = await getCompanyContractHistory(userProfile.company_id)
    contractHistory = result.data
  }

  return (
    <MonComptePage
      initialContractHistory={contractHistory}
    />
  )
}
