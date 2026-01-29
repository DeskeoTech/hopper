"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Loader2, CheckCircle, AlertCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Check if the user has a valid password recovery session
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsValidSession(true)
      } else if (event === "SIGNED_IN" && session) {
        // User might already be signed in from the recovery link
        setIsValidSession(true)
      }
    })

    // Also check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsValidSession(true)
      } else {
        // Give a moment for the auth state change to fire
        setTimeout(() => {
          setIsValidSession((prev) => prev === null ? false : prev)
        }, 1000)
      }
    })
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas")
      return
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères")
      return
    }

    setIsLoading(true)

    const supabase = createClient()

    const { error } = await supabase.auth.updateUser({
      password: password,
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setIsSuccess(true)

      // Check user role to redirect appropriately
      const { data: { user } } = await supabase.auth.getUser()
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("email", user?.email)
        .single()

      // Redirect based on role after 2 seconds
      setTimeout(() => {
        if (userData?.role === "user") {
          router.push("/compte")
        } else {
          router.push("/admin")
        }
      }, 2000)
    }
  }

  // Loading state
  if (isValidSession === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-[20px] border bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Vérification en cours...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Invalid or expired link
  if (isValidSession === false) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-[20px] border bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex justify-center">
              <Image
                src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
                alt="Hopper Logo"
                width={200}
                height={80}
                className="h-10 w-auto sm:h-12"
                priority
              />
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <AlertCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Lien invalide ou expiré</h2>
                <p className="text-muted-foreground">
                  Ce lien de réinitialisation n&apos;est plus valide. Veuillez demander un nouveau lien.
                </p>
              </div>
              <Button asChild className="mt-4">
                <Link href="/login">Retour à la connexion</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="rounded-[20px] border bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
            <div className="mb-6 flex justify-center">
              <Image
                src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
                alt="Hopper Logo"
                width={200}
                height={80}
                className="h-10 w-auto sm:h-12"
                priority
              />
            </div>

            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-semibold">Mot de passe modifié</h2>
                <p className="text-muted-foreground">
                  Votre mot de passe a été mis à jour avec succès. Redirection en cours...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="rounded-[20px] border bg-card/95 p-6 shadow-lg backdrop-blur-sm sm:p-8">
          <div className="mb-6 flex justify-center">
            <Image
              src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
              alt="Hopper Logo"
              width={200}
              height={80}
              className="h-10 w-auto sm:h-12"
              priority
            />
          </div>

          <h1 className="mb-6 text-center font-header text-2xl font-semibold text-foreground">
            Nouveau mot de passe
          </h1>

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-foreground">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirm-password" className="text-sm font-medium text-foreground">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Modification en cours...
                </>
              ) : (
                "Modifier le mot de passe"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
