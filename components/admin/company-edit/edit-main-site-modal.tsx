"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { updateCompanyMainSite } from "@/lib/actions/companies"

interface Site {
  id: string
  name: string
}

interface EditMainSiteModalProps {
  companyId: string
  initialSiteId: string | null
  sites: Site[]
}

export function EditMainSiteModal({
  companyId,
  initialSiteId,
  sites,
}: EditMainSiteModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedSiteId, setSelectedSiteId] = useState(initialSiteId || "none")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateCompanyMainSite(
      companyId,
      selectedSiteId === "none" ? null : selectedSiteId
    )
    setLoading(false)
    if (result.success) {
      setOpen(false)
      setConfirmOpen(false)
    }
  }

  const siteOptions = [
    { value: "none", label: "Aucun site" },
    ...sites.map((site) => ({ value: site.id, label: site.name })),
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="absolute top-4 right-4">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le site principal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Site principal</Label>
              <SearchableSelect
                options={siteOptions}
                value={selectedSiteId}
                onValueChange={setSelectedSiteId}
                placeholder="Sélectionner un site"
                searchPlaceholder="Rechercher un site..."
                emptyMessage="Aucun site trouvé"
                triggerClassName="w-full"
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
            <AlertDialogTitle>Confirmer la modification</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment modifier le site principal de cette entreprise ?
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
