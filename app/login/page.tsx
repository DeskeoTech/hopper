"use client"

import { useState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInWithMagicLink } from "./actions"

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? "Envoi en cours..." : "Envoyer le lien de connexion"}
    </Button>
  )
}

export default function LoginPage() {
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSubmit(formData: FormData) {
    const result = await signInWithMagicLink(formData)

    if (result.error) {
      setMessage({ type: "error", text: result.error })
    } else {
      setMessage({ type: "success", text: "Un lien de connexion a été envoyé à votre adresse email." })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="type-h2 text-foreground">Hopper</h1>
          <p className="mt-2 type-body text-muted-foreground">
            Connectez-vous à votre espace d&apos;administration
          </p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="type-small font-medium text-foreground">
                Adresse email
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="vous@exemple.com"
                className="mt-1"
              />
            </div>
          </div>

          {message && (
            <div
              className={`rounded-sm border p-4 ${
                message.type === "success"
                  ? "border-green-500/20 bg-green-500/10 text-green-700"
                  : "border-destructive/20 bg-destructive/10 text-destructive"
              }`}
            >
              <p className="type-small">{message.text}</p>
            </div>
          )}

          <SubmitButton />
        </form>
      </div>
    </div>
  )
}
