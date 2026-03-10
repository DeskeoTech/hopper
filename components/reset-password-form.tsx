"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Lock, Loader2, CheckCircle } from "lucide-react"
import { useTranslations } from "next-intl"

interface ResetPasswordFormProps {
  isApp?: boolean
  code?: string
}

export function ResetPasswordForm({ isApp, code }: ResetPasswordFormProps) {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isExchanging, setIsExchanging] = useState(!!code)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const exchangeAttempted = useRef(false)
  const t = useTranslations("resetPassword")

  // Exchange the code for a session client-side (cookies are written properly here)
  useEffect(() => {
    if (!code) {
      setIsExchanging(false)
      return
    }

    // Prevent double execution (React Strict Mode calls effects twice)
    if (exchangeAttempted.current) return
    exchangeAttempted.current = true

    const exchange = async () => {
      const supabase = createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("Code exchange failed:", error.message)
        setError(t("error"))
        setIsExchanging(false)
        return
      }

      setSessionReady(true)
      setIsExchanging(false)
    }

    exchange()
  }, [code, t])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError(t("passwordTooShort"))
      return
    }

    if (password !== confirmPassword) {
      setError(t("passwordMismatch"))
      return
    }

    setIsLoading(true)

    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    setIsLoading(false)

    if (updateError) {
      setError(t("error"))
      return
    }

    // Sign out so the user must log in with the new password
    await supabase.auth.signOut()

    setIsSuccess(true)

    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = isApp ? "/login?app=yes" : "/login"
    }, 2000)
  }

  if (isExchanging) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <CheckCircle className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">{t("success")}</h2>
          <p className="text-sm text-muted-foreground">{t("redirecting")}</p>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleResetPassword} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("message")}
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="new-password" className="text-sm font-medium text-foreground">
          {t("newPassword")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="new-password"
            type="password"
            placeholder={t("newPasswordPlaceholder")}
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
          {t("confirmPassword")}
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirm-password"
            type="password"
            placeholder={t("confirmPasswordPlaceholder")}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="pl-10"
            required
            minLength={6}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={isLoading || !sessionReady}>
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("updating")}
          </>
        ) : (
          t("submit")
        )}
      </Button>
    </form>
  )
}
