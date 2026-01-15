import { LoginForm } from "@/components/login-form"
import { UrlVersionFooter } from "@/components/url-version-footer"
import { UserBar } from "@/components/user-bar"
import { getUser } from "@/lib/supabase/server"

export default async function LoginPage() {
  const user = await getUser()

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

          <div className="rounded-lg border bg-card p-6 shadow-sm">
            <LoginForm />
          </div>
        </div>

        <UrlVersionFooter />
      </main>
    </div>
  )
}
