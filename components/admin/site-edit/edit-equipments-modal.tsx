"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import { updateSiteEquipments } from "@/lib/actions/sites"
import type { Equipment } from "@/lib/types/database"

const EQUIPMENT_OPTIONS: { id: Equipment; label: string }[] = [
  { id: "barista", label: "Barista" },
  { id: "stationnement_velo", label: "Parking vélos" },
  { id: "impression", label: "Impression" },
  { id: "douches", label: "Douches" },
  { id: "salle_sport", label: "Salle de sport" },
  { id: "terrasse", label: "Terrasse" },
  { id: "rooftop", label: "Rooftop" },
  { id: "cafe", label: "Café" },
  { id: "phonebooth", label: "Phonebooth" },
  { id: "fontaine_eau", label: "Fontaine à eau" },
  { id: "micro_ondes", label: "Micro-ondes" },
  { id: "restauration", label: "Restauration" },
  { id: "wifi", label: "Wifi" },
]

interface EditEquipmentsModalProps {
  siteId: string
  initialEquipments: Equipment[] | null
}

export function EditEquipmentsModal({
  siteId,
  initialEquipments,
}: EditEquipmentsModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments || [])

  const toggleEquipment = (equipment: Equipment) => {
    setEquipments((prev) =>
      prev.includes(equipment)
        ? prev.filter((e) => e !== equipment)
        : [...prev, equipment]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSiteEquipments(siteId, {
      equipments: equipments.length > 0 ? equipments : null,
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
          <Button variant="ghost" size="sm" className="absolute top-4 right-4">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier les équipements</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Équipements disponibles</Label>
              <div className="grid grid-cols-2 gap-3">
                {EQUIPMENT_OPTIONS.map((equipment) => (
                  <div key={equipment.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={equipment.id}
                      checked={equipments.includes(equipment.id)}
                      onCheckedChange={() => toggleEquipment(equipment.id)}
                    />
                    <Label htmlFor={equipment.id} className="font-normal cursor-pointer">
                      {equipment.label}
                    </Label>
                  </div>
                ))}
              </div>
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
