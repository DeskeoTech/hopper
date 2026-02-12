"use client"

import { useState, useMemo, useCallback, useTransition, useEffect } from "react"
import { X, MapPin, Ticket, ChevronDown, CreditCard, Loader2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ScrollableCalendar } from "./scrollable-calendar"
import { CGVModal } from "./cgv-modal"
import { cn } from "@/lib/utils"
import { format, addDays, isWeekend, isBefore, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import type { Site } from "@/lib/types/database"
import { createCheckoutSession } from "@/lib/actions/stripe"

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
}

interface BookingDialogProps {
  site: SiteWithPhotos | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PassType = "day" | "week" | "month"

const PASS_CONFIG = {
  day: {
    label: "Day Pass",
    pricePerSeat: 30,
    days: 1,
    discount: null,
    stripeMode: "payment" as const,
  },
  week: {
    label: "Pass Week",
    pricePerSeat: 100,
    days: 5,
    discount: 33,
    stripeMode: "payment" as const,
    description: "5 jours ouvrés",
  },
  month: {
    label: "Pass Month",
    pricePerSeat: 300,
    days: 20,
    discount: 50,
    stripeMode: "subscription" as const,
    description: "20 jours ouvrés",
  },
}

const TVA_RATE = 0.2

// Easter calculation
function getEaster(year: number): Date {
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31)
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month - 1, day)
}

function getFrenchHolidays(year: number): Date[] {
  const holidays: Date[] = []
  holidays.push(new Date(year, 0, 1))
  holidays.push(new Date(year, 4, 1))
  holidays.push(new Date(year, 4, 8))
  holidays.push(new Date(year, 6, 14))
  holidays.push(new Date(year, 7, 15))
  holidays.push(new Date(year, 10, 1))
  holidays.push(new Date(year, 10, 11))
  holidays.push(new Date(year, 11, 25))
  const easter = getEaster(year)
  holidays.push(addDays(easter, 1))
  holidays.push(addDays(easter, 39))
  holidays.push(addDays(easter, 50))
  return holidays
}

function isHoliday(date: Date, holidays: Date[]): boolean {
  return holidays.some((h) =>
    h.getFullYear() === date.getFullYear() &&
    h.getMonth() === date.getMonth() &&
    h.getDate() === date.getDate()
  )
}

function isBusinessDay(date: Date, holidays: Date[]): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays)
}

function getNextBusinessDays(startDate: Date, count: number, holidays: Date[]): Date[] {
  const dates: Date[] = []
  let current = startDate
  while (dates.length < count) {
    if (isBusinessDay(current, holidays)) {
      dates.push(current)
    }
    current = addDays(current, 1)
  }
  return dates
}

function getFirstAvailableDate(holidays: Date[]): Date {
  const now = new Date()
  let startDate = startOfDay(now)

  // If after 18h, start from tomorrow
  if (now.getHours() >= 18) {
    startDate = addDays(startDate, 1)
  }

  // Find first business day
  while (!isBusinessDay(startDate, holidays)) {
    startDate = addDays(startDate, 1)
  }

  return startDate
}

