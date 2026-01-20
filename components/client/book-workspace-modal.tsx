"use client"

import { useState } from "react"
import { Briefcase } from "lucide-react"
import { startOfDay } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { DatePickerNavigation } from "./date-picker-navigation"
import type { FlexPassOffer, PlanRecurrence } from "@/lib/types/database"

interface BookWorkspaceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pass: FlexPassOffer | null
  siteName: string
  totalCapacity: number
}

const RECURRENCE_LABELS: Record<PlanRecurrence, string> = {
  daily: "jour",
  weekly: "semaine",
  monthly: "mois",
}

function formatPrice(price: number | null): string {
  if (price === null) return "Prix sur demande"
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price)
}

function formatPassName(name: string): string {
  return name
    .replace("PASS ", "Pass ")
    .replace(" NOMAD", "")
    .replace("JOURNEE", "Journee")
    .replace("SEMAINE", "Semaine")
    .replace("MENSUEL", "Mensuel")
}

export function BookWorkspaceModal({
  open,
  onOpenChange,
  pass,
  siteName,
  totalCapacity,
}: BookWorkspaceModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => startOfDay(new Date()))
  const [postsCount, setPostsCount] = useState("1")

  if (!pass) return null

  const recurrenceLabel = pass.recurrence
    ? RECURRENCE_LABELS[pass.recurrence]
    : null

  // Generate options based on total capacity (max 10)
  const maxPosts = Math.min(totalCapacity, 10)
  const postsOptions = Array.from({ length: Math.max(maxPosts, 1) }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1} poste${i > 0 ? "s" : ""}`,
  }))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Reserver un poste de travail
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Pass info */}
          <div className="rounded-lg border p-4 space-y-2">
            <p className="type-body font-medium">{formatPassName(pass.name)}</p>
            <div className="flex items-baseline gap-1">
              <span className="type-h4 font-semibold text-primary">
                {formatPrice(pass.pricePerSeatMonth)}
              </span>
              {recurrenceLabel && (
                <span className="type-body-sm text-muted-foreground">
                  / {recurrenceLabel}
                </span>
              )}
            </div>
          </div>

          {/* Selection form */}
          <div className="rounded-lg bg-muted/50 p-4 space-y-4">
            <p className="type-body-sm text-muted-foreground">
              <span className="font-medium text-foreground">Site:</span> {siteName}
            </p>

            {/* Date picker */}
            <div>
              <label className="type-body-sm font-medium text-foreground block mb-2">
                Date
              </label>
              <DatePickerNavigation
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
            </div>

            {/* Posts count selector */}
            <div>
              <label className="type-body-sm font-medium text-foreground block mb-2">
                Nombre de postes
              </label>
              <SearchableSelect
                options={postsOptions}
                value={postsCount}
                onValueChange={setPostsCount}
                placeholder="Choisir le nombre"
                searchPlaceholder="Rechercher..."
                emptyMessage="Aucune option"
                triggerClassName="w-full"
              />
            </div>
          </div>

          {/* Placeholder message */}
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 text-center">
            <p className="type-body text-muted-foreground">
              UX a reprendre de l&apos;app de reservation
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
