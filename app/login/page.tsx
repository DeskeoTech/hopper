import { LoginForm } from "@/components/login-form"

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
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
    </main>
  )
}
