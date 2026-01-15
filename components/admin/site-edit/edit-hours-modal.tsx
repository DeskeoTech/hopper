"use client"

import { useState } from "react"
import { Pencil } from "lucide-react"
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
import { updateSiteHours } from "@/lib/actions/sites"

const DAYS_OF_WEEK = [
  { id: "Lundi", label: "Lundi" },
  { id: "Mardi", label: "Mardi" },
  { id: "Mercredi", label: "Mercredi" },
  { id: "Jeudi", label: "Jeudi" },
  { id: "Vendredi", label: "Vendredi" },
  { id: "Samedi", label: "Samedi" },
  { id: "Dimanche", label: "Dimanche" },
]

interface EditHoursModalProps {
  siteId: string
  initialHours: string | null
  initialDays: string[] | null
}

export function EditHoursModal({
  siteId,
  initialHours,
  initialDays,
}: EditHoursModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hours, setHours] = useState(initialHours || "")
  const [days, setDays] = useState<string[]>(initialDays || [])

  const toggleDay = (day: string) => {
    setDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSiteHours(siteId, {
      opening_hours: hours || null,
      opening_days: days.length > 0 ? days : null,
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
            <DialogTitle>Modifier les horaires</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Heures d'ouverture</Label>
              <Input
                id="hours"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="Ex: 9h00 - 18h00"
              />
            </div>
            <div className="space-y-2">
              <Label>Jours d'ouverture</Label>
              <div className="grid grid-cols-2 gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={day.id}
                      checked={days.includes(day.id)}
                      onCheckedChange={() => toggleDay(day.id)}
                    />
                    <Label htmlFor={day.id} className="font-normal cursor-pointer">
                      {day.label}
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
