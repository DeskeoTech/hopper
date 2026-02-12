"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import {
  FlaskConical,
  CreditCard,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Receipt,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Calendar } from "@/components/ui/calendar"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { createCheckoutSession, createPortalSession, getTestSessions } from "@/lib/actions/stripe"

type PassType = "day" | "week" | "month"

const PASS_CONFIG = {
  day: { label: "Day Pass", pricePerUnit: 30, unit: "jour" },
  week: { label: "Pass Week", pricePerUnit: 100, unit: "semaine" },
  month: { label: "Pass Month", pricePerUnit: 300, unit: "mois" },
}

const TVA_RATE = 0.2

interface SiteOption {
  id: string
  name: string
  address: string | null
}

interface StripeSession {
  id: string
  amountTotal: number | null
  currency: string | null
  status: string | null
  paymentStatus: string | null
  mode: string | null
  created: number
  customerEmail: string | null
  customer: string | null
  metadata: Record<string, string> | null
}

function formatAmount(cents: number | null): string {
  if (cents === null) return "-"
  return `${(cents / 100).toFixed(2)}€`
}

function StatusBadge({ status, paymentStatus }: { status: string | null; paymentStatus: string | null }) {
  if (paymentStatus === "paid") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Payé
      </span>
    )
  }
  if (status === "expired") {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
        Expiré
      </span>
    )
  }
  if (status === "open") {
    return (
      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
        En cours
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
      {paymentStatus || status || "-"}
    </span>
  )
}

interface StripeTestFormProps {
  sites: SiteOption[]
}

