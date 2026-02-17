"use client"

import { useState, useMemo, useCallback, useTransition, useEffect } from "react"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ScrollableCalendar } from "./scrollable-calendar"
import { CGVModal } from "./cgv-modal"
import { cn } from "@/lib/utils"
import { format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import type { Site } from "@/lib/types/database"
import { createCheckoutSession } from "@/lib/actions/stripe"

interface SiteWithPhotos extends Site {
  photos: string[]
  capacity: number
}

export interface SavedBookingState {
  siteId: string
  passType: PassType
  seats: number
  selectedDates: string[]
  cgvAccepted: boolean
}

interface BookingDialogProps {
  site: SiteWithPhotos | null
  open: boolean
  onOpenChange: (open: boolean) => void
  customerEmail?: string
  initialState?: SavedBookingState | null
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
    description: "5 jours",
  },
  month: {
    label: "Pass Month",
    pricePerSeat: 300,
    days: 20,
    discount: 50,
    stripeMode: "subscription" as const,
    description: "20 jours",
  },
}

const TVA_RATE = 0.2

export const BOOKING_STATE_KEY = "hopper_booking_state"

export function BookingDialog({ site, open, onOpenChange, customerEmail, initialState }: BookingDialogProps) {
  const [activeTab, setActiveTab] = useState<"coworking" | "residence">("coworking")
  const [passType, setPassType] = useState<PassType>("day")
  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [seats, setSeats] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [cgvAccepted, setCgvAccepted] = useState(false)
  const [cgvModalOpen, setCgvModalOpen] = useState(false)

  // Restore state from initialState (e.g. after Stripe cancel)
  useEffect(() => {
    if (initialState) {
      setPassType(initialState.passType)
      setSeats(initialState.seats)
      setSelectedDates(initialState.selectedDates.map((d) => new Date(d)))
      setCgvAccepted(initialState.cgvAccepted)
    }
  }, [initialState])

  const passConfig = PASS_CONFIG[passType]

  const pricing = useMemo(() => {
    const days = passType === "day" ? selectedDates.length || 1 : 1
    const priceHT = passConfig.pricePerSeat * seats * days
    const tva = priceHT * TVA_RATE
    const priceTTC = priceHT + tva
    return { priceHT, tva, priceTTC }
  }, [passConfig.pricePerSeat, seats, passType, selectedDates.length])

  // Stable callback for toggling individual dates (day mode)
  const handleToggleDate = useCallback((date: Date) => {
    setSelectedDates((curr) => {
      const exists = curr.some((d) => isSameDay(d, date))
      if (exists) return curr.filter((d) => !isSameDay(d, date))
      return [...curr, date].sort((a, b) => a.getTime() - b.getTime())
    })
  }, [])

  const canBook = selectedDates.length > 0 && site && cgvAccepted

  const handleBook = useCallback(() => {
    if (!canBook || !site) return

    setError(null)
    startTransition(async () => {
      try {
        const result = await createCheckoutSession({
          siteId: site.id,
          siteName: site.name,
          passType,
          seats,
          dates: selectedDates.map((d) => d.toISOString()),
          days: passType === "day" ? selectedDates.length : undefined,
          weeks: passType === "week" ? 1 : undefined,
          includeTax: true,
          customerEmail,
        })

        if ("error" in result) {
          throw new Error(result.error)
        }

        if (result.url) {
          // Save booking state before redirecting to Stripe
          localStorage.setItem(BOOKING_STATE_KEY, JSON.stringify({
            siteId: site.id,
            passType,
            seats,
            selectedDates: selectedDates.map((d) => d.toISOString()),
            cgvAccepted,
          }))
          window.location.href = result.url
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue")
      }
    })
  }, [canBook, site, passType, seats, selectedDates, customerEmail, cgvAccepted])

  const handleOpenChange = useCallback((newOpen: boolean) => {
    if (!newOpen) {
      setActiveTab("coworking")
      setPassType("day")
      setSelectedDates([])
      setSeats(1)
      setError(null)
      setCgvAccepted(false)
    }
    onOpenChange(newOpen)
  }, [onOpenChange])

  const dateRangeLabel = useMemo(() => {
    if (selectedDates.length === 0) return ""
    if (selectedDates.length === 1) return format(selectedDates[0], "dd/MM/yyyy", { locale: fr })
    return `${format(selectedDates[0], "dd/MM/yyyy", { locale: fr })} au ${format(selectedDates[selectedDates.length - 1], "dd/MM/yyyy", { locale: fr })}`
  }, [selectedDates])

  if (!site) return null

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[100dvh] md:h-auto md:max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-3xl bg-[#F2E7DC]">
        <VisuallyHidden>
          <DialogTitle>Réserver - {site.name}</DialogTitle>
        </VisuallyHidden>

        {/* Close button */}
        <button
          onClick={() => handleOpenChange(false)}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-muted/80 hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Tabs */}
        <div className="flex border-b border-border/40 mt-4">
          <button
            onClick={() => setActiveTab("coworking")}
            className={cn(
              "flex-1 pb-3 text-center text-base font-medium transition-colors",
              activeTab === "coworking"
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Réservation Instantanée
          </button>
          <button
            onClick={() => setActiveTab("residence")}
            className={cn(
              "flex-1 pb-3 text-center text-base font-medium transition-colors",
              activeTab === "residence"
                ? "text-foreground border-b-2 border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Offre Sur-Mesure
          </button>
        </div>

        {/* Site info */}
        <div className="px-6 pt-4 pb-4">
          <h2 className="font-heading text-xl font-bold uppercase tracking-tight">{site.name}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{site.address}</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="rounded-2xl bg-white p-4 md:p-5">
            <ScrollableCalendar
              selectedDates={selectedDates}
              onDatesChange={setSelectedDates}
              onToggleDate={handleToggleDate}
              passType={passType}
              onPassTypeChange={setPassType}
              seats={seats}
              onSeatsChange={setSeats}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-border/40 px-6 py-4 space-y-4">
          {/* Pass summary */}
          {selectedDates.length > 0 && (
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">
                  {passConfig.label} ({selectedDates.length} jour{selectedDates.length > 1 ? "s" : ""})
                </p>
                <p className="text-sm text-muted-foreground">{dateRangeLabel}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{pricing.priceHT.toFixed(0)}€ HT</p>
                <p className="text-sm text-muted-foreground">{pricing.priceTTC.toFixed(0)}€ TTC</p>
              </div>
            </div>
          )}

          {/* CGV Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <button
              type="button"
              onClick={() => setCgvAccepted(prev => !prev)}
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                cgvAccepted
                  ? "border-foreground bg-foreground"
                  : "border-muted-foreground/40"
              )}
            >
              {cgvAccepted && (
                <svg className="h-3 w-3 text-background" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
            <span className="text-sm text-muted-foreground">
              J&apos;accepte les{" "}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  setCgvModalOpen(true)
                }}
                className="text-foreground underline hover:no-underline"
              >
                conditions générales de vente
              </button>
            </span>
          </label>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* CTA Button */}
          <Button
            className="w-full rounded-full bg-[#1B1918] text-white font-bold text-base tracking-wide hover:bg-[#2D2B2A] h-12"
            disabled={!canBook || isPending}
            onClick={handleBook}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              <>Réserver maintenant{canBook ? ` : ${pricing.priceTTC.toFixed(0)}€ TTC` : ""}</>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Des informations complémentaires vous seront demandées après le paiement sur votre espace personnel Hopper
          </p>
        </div>
      </DialogContent>
    </Dialog>

    <CGVModal open={cgvModalOpen} onOpenChange={setCgvModalOpen} />
  </>
  )
}
