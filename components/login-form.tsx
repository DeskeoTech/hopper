"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  checkEmailExists,
  ensureSupabaseAuthUser,
  getPostLoginRedirectUrl,
} from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { Mail, Loader2, CheckCircle, ExternalLink, Lock, ArrowLeft } from "lucide-react"
import { useTranslations } from "next-intl"


function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

interface LoginFormProps {
  initialError?: string
  isApp?: boolean
}

export function LoginForm({ initialError, isApp }: LoginFormProps) {
  if (isApp) {
    return <PasswordLoginForm initialError={initialError} />
  }
  return <MagicLinkLoginForm initialError={initialError} />
}

function PasswordLoginForm({ initialError }: { initialError?: string }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNoAccountModal, setShowNoAccountModal] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const t = useTranslations("login")

  useEffect(() => {
    if (initialError === "no_account") {
      setShowNoAccountModal(true)
    }
  }, [initialError])

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { exists } = await checkEmailExists(email)
    if (!exists) {
      setShowNoAccountModal(true)
      setIsLoading(false)
      return
    }

    await ensureSupabaseAuthUser(email)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setIsLoading(false)

    if (error) {
      setError(t("invalidCredentials"))
      return
    }

    try {
      const { url } = await getPostLoginRedirectUrl()
      window.location.href = url + "?app=yes"
    } catch {
      window.location.href = "/compte?app=yes"
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { exists } = await checkEmailExists(email)
    if (!exists) {
      setShowNoAccountModal(true)
      setIsLoading(false)
      return
    }

    await ensureSupabaseAuthUser(email)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password?app=yes`,
    })

    setIsLoading(false)

    if (error) {
      const match = error.message.match(/request this after (\d+) seconds/)
      if (match) {
        setError(`Pour des raisons de sécurité, veuillez patienter ${match[1]} secondes avant de réessayer.`)
      } else {
        setError(error.message)
      }
    } else {
      setResetSent(true)
    }
  }

  if (resetSent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t("success.mailVerify")}</h2>
          <p className="text-muted-foreground">
            {t("forgotPasswordSuccess")}{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>
        <Button
          variant="ghost"
          onClick={() => {
            setShowForgotPassword(false)
            setResetSent(false)
            setPassword("")
          }}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("backToLogin")}
        </Button>
      </div>
    )
  }

  if (showForgotPassword) {
    return (
      <>
        <form onSubmit={handleForgotPassword} className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {t("forgotPasswordMessage")}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-foreground">
              {t("email")}
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
                {t("loadingSend")}
              </>
            ) : (
              t("sendResetLink")
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
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToLogin")}
          </Button>
        </form>

        <NoAccountModal open={showNoAccountModal} onOpenChange={setShowNoAccountModal} />
      </>
    )
  }

  return (
    <>
      <form onSubmit={handlePasswordLogin} className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("messageApp")}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t("email")}
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-foreground">
              {t("password")}
            </label>
            <button
              type="button"
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setShowForgotPassword(true)
                setError(null)
              }}
            >
              {t("forgotPassword")}
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder={t("passwordPlaceholder")}
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
              {t("loadingConnect")}
            </>
          ) : (
            t("buttonLink")
          )}
        </Button>
      </form>

      <NoAccountModal open={showNoAccountModal} onOpenChange={setShowNoAccountModal} />
    </>
  )
}

function MagicLinkLoginForm({ initialError }: { initialError?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showNoAccountModal, setShowNoAccountModal] = useState(false)
  const t = useTranslations("login")
  const [otpCode, setOtpCode] = useState("")
  const [otpError, setOtpError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (initialError === "no_account") {
      setShowNoAccountModal(true)
    }
  }, [initialError])

  // OTP verification
  const handleVerifyOtp = async (code: string) => {
    if (code.length !== 6) return

    setIsVerifying(true)
    setOtpError(null)

    try {
      const supabase = createClient()

      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "email",
      })

      if (error) {
        setOtpError(t("success.invalidCode"))
        setIsVerifying(false)
        setOtpCode("")
        return
      }

      // OTP verified — determine redirect with server action
      try {
        const { url } = await getPostLoginRedirectUrl()
        window.location.href = url
      } catch {
        // Fallback if server action fails
        window.location.href = "/compte"
      }
    } catch {
      setOtpError(t("success.genericError"))
      setIsVerifying(false)
      setOtpCode("")
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

    // Backfill : s'assurer que le compte Auth existe (pour les users pré-existants)
    await ensureSupabaseAuthUser(email)

    const supabase = createClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setIsLoading(false)

    if (error) {
      const match = error.message.match(/request this after (\d+) seconds/)
      if (match) {
        setError(`Pour des raisons de sécurité, veuillez patienter ${match[1]} secondes avant de réessayer.`)
      } else {
        setError(error.message)
      }
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
          <h2 className="text-xl font-semibold">{t("success.mailVerify")}</h2>
          <p className="text-muted-foreground">
            {t("success.codeSent")}{" "}
            <span className="font-medium text-foreground">{email}</span>
          </p>
        </div>

        {/* OTP Input */}
        <div className="w-full space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("success.enterCode")}
          </p>
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              value={otpCode}
              onChange={(value) => {
                setOtpCode(value)
                setOtpError(null)
              }}
              onComplete={handleVerifyOtp}
              disabled={isVerifying}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>

          {isVerifying && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("success.verifying")}
            </div>
          )}

          {otpError && (
            <p className="text-sm text-destructive">{otpError}</p>
          )}
        </div>

        <div className="w-full border-t pt-4">
          <p className="text-xs text-muted-foreground">
            {t("success.linkAlternative")}
          </p>
        </div>

        <Button
          variant="ghost"
          onClick={() => {
            setIsSuccess(false)
            setEmail("")
            setOtpCode("")
            setOtpError(null)
          }}
        >
          {t("success.otherAdress")}
        </Button>
      </div>
    )
  }

  return (
    <>
      <form onSubmit={handleMagicLinkLogin} className="space-y-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            {t("message")}
          </p>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            {t("email")}
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

        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("loadingSend")}
          </>
        ) : (
          t("buttonLink")
        )}
      </Button>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        {/* Google login button */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleGoogleLogin}
          disabled={isLoading || isGoogleLoading}
        >
          {isGoogleLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("loadingConnect")}
            </>
          ) : (
            <>
              <GoogleIcon className="mr-2 h-4 w-4" />
              {t("logGoogle")}
            </>
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
  const t = useTranslations("login")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center font-header text-xl">
            {t("errors.notFound")}
          </DialogTitle>
          <DialogDescription className="text-center">
            {t("errors.hopperOnly")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-4">
          <p className="text-center text-sm text-muted-foreground">
            {t("errors.noBooking")}
          </p>
          <Button asChild className="w-full">
            <a
              href="https://hopper-coworking.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2"
            >
              {t("discoverHopper")}
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {t("errors.retryAdress")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
