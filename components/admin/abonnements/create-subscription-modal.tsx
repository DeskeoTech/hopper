"use client"

import { useState, useMemo } from "react"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { createCompanySubscription } from "@/lib/actions/companies"
import type { SubscriptionPeriod } from "@/lib/types/database"

interface CompanyOption {
  id: string
  name: string | null
}

interface CreateSubscriptionModalProps {
  companiesWithoutSubscription: CompanyOption[]
}

export function CreateSubscriptionModal({
  companiesWithoutSubscription,
}: CreateSubscriptionModalProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [companyId, setCompanyId] = useState("")
  const [period, setPeriod] = useState<SubscriptionPeriod>("month")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [endDate, setEndDate] = useState("")
  const [error, setError] = useState<string | null>(null)

  const companyOptions = useMemo(
    () =>
      companiesWithoutSubscription.map((c) => ({
        value: c.id,
        label: c.name || "Sans nom",
      })),
    [companiesWithoutSubscription]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!companyId) {
      setError("Veuillez selectionner une entreprise")
      return
    }

    setLoading(true)
    const result = await createCompanySubscription(companyId, {
      subscription_period: period,
      subscription_start_date: startDate,
      subscription_end_date: endDate || null,
    })
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    if (result.success) {
      setOpen(false)
      resetForm()
    }
  }

  const resetForm = () => {
    setCompanyId("")
    setPeriod("month")
    setStartDate(new Date().toISOString().split("T")[0])
    setEndDate("")
    setError(null)
  }

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen)
    if (!isOpen) {
      resetForm()
    }
  }

  if (companiesWithoutSubscription.length === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvel abonnement
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Creer un abonnement</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Entreprise</Label>
            <SearchableSelect
              options={companyOptions}
              value={companyId}
              onValueChange={setCompanyId}
              placeholder="Selectionner une entreprise"
              searchPlaceholder="Rechercher une entreprise..."
              emptyMessage="Aucune entreprise trouvee"
              triggerClassName="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="period">Periode d'abonnement</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as SubscriptionPeriod)}>
              <SelectTrigger>
                <SelectValue placeholder="Selectionner une periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Mensuel</SelectItem>
                <SelectItem value="week">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">Date de debut</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">Date de fin (optionnel)</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
            />
            <p className="text-xs text-muted-foreground">
              Laissez vide pour un abonnement sans date de fin
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creation..." : "Creer l'abonnement"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
