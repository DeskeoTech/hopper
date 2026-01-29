"use client"

import { useState } from "react"
import { Loader2, User, Mail, Phone, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="rounded-[16px] bg-card p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <User className="h-5 w-5 text-foreground/50" />
        <h2 className="text-lg font-semibold">Coordonnées</h2>
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
          <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{user.email}</span>
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
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-green-700">
            <Check className="h-4 w-4" />
            <p className="text-sm">Informations mises à jour</p>
          </div>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enregistrement...
            </>
          ) : (
            "Enregistrer les modifications"
          )}
        </Button>
      </form>
    </div>
  )
}
