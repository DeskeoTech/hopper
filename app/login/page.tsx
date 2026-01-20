import { LoginForm } from "@/components/login-form"
import { UserBar } from "@/components/user-bar"
import { getUser } from "@/lib/supabase/server"
import { AlertCircle } from "lucide-react"

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const user = await getUser()
  const { error } = await searchParams

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <UserBar userEmail={user?.email} />
      <main className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h1 className="type-h2 text-foreground">Hopper</h1>
            <p className="mt-2 type-body text-muted-foreground">
              Connectez-vous à votre espace d&apos;administration
            </p>
          </div>

          {error === "no_account" && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <p className="type-body-sm">
                Seuls les clients Hopper peuvent accéder à cet espace.
              </p>
            </div>
          )}

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <LoginForm />
          </div>
        </div>
      </main>

      <p className="fixed bottom-4 right-4 text-xs text-muted-foreground">v0.1.0</p>
    </div>
  )
}
