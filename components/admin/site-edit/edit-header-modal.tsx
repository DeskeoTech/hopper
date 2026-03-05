"use client"

import { useState } from "react"
import { Pencil, Building2, DoorOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
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
import { updateSiteHeader } from "@/lib/actions/sites"
import type { SiteStatus } from "@/lib/types/database"

interface EditHeaderModalProps {
  siteId: string
  initialName: string
  initialStatus: SiteStatus
  initialAddress: string
  initialIsCoworking: boolean
  initialIsMeetingRoom: boolean
}

export function EditHeaderModal({
  siteId,
  initialName,
  initialStatus,
  initialAddress,
  initialIsCoworking,
  initialIsMeetingRoom,
}: EditHeaderModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState(initialName)
  const [status, setStatus] = useState<SiteStatus>(initialStatus)
  const [address, setAddress] = useState(initialAddress)
  const [isCoworking, setIsCoworking] = useState(initialIsCoworking)
  const [isMeetingRoom, setIsMeetingRoom] = useState(initialIsMeetingRoom)

  const categoryError = status === "open" && !isCoworking && !isMeetingRoom
  const isFormValid = name.trim() && address.trim() && !categoryError

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSiteHeader(siteId, {
      name,
      status,
      address,
      is_coworking: isCoworking,
      is_meeting_room: isMeetingRoom,
    })
    setLoading(false)
    if (result.success) {
      setOpen(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les informations du site</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom du site</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>

            {/* Status toggle */}
            <div className="flex items-center gap-3 rounded-lg border p-4">
              <Switch
                id="status-switch"
                checked={status === "open"}
                onCheckedChange={(checked) => setStatus(checked ? "open" : "closed")}
              />
              <div className="space-y-0.5">
                <Label htmlFor="status-switch" className="cursor-pointer font-medium">
                  {status === "open" ? "Ouvert" : "Fermé"}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {status === "open"
                    ? "Le site est visible et accessible aux clients"
                    : "Le site est masqué et inaccessible aux clients"}
                </p>
              </div>
            </div>

            {/* Category checkboxes - only when open */}
            {status === "open" && (
              <div className="space-y-3 rounded-lg border p-4">
                <Label className="text-sm font-medium">Catégories du site</Label>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="is_coworking"
                      checked={isCoworking}
                      onCheckedChange={(checked) => setIsCoworking(!!checked)}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="is_coworking" className="flex cursor-pointer items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Hopper Coworking
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ce site apparaît dans les espaces de coworking et la liste &quot;Tous les hopper&quot;
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Checkbox
                      id="is_meeting_room"
                      checked={isMeetingRoom}
                      onCheckedChange={(checked) => setIsMeetingRoom(!!checked)}
                      className="mt-0.5"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="is_meeting_room" className="flex cursor-pointer items-center gap-2">
                        <DoorOpen className="h-4 w-4 text-muted-foreground" />
                        Salle de réunion
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ce site apparaît dans la sélection des salles de réunion
                      </p>
                    </div>
                  </div>
                </div>
                {categoryError && (
                  <p className="text-sm text-destructive">
                    Au moins une catégorie doit être sélectionnée pour un site ouvert
                  </p>
                )}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !isFormValid}>
                {loading ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment enregistrer ces modifications ?
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
