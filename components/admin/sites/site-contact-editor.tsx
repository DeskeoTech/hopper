"use client"

import { useState } from "react"
import { UserPen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateSiteContact } from "@/lib/actions/sites"

export interface DeskeoUser {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  phone: string | null
}

interface SiteContactEditorProps {
  siteId: string
  siteName: string
  currentContactEmail: string | null
  deskeoUsers: DeskeoUser[]
}

export function SiteContactEditor({
  siteId,
  siteName,
  currentContactEmail,
  deskeoUsers,
}: SiteContactEditorProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState("")

  const userOptions = deskeoUsers.map((user) => ({
    value: user.id,
    label: `${user.first_name || ""} ${user.last_name || ""} (${user.email})`.trim(),
  }))

  const selectedUser = deskeoUsers.find((u) => u.id === selectedUserId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    if (!selectedUser) return
    setLoading(true)
    const result = await updateSiteContact(siteId, {
      contact_first_name: selectedUser.first_name,
      contact_last_name: selectedUser.last_name,
      contact_email: selectedUser.email,
      contact_phone: selectedUser.phone,
    })
    setLoading(false)
    if (result.success) {
      setConfirmOpen(false)
      setOpen(false)
    } else if (result.error) {
      setConfirmOpen(false)
      console.error("Erreur lors de la mise à jour:", result.error)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (newOpen) {
      // Pre-select the current contact if they exist in the list
      const current = deskeoUsers.find((u) => u.email === currentContactEmail)
      setSelectedUserId(current?.id || "")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => e.preventDefault()}
          >
            <UserPen className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Contact — {siteName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Sélectionner un contact Deskeo</Label>
              <SearchableSelect
                options={userOptions}
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder="Choisir un contact..."
                searchPlaceholder="Rechercher par nom ou email..."
                emptyMessage="Aucun utilisateur @deskeo.fr trouvé"
                triggerClassName="w-full"
              />
            </div>

            {selectedUser && (
              <div className="rounded-lg border p-3 space-y-1 text-sm">
                <p className="font-medium">
                  {selectedUser.first_name} {selectedUser.last_name}
                </p>
                <p className="text-muted-foreground">{selectedUser.email}</p>
                {selectedUser.phone && (
                  <p className="text-muted-foreground">{selectedUser.phone}</p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !selectedUserId}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer le contact</AlertDialogTitle>
            <AlertDialogDescription>
              Assigner {selectedUser?.first_name} {selectedUser?.last_name} comme contact de {siteName} ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Enregistrement..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
