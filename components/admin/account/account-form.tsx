"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Loader2, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateAdminFirstName } from "@/lib/actions/account"

interface AccountFormProps {
  firstName: string | null
  email: string | null
}

export function AccountForm({ firstName, email }: AccountFormProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [value, setValue] = useState(firstName ?? "")
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    setMessage(null)

    const result = await updateAdminFirstName(value)

    if (result.success) {
      setMessage({ type: "success", text: "Prénom mis à jour" })
      setIsEditing(false)
      router.refresh()
    } else {
      setMessage({ type: "error", text: result.error ?? "Erreur inconnue" })
    }

    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="firstName" className="text-sm font-medium text-muted-foreground">
          Prénom
        </Label>
        {isEditing ? (
          <div className="mt-1.5 flex items-center gap-2">
            <Input
              id="firstName"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Votre prénom"
              className="max-w-xs"
              autoFocus
            />
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setIsEditing(false)
                setValue(firstName ?? "")
              }}
            >
              Annuler
            </Button>
          </div>
        ) : (
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
        )}
      </div>

      <div>
        <Label className="text-sm font-medium text-muted-foreground">Email</Label>
        <p className="mt-1.5 text-sm">{email || "—"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          L&apos;adresse email ne peut pas être modifiée.
        </p>
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
