import { redirect } from "next/navigation"
import { createClient, getUser } from "@/lib/supabase/server"

export default async function HomePage() {
  const user = await getUser()

  if (user?.email) {
    const supabase = await createClient()
    const { data: userData } = await supabase
      .from("users")
      .select("is_hopper_admin")
      .eq("email", user.email)
      .limit(1)
      .maybeSingle()

    if (userData?.is_hopper_admin) {
      redirect("/admin")
    }
  }

  redirect("/compte")
}
