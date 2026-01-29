"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { checkEmailExists } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail, Loader2, CheckCircle, Lock, ExternalLink } from "lucide-react"

interface LoginFormProps {
  initialError?: string
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [successType, setSuccessType] = useState<"magic_link" | "reset_password">("magic_link")
  const [error, setError] = useState<string | null>(null)
  const [showNoAccountModal, setShowNoAccountModal] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  useEffect(() => {
    if (initialError === "no_account") {
      setShowNoAccountModal(true)
    }
  }, [initialError])

  // Password login
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      if (error.message === "Invalid login credentials") {
        setError("Email ou mot de passe incorrect")
      } else {
        setError(error.message)
      }
      setIsLoading(false)
    } else {
      // Check user role to redirect appropriately
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("email", data.user?.email)
        .single()

      if (userData?.role === "user") {
        window.location.href = "/compte"
      } else {
        window.location.href = "/admin"
      }
    }
  }

  // Magic link login
  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    // Check if email exists in users table before sending magic link
    const { exists } = await checkEmailExists(email)
    if (!exists) {
      setShowNoAccountModal(true)
      setIsLoading(false)
      return
    }

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccessType("magic_link")
      setIsSuccess(true)
    }
  }

  // Google OAuth login
  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setIsGoogleLoading(false)
    }
  }

  // Forgot password
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login/reset-password`,
    })

    setIsLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSuccessType("reset_password")
      setIsSuccess(true)
    }
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Vérifiez votre boîte mail</h2>
          <p className="text-muted-foreground">
            {successType === "magic_link" ? (
              <>Nous avons envoyé un lien de connexion à <span className="font-medium text-foreground">{email}</span></>
            ) : (
              <>Nous avons envoyé un lien de réinitialisation à <span className="font-medium text-foreground">{email}</span></>
            )}
          </p>
        </div>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => {
            setIsSuccess(false)
            setEmail("")
            setShowForgotPassword(false)
          }}
        >
          Utiliser une autre adresse
        </Button>
      </div>
    )
  }

  // Forgot password form
  if (showForgotPassword) {
    return (
      <>
        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              Adresse email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              "Envoyer le lien de réinitialisation"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setShowForgotPassword(false)
              setError(null)
            }}
          >
            Retour à la connexion
          </Button>
        </form>

        <NoAccountModal open={showNoAccountModal} onOpenChange={setShowNoAccountModal} />
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Mot de passe</TabsTrigger>
            <TabsTrigger value="magic_link">Lien magique</TabsTrigger>
          </TabsList>

          {/* Password login tab */}
          <TabsContent value="password" className="mt-4">
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email-password" className="text-sm font-medium text-foreground">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email-password"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-foreground">
                    Mot de passe
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
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
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connexion en cours...
                  </>
                ) : (
                  "Se connecter"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Magic link tab */}
          <TabsContent value="magic_link" className="mt-4">
            <form onSubmit={handleMagicLinkLogin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="email-magic" className="text-sm font-medium text-foreground">
                  Adresse email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email-magic"
                    type="email"
                    placeholder="vous@exemple.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  "Envoyer le lien magique"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Ou continuer avec</span>
          </div>
        </div>

        {/* Google login button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          )}
          Google
        </Button>
      </div>

      <NoAccountModal open={showNoAccountModal} onOpenChange={setShowNoAccountModal} />
    </>
  )
}

function NoAccountModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-header text-xl">
            Aucun compte trouvé
          </DialogTitle>
          <DialogDescription className="text-center">
            Seuls les clients Hopper peuvent accéder à cet espace.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de réservation ?
          </p>
          <Button asChild className="w-full">
            <a
              href="https://hopper-coworking.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2"
            >
              Découvrez l&apos;expérience Hopper
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Réessayer avec une autre adresse
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