export function BookingDialog({ site, open, onOpenChange }: BookingDialogProps) {
  const [passType, setPassType] = useState<PassType>("day")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [seats, setSeats] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [passExpanded, setPassExpanded] = useState(true)
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [cgvModalOpen, setCgvModalOpen] = useState(false)

  const holidays = useMemo(() => {
    const year = new Date().getFullYear()
    return [...getFrenchHolidays(year), ...getFrenchHolidays(year + 1)]
  }, [])

  // Auto-select 5 working days on open
  useEffect(() => {
    if (open && selectedDates.length === 0) {
      const firstDate = getFirstAvailableDate(holidays)
      const initialDates = getNextBusinessDays(firstDate, 5, holidays)
      setSelectedDates(initialDates)
      setPassType("week")
    }
  }, [open, holidays, selectedDates.length])

  // Auto-detect pass type based on selected days
  useEffect(() => {
    if (selectedDates.length === 5) {
      setPassType("week")
    } else if (selectedDates.length === 20) {
      setPassType("month")
    } else if (selectedDates.length === 1) {
      setPassType("day")
    }
  }, [selectedDates.length])

  const passConfig = PASS_CONFIG[passType]

  const pricing = useMemo(() => {
    const priceHT = passConfig.pricePerSeat * seats
    const tva = priceHT * TVA_RATE
    const priceTTC = priceHT + tva
    return { priceHT, tva, priceTTC }
  }, [passConfig.pricePerSeat, seats])

  const canBook = selectedDates.length > 0 && site && cgvAccepted

  const handlePassSelect = useCallback((type: "week" | "month") => {
    const firstDate = selectedDates.length > 0 ? selectedDates[0] : getFirstAvailableDate(holidays)
    const days = type === "week" ? 5 : 20
    const newDates = getNextBusinessDays(firstDate, days, holidays)
    setSelectedDates(newDates)
    setPassType(type)
  }, [selectedDates, holidays])

  const handleBook = () => {
    if (!canBook) return

    setError(null)
    startTransition(async () => {
      try {
        const result = await createCheckoutSession({
          siteId: site.id,
          siteName: site.name,
          passType,
          seats,
          dates: selectedDates.map((d) => d.toISOString()),
        })

        if ("error" in result) {
          throw new Error(result.error)
        }

        if (result.url) {
          window.location.href = result.url
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      }
    })
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setPassType("day")
      setSelectedDates([])
      setSeats(1)
      setError(null)
      setPassExpanded(true)
      setCgvAccepted(false)
    }
    onOpenChange(newOpen)
  }

  if (!site) return null

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-3xl h-[100dvh] md:h-auto md:max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden">
        <VisuallyHidden>
          <DialogTitle>Réserver - {site.name}</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-start justify-between p-4 md:p-6 border-b border-border">
          <div>
            <h2 className="font-heading text-xl md:text-2xl font-bold">{site.name}</h2>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{site.address}</span>
            </div>
          </div>
          <button
            onClick={() => handleOpenChange(false)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Calendar */}
          <ScrollableCalendar
            selectedDates={selectedDates}
            onDatesChange={setSelectedDates}
            passType={passType}
            seats={seats}
            onSeatsChange={setSeats}
          />
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-border bg-card">
          {/* Pass Section */}
          <div className="p-4 md:px-6">
            <div className="rounded-2xl border border-border bg-muted/30 overflow-hidden">
              {/* Pass Header */}
              <button
                onClick={() => setPassExpanded(!passExpanded)}
                className="flex w-full items-center justify-between bg-[#f1e8dc] px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  <span className="font-semibold">Nos Pass</span>
                </div>
                <ChevronDown
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    passExpanded && "rotate-180"
                  )}
                />
              </button>

              {/* Pass Cards */}
              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  passExpanded ? "max-h-[300px]" : "max-h-0"
                )}
              >
                <div className="p-4 space-y-3">
                  {/* Pass Week */}
                  <button
                    onClick={() => handlePassSelect("week")}
                    className={cn(
                      "relative w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                      passType === "week"
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                        passType === "week"
                          ? "border-foreground bg-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {passType === "week" && <Check className="h-4 w-4 text-background" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{PASS_CONFIG.week.label}</div>
                      <div className="text-sm text-muted-foreground">{PASS_CONFIG.week.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{PASS_CONFIG.week.pricePerSeat}€ HT</div>
                      <div className="text-xs text-green-600 font-semibold">-{PASS_CONFIG.week.discount}%</div>
                    </div>
                  </button>

                  {/* Pass Month */}
                  <button
                    onClick={() => handlePassSelect("month")}
                    className={cn(
                      "relative w-full flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all",
                      passType === "month"
                        ? "border-foreground bg-foreground/5"
                        : "border-border hover:border-foreground/30"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors",
                        passType === "month"
                          ? "border-foreground bg-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {passType === "month" && <Check className="h-4 w-4 text-background" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold">{PASS_CONFIG.month.label}</div>
                      <div className="text-sm text-muted-foreground">{PASS_CONFIG.month.description}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{PASS_CONFIG.month.pricePerSeat}€ HT</div>
                      <div className="text-xs text-green-600 font-semibold">-{PASS_CONFIG.month.discount}%</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Price Summary & CTA */}
          <div className="p-4 md:px-6 pt-0">
            {selectedDates.length > 0 && (
              <div className="mb-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {passConfig.label} × {seats} poste{seats > 1 ? "s" : ""}
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
                <p className="text-xs text-muted-foreground pt-1">
                  {selectedDates.length === 1
                    ? format(selectedDates[0], "EEEE d MMMM yyyy", { locale: fr })
                    : `Du ${format(selectedDates[0], "d MMM", { locale: fr })} au ${format(
                        selectedDates[selectedDates.length - 1],
                        "d MMM yyyy",
                        { locale: fr }
                      )} (${selectedDates.length} jours ouvrés)`}
                </p>
              </div>
            )}

            {/* CGV Checkbox */}
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={cgvAccepted}
                onChange={(e) => setCgvAccepted(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-border accent-foreground"
              />
              <span className="text-xs text-muted-foreground">
                J&apos;accepte les{" "}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    setCgvModalOpen(true)
                  }}
                  className="text-primary underline hover:no-underline"
                >
                  Conditions Générales de Vente
                </button>
              </span>
            </label>

            <p className="text-xs text-muted-foreground mb-4">
              Des informations complémentaires vous seront demandées après le paiement.
            </p>

            {error && <p className="mb-4 text-sm text-red-500">{error}</p>}

            <Button
              className="w-full font-bold uppercase tracking-wide"
              size="lg"
              disabled={!canBook || isPending}
              onClick={handleBook}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                <>
                  <CreditCard className="mr-2 h-4 w-4" />
                  Réserver {canBook ? `- ${pricing.priceTTC.toFixed(2)}€ TTC` : ""}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <CGVModal open={cgvModalOpen} onOpenChange={setCgvModalOpen} />
  </>
  )
}