export function StripeTestForm({ sites }: StripeTestFormProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [selectedSiteId, setSelectedSiteId] = useState("")
  const [passType, setPassType] = useState<PassType>("day")
  const [seats, setSeats] = useState(1)
  const [customerEmail, setCustomerEmail] = useState("")
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Day mode: multiple dates selected
  const [selectedDays, setSelectedDays] = useState<Date[]>([])
  // Week mode: start date + number of weeks
  const [weekStartDate, setWeekStartDate] = useState<Date | undefined>()
  const [weeks, setWeeks] = useState(1)
  // Month mode: start date
  const [monthStartDate, setMonthStartDate] = useState<Date | undefined>()

  // History
  const [sessions, setSessions] = useState<StripeSession[]>([])
  const [loadingSessions, setLoadingSessions] = useState(true)
  const [portalLoading, setPortalLoading] = useState<string | null>(null)

  const success = searchParams.get("success") === "true"
  const canceled = searchParams.get("canceled") === "true"

  const loadSessions = useCallback(async () => {
    setLoadingSessions(true)
    try {
      const result = await getTestSessions()
      if ("sessions" in result) setSessions(result.sessions)
    } catch {
      // Silently fail
    } finally {
      setLoadingSessions(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  useEffect(() => {
    if (success || canceled) {
      loadSessions()
      const timer = setTimeout(() => {
        router.replace("/admin/tests")
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [success, canceled, router, loadSessions])

  const pricing = useMemo(() => {
    const config = PASS_CONFIG[passType]
    let quantity: number
    if (passType === "day") {
      quantity = selectedDays.length || 0
    } else if (passType === "week") {
      quantity = weeks
    } else {
      quantity = 1
    }
    const priceHT = config.pricePerUnit * quantity * seats
    const tva = priceHT * TVA_RATE
    const priceTTC = priceHT + tva
    return { priceHT, tva, priceTTC, quantity }
  }, [passType, selectedDays.length, weeks, seats])

  const canSubmit = useMemo(() => {
    if (!selectedSiteId) return false
    if (passType === "day" && selectedDays.length === 0) return false
    if (passType === "week" && !weekStartDate) return false
    if (passType === "month" && !monthStartDate) return false
    return true
  }, [selectedSiteId, passType, selectedDays.length, weekStartDate, monthStartDate])

  async function handleSubmit() {
    const site = sites.find((s) => s.id === selectedSiteId)
    if (!site || !canSubmit) return

    setIsPending(true)
    setError(null)

    let dates: string[]
    let extraParams: { days?: number; weeks?: number } = {}

    if (passType === "day") {
      dates = selectedDays
        .sort((a, b) => a.getTime() - b.getTime())
        .map((d) => d.toISOString())
      extraParams = { days: selectedDays.length }
    } else if (passType === "week") {
      const start = weekStartDate!
      dates = Array.from({ length: weeks * 7 }, (_, i) => {
        const d = new Date(start)
        d.setDate(d.getDate() + i)
        return d.toISOString()
      })
      extraParams = { weeks }
    } else {
      dates = [monthStartDate!.toISOString()]
    }

    try {
      const result = await createCheckoutSession({
        siteId: site.id,
        siteName: site.name,
        passType,
        seats,
        dates,
        returnPath: "/admin/tests",
        includeTax: true,
        ...(customerEmail ? { customerEmail } : {}),
        ...extraParams,
      })

      if ("error" in result) throw new Error(result.error)

      if (result.url) {
        window.location.href = result.url
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setIsPending(false)
    }
  }

  async function handlePortal(customerId: string) {
    setPortalLoading(customerId)
    try {
      const result = await createPortalSession(customerId)
      if ("error" in result) return
      if (result.url) {
        window.location.href = result.url
      }
    } catch {
      // Silently fail
    } finally {
      setPortalLoading(null)
    }
  }

  const today = new Date()

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
          <FlaskConical className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Tests Stripe
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Testez les sessions de paiement Stripe en configurant le type de
            pass, les dates et le nombre de postes.
          </p>
        </div>
      </div>

      {/* Success/Cancel Feedback */}
      {success && (
        <div className="flex items-center gap-3 rounded-[20px] bg-green-50 p-4 sm:p-6 text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Paiement test réussi !</p>
        </div>
      )}
      {canceled && (
        <div className="flex items-center gap-3 rounded-[20px] bg-orange-50 p-4 sm:p-6 text-orange-800">
          <XCircle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-medium">Paiement annulé.</p>
        </div>
      )}

      {/* Form Card */}
      <div className="rounded-[20px] bg-card p-4 sm:p-6 space-y-6">
        {/* Site selector */}
        <div className="space-y-2">
          <Label>Site</Label>
          <SearchableSelect
            options={sites.map((s) => ({
              value: s.id,
              label: s.address ? `${s.name} - ${s.address}` : s.name,
            }))}
            value={selectedSiteId}
            onValueChange={setSelectedSiteId}
            placeholder="Sélectionner un site..."
            searchPlaceholder="Rechercher un site..."
          />
        </div>

        {/* Pass type selector */}
        <div className="space-y-2">
          <Label>Type de pass</Label>
          <div className="grid grid-cols-3 gap-2">
            {(["day", "week", "month"] as const).map((type) => (
              <button
                key={type}
                onClick={() => setPassType(type)}
                className={cn(
                  "rounded-xl border-2 p-3 text-center transition-all",
                  passType === type
                    ? "border-foreground bg-foreground/5"
                    : "border-border hover:border-foreground/30"
                )}
              >
                <div className="text-sm font-semibold">
                  {PASS_CONFIG[type].label}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  {PASS_CONFIG[type].pricePerUnit}€/{PASS_CONFIG[type].unit}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Date selection based on pass type */}
        <div className="space-y-2">
          <Label>
            {passType === "day" && "Sélectionnez les jours"}
            {passType === "week" && "Date de début"}
            {passType === "month" && "Date de début de l'abonnement"}
          </Label>

          {passType === "day" && (
            <div className="flex justify-center rounded-xl border border-border p-2">
              <Calendar
                mode="multiple"
                selected={selectedDays}
                onSelect={(days) => setSelectedDays(days || [])}
                disabled={{ before: today }}
              />
            </div>
          )}

          {passType === "week" && (
            <>
              <div className="flex justify-center rounded-xl border border-border p-2">
                <Calendar
                  mode="single"
                  selected={weekStartDate}
                  onSelect={setWeekStartDate}
                  disabled={{ before: today }}
                />
              </div>
              {weekStartDate && (
                <p className="text-xs text-muted-foreground">
                  Début :{" "}
                  {format(weekStartDate, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              )}
              <div className="space-y-2 pt-2">
                <Label htmlFor="weeks">Nombre de semaines</Label>
                <Input
                  id="weeks"
                  type="number"
                  min={1}
                  max={52}
                  value={weeks}
                  onChange={(e) =>
                    setWeeks(Math.max(1, parseInt(e.target.value) || 1))
                  }
                />
              </div>
            </>
          )}

          {passType === "month" && (
            <>
              <div className="flex justify-center rounded-xl border border-border p-2">
                <Calendar
                  mode="single"
                  selected={monthStartDate}
                  onSelect={setMonthStartDate}
                  disabled={{ before: today }}
                />
              </div>
              {monthStartDate && (
                <p className="text-xs text-muted-foreground">
                  Début de l&apos;abonnement :{" "}
                  {format(monthStartDate, "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              )}
            </>
          )}
        </div>

        {/* Seats + Email */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="seats">Nombre de postes</Label>
            <Input
              id="seats"
              type="number"
              min={1}
              max={50}
              value={seats}
              onChange={(e) =>
                setSeats(Math.max(1, parseInt(e.target.value) || 1))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email client (optionnel)</Label>
            <Input
              id="email"
              type="email"
              placeholder="email@exemple.com"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Price Breakdown Card */}
      {pricing.quantity > 0 && (
        <div className="rounded-[20px] bg-card p-4 sm:p-6">
          <h2 className="text-lg font-bold uppercase tracking-wide mb-4">
            Récapitulatif
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Prix / {PASS_CONFIG[passType].unit}
              </span>
              <span>{PASS_CONFIG[passType].pricePerUnit},00€ HT</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {pricing.quantity} {PASS_CONFIG[passType].unit}
                {pricing.quantity > 1 && passType !== "month" ? "s" : ""} ×{" "}
                {seats} poste{seats > 1 ? "s" : ""}
              </span>
              <span>{pricing.priceHT.toFixed(2)}€ HT</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>TVA (20%)</span>
              <span>{pricing.tva.toFixed(2)}€</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
              <span>Total TTC</span>
              <span>{pricing.priceTTC.toFixed(2)}€</span>
            </div>
            {passType === "month" && (
              <p className="text-xs text-muted-foreground pt-1">
                Abonnement mensuel récurrent
              </p>
            )}
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Submit Button */}
      <Button
        size="lg"
        className="w-full sm:w-auto"
        disabled={!canSubmit || isPending}
        onClick={handleSubmit}
      >
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Redirection vers Stripe...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            {passType === "month"
              ? `Créer l'abonnement - ${pricing.priceTTC.toFixed(2)}€/mois TTC`
              : `Créer la session Stripe - ${pricing.priceTTC.toFixed(2)}€ TTC`}
          </>
        )}
      </Button>

      {/* History Section */}
      <div className="rounded-[20px] bg-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            <h2 className="text-lg font-bold uppercase tracking-wide">
              Historique
            </h2>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSessions}
            disabled={loadingSessions}
          >
            <RefreshCw
              className={cn(
                "h-4 w-4",
                loadingSessions && "animate-spin"
              )}
            />
          </Button>
        </div>

        {loadingSessions && sessions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune session de test pour le moment.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Site</TableHead>
                  <TableHead className="hidden md:table-cell">Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(
                        new Date(session.created * 1000),
                        "dd/MM/yy HH:mm",
                        { locale: fr }
                      )}
                    </TableCell>
                    <TableCell className="text-sm max-w-[150px] truncate">
                      {sites.find((s) => s.id === session.metadata?.siteName)?.name ||
                        session.metadata?.siteName || "-"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">
                      {session.metadata?.bookingType || "-"}
                      {session.metadata?.quantity && Number(session.metadata.quantity) > 1 && (
                        <span className="text-muted-foreground">
                          {" "}× {session.metadata.quantity}p
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-medium whitespace-nowrap">
                      {formatAmount(session.amountTotal)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge
                        status={session.status}
                        paymentStatus={session.paymentStatus}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {session.customer && session.paymentStatus === "paid" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs"
                            disabled={portalLoading === session.customer}
                            onClick={() =>
                              handlePortal(session.customer as string)
                            }
                          >
                            {portalLoading === session.customer ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Portail
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
