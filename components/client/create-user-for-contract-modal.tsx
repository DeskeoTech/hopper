"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { createUserForContract } from "@/lib/actions/contracts"
import { useClientLayout } from "./client-layout-provider"

interface CreateUserForContractModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId: string
  companyId: string
  onUserCreated: () => void
}

export function CreateUserForContractModal({
  open,
  onOpenChange,
  contractId,
  companyId,
  onUserCreated,
}: CreateUserForContractModalProps) {
  const { isDeskeoEmployee, plan } = useClientLayout()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check if expired contract banner is visible
  const showBanner = !isDeskeoEmployee && !plan

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setError("Tous les champs sont obligatoires")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Adresse email invalide")
      return
    }

    setLoading(true)
    const result = await createUserForContract(companyId, contractId, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      email: email.trim().toLowerCase(),
    })
    setLoading(false)

    if (result.success) {
      // Reset form and close
      setFirstName("")
      setLastName("")
      setEmail("")
      onOpenChange(false)
      onUserCreated()
    } else {
      setError(result.error || "Une erreur est survenue")
    }
  }

  const handleClose = () => {
    setFirstName("")
    setLastName("")
    setEmail("")
    setError(null)
    onOpenChange(false)
  }

  if (!open) {
    return null
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50"
        onClick={handleClose}
      />

      <div
        className={cn(
          "fixed z-[60] bg-background",
          // Mobile: full screen
          "inset-0",
          showBanner && "top-[56px] sm:top-[58px]",
          // Desktop: centered modal
          "md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-full md:max-w-md md:rounded-[20px]"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-4 md:rounded-t-[20px]">
          <h1 className="font-header text-xl font-bold uppercase tracking-tight">
            Créer un utilisateur
          </h1>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className={cn(
            "overflow-y-auto overscroll-contain p-4 space-y-4",
            // Mobile heights
            showBanner
              ? "h-[calc(100vh-57px-56px)] sm:h-[calc(100vh-57px-58px)]"
              : "h-[calc(100vh-57px)]",
            // Desktop: auto height within max-height
            "md:h-auto md:max-h-[calc(85vh-64px)]"
          )}
        >
          {/* Error message */}
          {error && (
            <div className="rounded-[12px] bg-red-500/10 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* First name */}
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="text-xs font-medium text-foreground/50 uppercase"
            >
              Prénom *
            </label>
            <input
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-[12px] bg-card p-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Entrez le prénom"
              required
            />
          </div>

          {/* Last name */}
          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="text-xs font-medium text-foreground/50 uppercase"
            >
              Nom *
            </label>
            <input
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-[12px] bg-card p-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="Entrez le nom"
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-xs font-medium text-foreground/50 uppercase"
            >
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-[12px] bg-card p-3 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              placeholder="exemple@email.com"
              required
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-foreground py-3 text-sm font-semibold uppercase text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin" />
            ) : (
              "Créer l'utilisateur"
            )}
          </button>

          <p className="text-xs text-center text-foreground/50">
            L'utilisateur sera automatiquement assigné à ce pass.
          </p>
        </form>
      </div>
    </>
  )
}
