"use client"

import { useState } from "react"
import { Loader2, User, Mail, Phone, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useClientLayout } from "./client-layout-provider"
import { updateUserProfile } from "@/lib/actions/user-company-info"

// Format French phone number: 01 23 45 67 89
function formatFrenchPhone(value: string): string {
  // Remove all non-digit characters
  const digits = value.replace(/\D/g, "")
  // Limit to 10 digits
  const limited = digits.slice(0, 10)
  // Format with spaces every 2 digits
  const parts = []
  for (let i = 0; i < limited.length; i += 2) {
    parts.push(limited.slice(i, i + 2))
  }
  return parts.join(" ")
}

export function MesCoordonneesTab() {
  const { user } = useClientLayout()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [firstName, setFirstName] = useState(user.first_name || "")
  const [lastName, setLastName] = useState(user.last_name || "")
  const [phone, setPhone] = useState(formatFrenchPhone(user.phone || ""))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await updateUserProfile(user.id, {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone.trim(),
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  return (
    <div className="rounded-[16px] bg-card p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
          <User className="h-5 w-5 text-foreground/70" />
        </div>
        <h2 className="font-header text-lg font-bold uppercase tracking-tight">Coordonnées</h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="firstName">Prénom</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Votre prénom"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Nom</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Votre nom"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <div className="flex items-center gap-2 rounded-[12px] bg-foreground/5 px-3 py-2.5">
            <Mail className="h-4 w-4 text-foreground/50" />
            <span className="text-sm text-foreground/70">{user.email}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            L&apos;email ne peut pas être modifié
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Téléphone</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(formatFrenchPhone(e.target.value))}
              placeholder="01 23 45 67 89"
              className="pl-10"
              maxLength={14}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Format : 01 23 45 67 89
          </p>
        </div>

        {error && (
          <div className="rounded-[12px] bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-[12px] bg-green-500/10 p-4 text-green-600">
            <Check className="h-4 w-4" />
            <p className="text-sm font-medium">Informations mises à jour</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-[#1B1918] px-6 py-3 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90 disabled:opacity-50 sm:w-auto"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Enregistrement...
            </span>
          ) : (
            "Enregistrer"
          )}
        </button>
      </form>
    </div>
  )
}
