import Link from "next/link"
import { FileQuestion } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserBar } from "@/components/user-bar"
import { getUser } from "@/lib/supabase/server"

export default async function NotFound() {
  const user = await getUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserBar userEmail={user?.email} />
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-sm bg-muted border border-border">
          <FileQuestion className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="mt-4 type-h3 text-foreground">Page non trouvée</h2>
        <p className="mt-2 text-muted-foreground">
          La page que vous recherchez n&apos;existe pas.
        </p>
        <Button asChild className="mt-6">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>
    </div>
  )
}
