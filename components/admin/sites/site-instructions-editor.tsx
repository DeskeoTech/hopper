"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { updateSiteInstructions } from "@/lib/actions/sites"

interface SiteInstructionsEditorProps {
  siteId: string
  siteName: string
  initialInstructions: string | null
  initialAccess: string | null
}

export function SiteInstructionsEditor({
  siteId,
  siteName,
  initialInstructions,
  initialAccess,
}: SiteInstructionsEditorProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [instructions, setInstructions] = useState(initialInstructions || "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSiteInstructions(siteId, {
      instructions: instructions || null,
      access: initialAccess,
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
      setInstructions(initialInstructions || "")
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
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Instructions — {siteName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`instructions-${siteId}`}>Instructions</Label>
              <Textarea
                id={`instructions-${siteId}`}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={6}
                placeholder="Instructions pour les utilisateurs..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
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
              Voulez-vous vraiment enregistrer ces modifications pour {siteName} ?
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
