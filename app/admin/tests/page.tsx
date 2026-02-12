import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { StripeTestForm } from "@/components/admin/tests/stripe-test-form"
import { Loader2 } from "lucide-react"

export default async function TestsStripePage() {
  const supabase = await createClient()
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, address")
    .eq("status", "open")
    .order("name")

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <StripeTestForm sites={sites || []} />
    </Suspense>
  )
}
