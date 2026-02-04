"use client"

import { useState } from "react"
import { Pencil, Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { MetroLineBadge, METRO_LINES, RER_LINES } from "@/components/ui/metro-line-badge"
import { updateSiteTransportation } from "@/lib/actions/sites"
import type { TransportationStop, TransportLine } from "@/lib/types/database"

interface EditTransportationModalProps {
  siteId: string
  initialTransportation: TransportationStop[] | null
}

export function EditTransportationModal({
  siteId,
  initialTransportation,
}: EditTransportationModalProps) {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [stops, setStops] = useState<TransportationStop[]>(initialTransportation || [])

  // Form state for adding new stop
  const [selectedLine, setSelectedLine] = useState<string>("")
  const [stationName, setStationName] = useState("")

  const handleAddStop = () => {
    if (!selectedLine || !stationName.trim()) return

    const newStop: TransportationStop = {
      line: selectedLine as TransportLine,
      station: stationName.trim(),
    }

    setStops((prev) => [...prev, newStop])
    setSelectedLine("")
    setStationName("")
  }

  const handleRemoveStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await updateSiteTransportation(siteId, {
      transportation_lines: stops.length > 0 ? stops : null,
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
      // Reset to initial state when opening
      setStops(initialTransportation || [])
      setSelectedLine("")
      setStationName("")
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="absolute top-4 right-4">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier les transports</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current stops list */}
            {stops.length > 0 && (
              <div className="space-y-2">
                <Label>Arrêts configurés</Label>
                <div className="space-y-2 rounded-lg border p-3">
                  {stops.map((stop, index) => (
                    <div
                      key={`${stop.line}-${stop.station}-${index}`}
                      className="flex items-center gap-2"
                    >
                      <MetroLineBadge line={stop.line} size="sm" />
                      <span className="flex-1 text-sm">{stop.station}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => handleRemoveStop(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new stop form */}
            <div className="space-y-3">
              <Label>Ajouter un arrêt</Label>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ligne</Label>
                <Select value={selectedLine} onValueChange={setSelectedLine}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une ligne" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      Métro
                    </div>
                    {METRO_LINES.map((line) => (
                      <SelectItem key={line} value={line}>
                        <div className="flex items-center gap-2">
                          <MetroLineBadge line={line} size="sm" />
                          <span>Ligne {line}</span>
                        </div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                      RER
                    </div>
                    {RER_LINES.map((line) => (
                      <SelectItem key={line} value={line}>
                        <div className="flex items-center gap-2">
                          <MetroLineBadge line={line} size="sm" />
                          <span>{line}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Station</Label>
                <Input
                  placeholder="Nom de la station"
                  value={stationName}
                  onChange={(e) => setStationName(e.target.value)}
                />
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleAddStop}
                disabled={!selectedLine || !stationName.trim()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
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
