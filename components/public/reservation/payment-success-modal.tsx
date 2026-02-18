"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { CheckCircle, ExternalLink, CreditCard } from "lucide-react"

interface PaymentSuccessModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userEmail?: string
}

const MEETING_ROOM_CREDITS_URL = "https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01"

export function PaymentSuccessModal({ open, onOpenChange, userEmail }: PaymentSuccessModalProps) {
  const t = useTranslations("paymentSuccess")

  const handleAccessPortal = () => {
    window.open("https://app.hopper-coworking.com", "_blank")
    onOpenChange(false)
  }

  const handleBuyMeetingRoomCredits = () => {
    const url = userEmail
      ? `${MEETING_ROOM_CREDITS_URL}?prefilled_email=${encodeURIComponent(userEmail)}`
      : MEETING_ROOM_CREDITS_URL
    window.open(url, "_blank")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md text-center p-8">
        <VisuallyHidden>
          <DialogTitle>{t("title")}</DialogTitle>
        </VisuallyHidden>

        <div className="mx-auto mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            {t("heading")}
          </h2>
          <p className="text-muted-foreground mb-6">
            {t("description")}
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleAccessPortal}
              className="w-full rounded-full gap-2"
              size="lg"
            >
              {t("accessPortal")}
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full rounded-full"
            >
              {t("continueExploring")}
            </Button>
          </div>

          {/* Meeting Room Credits CTA */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              {t("meetingRoomCta")}
            </p>
            <Button
              onClick={handleBuyMeetingRoomCredits}
              variant="outline"
              className="w-full rounded-full gap-2"
              size="lg"
            >
              <CreditCard className="h-4 w-4" />
              {t("buyCredits")}
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
