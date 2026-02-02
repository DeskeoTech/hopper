"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { checkEmailExists } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Mail, Loader2, CheckCircle, ExternalLink } from "lucide-react"

interface LoginFormProps {
  initialError?: string
}

export function LoginForm({ initialError }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNoAccountModal, setShowNoAccountModal] = useState(false)

  useEffect(() => {
    if (initialError === "no_account") {
      setShowNoAccountModal(true)
    }
  }, [initialError])

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
            Nous avons envoyé un lien de connexion à <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => {
            setIsSuccess(false)
            setEmail("")
          }}
        >
          Utiliser une autre adresse
        </Button>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleMagicLinkLogin} className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            Entrez votre adresse email pour recevoir un lien de connexion.
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
            "RECEVOIR LE LIEN DE CONNEXION"
          )}
        </Button>
      </form>

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
