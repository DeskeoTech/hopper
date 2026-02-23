"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateAdminProfile } from "@/lib/actions/account"

interface AccountFormProps {
  firstName: string | null
  lastName: string | null
  email: string | null
  role: string | null
  status: string | null
  isHopperAdmin: boolean
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  user: "Utilisateur",
}

const statusLabels: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
}

export function AccountForm({ firstName, lastName, email, role, status, isHopperAdmin }: AccountFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [firstNameValue, setFirstNameValue] = useState(firstName ?? "")
  const [lastNameValue, setLastNameValue] = useState(lastName ?? "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const result = await updateAdminProfile({
      first_name: firstNameValue,
      last_name: lastNameValue,
    })

    if (result.success) {
      setMessage({ type: "success", text: "Profil mis à jour" })
      setIsEditing(false)
      router.refresh()
    } else {
      setMessage({ type: "error", text: result.error ?? "Erreur inconnue" })
    }

    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  function handleCancel() {
    setIsEditing(false)
    setFirstNameValue(firstName ?? "")
    setLastNameValue(lastName ?? "")
  }

  const displayStatus = isHopperAdmin ? "Super Admin" : roleLabels[role ?? ""] ?? role ?? "—"

  return (
    <div className="space-y-4">
      {isEditing ? (
        <div className="space-y-3">
          <div>
            <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">
              Prénom
            </Label>
            <Input
              id="firstName"
              value={firstNameValue}
              onChange={(e) => setFirstNameValue(e.target.value)}
              placeholder="Votre prénom"
              className="mt-1.5 max-w-xs"
              autoFocus
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm font-medium text-muted-foreground">
              Nom
            </Label>
            <Input
              id="lastName"
              value={lastNameValue}
              onChange={(e) => setLastNameValue(e.target.value)}
              placeholder="Votre nom"
              className="mt-1.5 max-w-xs"
            />
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
              Enregistrer
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel}>
              Annuler
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Prénom</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-sm">{firstName || "Non renseigné"}</p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Nom</Label>
            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-sm">{lastName || "Non renseigné"}</p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Pencil className="size-3.5" />
              </button>
            </div>
          </div>
        </>
      )}

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
        <p className="mt-1.5 text-sm">{email || "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          L&apos;adresse email ne peut pas être modifiée.
        </p>
      </div>

      <div className="flex gap-6">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Rôle</Label>
          <p className="mt-1.5 text-sm">{displayStatus}</p>
        </div>
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Statut</Label>
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={`inline-block size-2 rounded-full ${status === "active" ? "bg-green-500" : "bg-red-500"}`}
            />
            <p className="text-sm">{statusLabels[status ?? ""] ?? status ?? "—"}</p>
          </div>
        </div>
      </div>

      {message && (
        <p
          className={`text-sm ${message.type === "success" ? "text-green-600" : "text-destructive"}`}
        >
          {message.text}
        </p>
      )}
    </div>
  )
}
