"use client"

import { useState } from "react"
import { AlertCircle, Check, Clock, Coffee, RotateCcw, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { recordConsumption, type CafeUserFiche as CafeUserFicheType } from "@/lib/actions/cafe"

interface CafeUserFicheProps {
  fiche: CafeUserFicheType
  adminId: string
  onReset: () => void
  onConsumptionRecorded: () => void
}

export function CafeUserFiche({ fiche, adminId, onReset, onConsumptionRecorded }: CafeUserFicheProps) {
  const [selectedBeverages, setSelectedBeverages] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Validation checks
  const now = new Date()
  const lastConsoTime = fiche.last_consumption_at ? new Date(fiche.last_consumption_at).getTime() : null
  const minutesSinceLast = lastConsoTime ? (now.getTime() - lastConsoTime) / (1000 * 60) : null
  const cooldownActive = minutesSinceLast !== null && minutesSinceLast < 58
  const waitMinutes = cooldownActive ? Math.ceil(58 - minutesSinceLast!) : 0
  const dailyLimitReached = fiche.today_consumption_count >= fiche.daily_drink_limit
  const contractInactive = fiche.contract_status !== "active"
  const canOrder = !cooldownActive && !dailyLimitReached && !contractInactive

  const toggleBeverage = (id: string) => {
    setSelectedBeverages((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    )
  }

  const handleSubmit = async () => {
    if (!selectedBeverages.length) return
    setSubmitting(true)
    setError(null)

    const result = await recordConsumption(fiche.id, selectedBeverages, adminId)

    if (result.success) {
      setSuccess(true)
      setSelectedBeverages([])
      onConsumptionRecorded()
    } else {
      setError(result.error)
    }
    setSubmitting(false)
  }

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Consommation enregistrée !</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {fiche.first_name} {fiche.last_name}
          </p>
        </div>
        <Button onClick={onReset} variant="outline" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Nouveau scan
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User info card */}
      <div className="flex items-center gap-4">
        {fiche.photo_url ? (
          <img
            src={fiche.photo_url}
            alt={`${fiche.first_name} ${fiche.last_name}`}
            className="h-16 w-16 shrink-0 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">
            {fiche.first_name} {fiche.last_name}
          </h3>
          {fiche.company_name && (
            <p className="truncate text-sm text-muted-foreground">{fiche.company_name}</p>
          )}
          <div className="mt-1 flex items-center gap-2">
            <Coffee className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium">{fiche.plan_name}</span>
          </div>
        </div>
      </div>

      {/* Consumption gauge */}
      <div className="rounded-xl bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Consommations aujourd&apos;hui</span>
          <span className="text-lg font-bold">
            {fiche.today_consumption_count} / {fiche.daily_drink_limit}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${
              dailyLimitReached ? "bg-red-500" : "bg-green-500"
            }`}
            style={{
              width: `${Math.min((fiche.today_consumption_count / fiche.daily_drink_limit) * 100, 100)}%`,
            }}
          />
        </div>
        {fiche.last_consumption_at && (
          <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Dernière conso : {new Date(fiche.last_consumption_at).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Paris",
            })}
          </div>
        )}
      </div>

      {/* Validation errors */}
      {contractInactive && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Forfait inactif</p>
            <p className="text-sm">Le forfait café de cet utilisateur n&apos;est pas actif.</p>
          </div>
        </div>
      )}

      {cooldownActive && !contractInactive && (
        <div className="flex items-start gap-3 rounded-xl bg-orange-50 p-4 text-orange-800">
          <Clock className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Délai de 58 minutes</p>
            <p className="text-sm">
              Veuillez attendre encore {waitMinutes} minute(s) avant la prochaine consommation.
            </p>
          </div>
        </div>
      )}

      {dailyLimitReached && !contractInactive && (
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-medium">Limite journalière atteinte</p>
            <p className="text-sm">
              {fiche.first_name} a atteint sa limite de {fiche.daily_drink_limit} consommation(s) pour aujourd&apos;hui.
            </p>
          </div>
        </div>
      )}

      {/* Beverage selection */}
      {canOrder && (
        <>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Sélectionner les boissons
            </h4>
            {fiche.eligible_beverages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune boisson éligible pour ce forfait.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {fiche.eligible_beverages.map((bev) => (
                  <label
                    key={bev.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 transition-colors ${
                      selectedBeverages.includes(bev.id)
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <Checkbox
                      checked={selectedBeverages.includes(bev.id)}
                      onCheckedChange={() => toggleBeverage(bev.id)}
                    />
                    <span className="text-sm">{bev.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleSubmit}
              disabled={submitting || selectedBeverages.length === 0}
              className="flex-1"
            >
              {submitting ? "Enregistrement..." : "Enregistrer la consommation"}
            </Button>
            <Button onClick={onReset} variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      {/* Reset button when cannot order */}
      {!canOrder && (
        <Button onClick={onReset} variant="outline" className="w-full gap-2">
          <RotateCcw className="h-4 w-4" />
          Nouveau scan
        </Button>
      )}
    </div>
  )
}
