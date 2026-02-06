"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createResource, updateResource } from "@/lib/actions/resources"
import type { Resource, ResourceType, FloorLevel, ResourceEquipment } from "@/lib/types/database"

const RESOURCE_TYPE_OPTIONS: { value: ResourceType; label: string }[] = [
  { value: "bench", label: "Poste en open space" },
  { value: "meeting_room", label: "Salle de réunion" },
  { value: "flex_desk", label: "Bureau flexible" },
  { value: "fixed_desk", label: "Bureau fixe" },
]

const FLOOR_OPTIONS: { value: FloorLevel; label: string }[] = [
  { value: "R-1", label: "R-1 (Sous-sol)" },
  { value: "RDJ", label: "RDJ (Rez-de-jardin)" },
  { value: "RDC", label: "RDC (Rez-de-chaussée)" },
  { value: "R+1", label: "R+1" },
  { value: "R+2", label: "R+2" },
  { value: "R+3", label: "R+3" },
  { value: "R+4", label: "R+4" },
  { value: "R+5", label: "R+5" },
]

const EQUIPMENT_OPTIONS: { id: ResourceEquipment; label: string }[] = [
  { id: "ecran", label: "Écran" },
  { id: "visio", label: "Visioconférence" },
  { id: "tableau", label: "Tableau blanc" },
]

interface ResourceFormModalProps {
  siteId: string
  resource?: Resource
  trigger: React.ReactNode
}

export function ResourceFormModal({ siteId, resource, trigger }: ResourceFormModalProps) {
  const isEdit = !!resource

  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const [name, setName] = useState(resource?.name ?? "")
  const [type, setType] = useState<ResourceType>(resource?.type ?? "bench")
  const [capacity, setCapacity] = useState<string>(resource?.capacity?.toString() ?? "")
  const [floor, setFloor] = useState<FloorLevel | "">(resource?.floor ?? "")
  const [hourlyRate, setHourlyRate] = useState<string>(resource?.hourly_credit_rate?.toString() ?? "")
  const [equipments, setEquipments] = useState<ResourceEquipment[]>(resource?.equipments ?? [])
  const [status, setStatus] = useState<"available" | "unavailable">(resource?.status ?? "available")

  const resetForm = () => {
    setName(resource?.name ?? "")
    setType(resource?.type ?? "bench")
    setCapacity(resource?.capacity?.toString() ?? "")
    setFloor(resource?.floor ?? "")
    setHourlyRate(resource?.hourly_credit_rate?.toString() ?? "")
    setEquipments(resource?.equipments ?? [])
    setStatus(resource?.status ?? "available")
  }

  const handleOpenChange = (value: boolean) => {
    setOpen(value)
    if (!value) resetForm()
  }

  const toggleEquipment = (eq: ResourceEquipment) => {
    setEquipments((prev) =>
      prev.includes(eq) ? prev.filter((e) => e !== eq) : [...prev, eq]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)

    const data = {
      name: name.trim(),
      type,
      capacity: capacity ? parseInt(capacity, 10) : null,
      floor: floor || null,
      hourly_credit_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      equipments: equipments.length > 0 ? equipments : null,
      status,
    }

    const result = isEdit
      ? await updateResource(resource.id, siteId, data)
      : await createResource(siteId, data)

    setLoading(false)

    if (result.success) {
      toast.success(isEdit ? "Ressource modifiée" : "Ressource ajoutée")
      setOpen(false)
      setConfirmOpen(false)
      if (!isEdit) resetForm()
    } else {
      toast.error(result.error || "Une erreur est survenue")
      setConfirmOpen(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isEdit ? "Modifier la ressource" : "Ajouter une ressource"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-name">Nom *</Label>
                <Input
                  id="resource-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Salle Horizon"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-status">Statut</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "available" | "unavailable")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Disponible</SelectItem>
                    <SelectItem value="unavailable">Indisponible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as ResourceType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-floor">Étage</Label>
                <Select value={floor} onValueChange={(v) => setFloor(v as FloorLevel)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {FLOOR_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-capacity">Capacité (personnes)</Label>
                <Input
                  id="resource-capacity"
                  type="number"
                  min="1"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Ex: 8"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-rate">Tarif horaire (crédits)</Label>
                <Input
                  id="resource-rate"
                  type="number"
                  min="0"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="Ex: 2.5"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Équipements</Label>
              <div className="flex flex-wrap gap-4">
                {EQUIPMENT_OPTIONS.map((eq) => (
                  <label key={eq.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <Checkbox
                      checked={equipments.includes(eq.id)}
                      onCheckedChange={() => toggleEquipment(eq.id)}
                    />
                    {eq.label}
                  </label>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !name.trim()}>
                {loading ? "Enregistrement..." : isEdit ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isEdit ? "Confirmer les modifications" : "Confirmer l'ajout"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isEdit
                ? "Voulez-vous vraiment enregistrer ces modifications ?"
                : `Voulez-vous ajouter la ressource "${name.trim()}" ?`}
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
