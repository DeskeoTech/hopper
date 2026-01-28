"use client"

import { useState, useTransition, useEffect } from "react"
import { format } from "date-fns"
import { Calendar, Clock, Loader2, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  createBookingFromAdmin,
  getResourcesBySite,
} from "@/lib/actions/bookings"

interface Site {
  id: string
  name: string
}

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface BookingCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  sites: Site[]
  users: User[]
}

const RESOURCE_TYPE_LABELS: Record<string, string> = {
  meeting_room: "Salle de réunion",
  bench: "Poste",
  flex_desk: "Flex desk",
  fixed_desk: "Fixed desk",
}

export function BookingCreateDialog({
  open,
  onOpenChange,
  sites,
  users,
}: BookingCreateDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [siteId, setSiteId] = useState("")
  const [resourceId, setResourceId] = useState("")
  const [userId, setUserId] = useState("")
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("10:00")
  const [status, setStatus] = useState<"confirmed" | "pending">("confirmed")
  const [notes, setNotes] = useState("")

  // Resources state (loaded when site changes)
  const [resources, setResources] = useState<
    Array<{ id: string; name: string; type: string }>
  >([])
  const [loadingResources, setLoadingResources] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setSiteId("")
      setResourceId("")
      setUserId("")
      setDate(format(new Date(), "yyyy-MM-dd"))
      setStartTime("09:00")
      setEndTime("10:00")
      setStatus("confirmed")
      setNotes("")
      setResources([])
      setError(null)
    }
  }, [open])

  // Load resources when site changes
  useEffect(() => {
    if (!siteId) {
      setResources([])
      setResourceId("")
      return
    }

    setLoadingResources(true)
    setResourceId("")

    getResourcesBySite(siteId).then((result) => {
      setLoadingResources(false)
      if (result.error) {
        setError(result.error)
        setResources([])
      } else {
        setResources(result.resources)
      }
    })
  }, [siteId])

  // Handle form submission
  const handleSubmit = () => {
    setError(null)

    // Validation
    if (!siteId) {
      setError("Veuillez sélectionner un site")
      return
    }
    if (!resourceId) {
      setError("Veuillez sélectionner une ressource")
      return
    }
    if (!userId) {
      setError("Veuillez sélectionner un utilisateur")
      return
    }
    if (!date || !startTime || !endTime) {
      setError("Veuillez remplir la date et les horaires")
      return
    }
    if (startTime >= endTime) {
      setError("L'heure de fin doit être après l'heure de début")
      return
    }

    // Check that the reservation is not in the past
    const now = new Date()
    const selectedDateTime = new Date(`${date}T${startTime}:00`)
    if (selectedDateTime < now) {
      setError("Impossible de créer une réservation dans le passé")
      return
    }

    const startDate = `${date}T${startTime}:00`
    const endDate = `${date}T${endTime}:00`

    // Validate dates
    const startDateObj = new Date(startDate)
    const endDateObj = new Date(endDate)
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      setError("Date ou heure invalide")
      return
    }

    startTransition(async () => {
      const result = await createBookingFromAdmin({
        userId,
        resourceId,
        startDate: startDateObj.toISOString(),
        endDate: endDateObj.toISOString(),
        status,
        notes: notes.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
      }
    })
  }

  // Prepare options for SearchableSelect
  const siteOptions = sites.map((s) => ({
    value: s.id,
    label: s.name,
  }))

  const resourceOptions = resources.map((r) => ({
    value: r.id,
    label: `${r.name} (${RESOURCE_TYPE_LABELS[r.type] || r.type})`,
  }))

  const userOptions = users.map((u) => {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ")
    return {
      value: u.id,
      label: name ? `${name} (${u.email || "pas d'email"})` : u.email || "Utilisateur sans nom",
    }
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] sm:rounded-[20px]">
        <DialogHeader>
          <DialogTitle>Nouvelle réservation</DialogTitle>
          <DialogDescription>
            Créer une nouvelle réservation pour un utilisateur
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Site selection */}
          <div className="space-y-2">
            <Label>Site *</Label>
            <SearchableSelect
              options={siteOptions}
              value={siteId}
              onValueChange={setSiteId}
              placeholder="Sélectionner un site"
              searchPlaceholder="Rechercher un site..."
              emptyMessage="Aucun site trouvé"
              triggerClassName="w-full rounded-[12px]"
            />
          </div>

          {/* Resource selection */}
          <div className="space-y-2">
            <Label>Ressource *</Label>
            {loadingResources ? (
              <div className="flex h-10 items-center justify-center rounded-[12px] border border-input bg-background">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <SearchableSelect
                options={resourceOptions}
                value={resourceId}
                onValueChange={setResourceId}
                placeholder={
                  siteId
                    ? "Sélectionner une ressource"
                    : "Sélectionnez d'abord un site"
                }
                searchPlaceholder="Rechercher une ressource..."
                emptyMessage="Aucune ressource disponible"
                triggerClassName="w-full rounded-[12px]"
              />
            )}
          </div>

          {/* User selection */}
          <div className="space-y-2">
            <Label>Utilisateur *</Label>
            <SearchableSelect
              options={userOptions}
              value={userId}
              onValueChange={setUserId}
              placeholder="Sélectionner un utilisateur"
              searchPlaceholder="Rechercher un utilisateur..."
              emptyMessage="Aucun utilisateur trouvé"
              triggerClassName="w-full rounded-[12px]"
            />
          </div>

          {/* Date and time */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date *
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={isPending}
                min={format(new Date(), "yyyy-MM-dd")}
                className="rounded-[12px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Début *
                </Label>
                <Input
                  id="startTime"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  disabled={isPending}
                  className="rounded-[12px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Fin *
                </Label>
                <Input
                  id="endTime"
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  disabled={isPending}
                  className="rounded-[12px]"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select
              value={status}
              onValueChange={(v) => setStatus(v as "confirmed" | "pending")}
              disabled={isPending}
            >
              <SelectTrigger className="rounded-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">Confirmée</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes (optionnel)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isPending}
              placeholder="Ajouter des notes..."
              className="min-h-[80px] rounded-[12px]"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
            className="w-full rounded-[12px] sm:w-auto"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full rounded-[12px] sm:w-auto"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Création...
              </>
            ) : (
              "Créer la réservation"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
