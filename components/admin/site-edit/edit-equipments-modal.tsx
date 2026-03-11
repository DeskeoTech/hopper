"use client"

import { useState } from "react"
import { Pencil, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
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

const DEFAULT_EQUIPMENT_OPTIONS: { id: string; label: string }[] = [
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

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
}

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
  const [equipments, setEquipments] = useState<string[]>(initialEquipments || [])
  const [newEquipmentLabel, setNewEquipmentLabel] = useState("")

  // Build options: defaults + any custom ones already in the site's equipments
  const defaultIds = new Set(DEFAULT_EQUIPMENT_OPTIONS.map((o) => o.id))
  const customOptions = (initialEquipments || [])
    .filter((e) => !defaultIds.has(e))
    .map((e) => ({ id: e, label: e }))
  const [extraOptions, setExtraOptions] = useState<{ id: string; label: string }[]>(customOptions)

  const allOptions = [...DEFAULT_EQUIPMENT_OPTIONS, ...extraOptions]

  const toggleEquipment = (equipmentId: string) => {
    setEquipments((prev) =>
      prev.includes(equipmentId)
        ? prev.filter((e) => e !== equipmentId)
        : [...prev, equipmentId]
    )
  }

  const handleAddCustom = () => {
    const label = newEquipmentLabel.trim()
    if (!label) return

    const id = slugify(label)
    // Don't add if already exists
    if (allOptions.some((o) => o.id === id)) {
      // Just select it if it exists
      if (!equipments.includes(id)) {
        setEquipments((prev) => [...prev, id])
      }
      setNewEquipmentLabel("")
      return
    }

    setExtraOptions((prev) => [...prev, { id, label }])
    setEquipments((prev) => [...prev, id])
    setNewEquipmentLabel("")
  }

  const handleRemoveCustom = (id: string) => {
    setExtraOptions((prev) => prev.filter((o) => o.id !== id))
    setEquipments((prev) => prev.filter((e) => e !== id))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSiteEquipments(siteId, {
      equipments: equipments.length > 0 ? (equipments as Equipment[]) : null,
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
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Équipements disponibles</Label>
              <div className="grid grid-cols-2 gap-3">
                {allOptions.map((equipment) => {
                  const isCustom = !defaultIds.has(equipment.id)
                  return (
                    <div key={equipment.id} className="flex items-center gap-2">
                      <Checkbox
                        id={equipment.id}
                        checked={equipments.includes(equipment.id)}
                        onCheckedChange={() => toggleEquipment(equipment.id)}
                      />
                      <Label htmlFor={equipment.id} className="flex-1 font-normal cursor-pointer">
                        {equipment.label}
                      </Label>
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCustom(equipment.id)}
                          className="rounded-full p-0.5 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Add custom equipment */}
            <div className="space-y-2 border-t pt-4">
              <Label>Ajouter un équipement</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  placeholder="Nom de l'équipement..."
                  value={newEquipmentLabel}
                  onChange={(e) => setNewEquipmentLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCustom()
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddCustom}
                  disabled={!newEquipmentLabel.trim()}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Ajouter
                </Button>
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
