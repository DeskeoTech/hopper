import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
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
  )
}
