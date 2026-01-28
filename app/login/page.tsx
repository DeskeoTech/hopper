import Image from "next/image"
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
          <div className="flex flex-col items-center text-center">
            <Image
              src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
              alt="Hopper Logo"
              width={200}
              height={80}
              className="h-12 w-auto"
              priority
            />
            <p className="mt-4 type-body text-muted-foreground">
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
