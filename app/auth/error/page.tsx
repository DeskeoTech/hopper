import Link from "next/link"
import { Button } from "@/components/ui/button"
import { UserBar } from "@/components/user-bar"
import { getUser } from "@/lib/supabase/server"

export default async function AuthErrorPage() {
  const user = await getUser()

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserBar userEmail={user?.email} />
      <div className="flex flex-1 items-center justify-center">
        <div className="w-full max-w-md space-y-8 px-4 text-center">
          <div>
            <h1 className="type-h2 text-foreground">Erreur d&apos;authentification</h1>
            <p className="mt-4 type-body text-muted-foreground">
              Le lien de connexion est invalide ou a expiré.
            </p>
          </div>

          <Button asChild>
            <Link href="/login">Retourner à la page de connexion</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
