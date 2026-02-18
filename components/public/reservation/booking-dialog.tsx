"use client"

import { useState, useMemo, useCallback, useTransition, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { ScrollableCalendar } from "./scrollable-calendar"
import { CGVModal } from "./cgv-modal"
import { cn } from "@/lib/utils"
import { format, isSameDay } from "date-fns"
import { getDateLocale } from "@/lib/i18n/date-locale"
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
  },
  month: {
    label: "Pass Month",
    pricePerSeat: 300,
    days: 20,
    discount: 50,
    stripeMode: "subscription" as const,
  },
}

const TVA_RATE = 0.2

export const BOOKING_STATE_KEY = "hopper_booking_state"

export function BookingDialog({ site, open, onOpenChange, customerEmail, initialState }: BookingDialogProps) {
  const t = useTranslations("reservation")
  const locale = useLocale()
  const dateFnsLocale = getDateLocale(locale)
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
        setError(err instanceof Error ? err.message : t("bookingDialog.error"))
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
    if (selectedDates.length === 1) return format(selectedDates[0], "dd/MM/yyyy", { locale: dateFnsLocale })
    return t("bookingDialog.dateRangeTo", {
      start: format(selectedDates[0], "dd/MM/yyyy", { locale: dateFnsLocale }),
      end: format(selectedDates[selectedDates.length - 1], "dd/MM/yyyy", { locale: dateFnsLocale }),
    })
  }, [selectedDates, dateFnsLocale, t])

  if (!site) return null

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[100dvh] md:h-auto md:max-h-[90vh] p-0 gap-0 flex flex-col overflow-hidden rounded-3xl bg-[#F2E7DC]">
        <VisuallyHidden>
          <DialogTitle>{t("bookingDialog.title", { siteName: site.name })}</DialogTitle>
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
            {t("bookingDialog.tabInstant")}
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
            {t("bookingDialog.tabCustom")}
          </button>
        </div>

        {activeTab === "coworking" && (
          <>
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
                      {passType === "month"
                        ? t("bookingDialog.passSummaryMonth")
                        : t("bookingDialog.passSummary", { passLabel: passConfig.label, count: selectedDates.length })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {passType === "month"
                        ? t("bookingDialog.passSummaryMonthDate", { startDate: format(selectedDates[0], "dd/MM/yyyy", { locale: dateFnsLocale }) })
                        : dateRangeLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">
                      {passType === "month"
                        ? t("bookingDialog.priceHTMonth", { price: pricing.priceHT.toFixed(0) })
                        : t("bookingDialog.priceHT", { price: pricing.priceHT.toFixed(0) })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {passType === "month"
                        ? t("bookingDialog.priceTTCMonth", { price: pricing.priceTTC.toFixed(0) })
                        : t("bookingDialog.priceTTC", { price: pricing.priceTTC.toFixed(0) })}
                    </p>
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
                  {t("bookingDialog.cgvAccept")}{" "}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      setCgvModalOpen(true)
                    }}
                    className="text-foreground underline hover:no-underline"
                  >
                    {t("bookingDialog.cgvLink")}
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
                    {t("bookingDialog.loading")}
                  </>
                ) : (
                  <>{selectedDates.length > 0
                  ? (passType === "month"
                    ? t("bookingDialog.bookNowPriceMonth", { price: pricing.priceTTC.toFixed(0) })
                    : t("bookingDialog.bookNowPrice", { price: pricing.priceTTC.toFixed(0) }))
                  : t("bookingDialog.bookNow")}</>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                {t("bookingDialog.postPaymentInfo")}
              </p>
            </div>
          </>
        )}

        {activeTab === "residence" && (
          <div className="flex-1 flex items-center justify-center overflow-y-auto">
            <div className="p-6 sm:p-8 w-full max-w-md mx-auto">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold text-foreground text-center mb-4">
                {t("bookingDialog.residenceTitle")}
              </h2>
              <p className="text-2xl sm:text-3xl font-serif italic text-foreground mb-6 text-center">
                {t("bookingDialog.residenceTagline")}
              </p>
              <p className="text-base text-foreground leading-relaxed mb-8 text-center">
                {t("bookingDialog.residenceDesc1")}
                <br /><br />
                {t("bookingDialog.residenceDesc2")}
                <br /><br />
                {t("bookingDialog.residenceDesc3")}
              </p>
              <Button
                className="w-full rounded-full bg-[#1B1918] text-white font-bold text-base tracking-wide hover:bg-[#2D2B2A] h-12"
                onClick={() => window.open("https://www.deskeo.com/fr/contact/", "_blank")}
              >
                {t("bookingDialog.residenceContact")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    <CGVModal open={cgvModalOpen} onOpenChange={setCgvModalOpen} />
  </>
  )
}
