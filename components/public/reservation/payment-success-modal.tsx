"use client"

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
          <DialogTitle>Paiement confirmé</DialogTitle>
        </VisuallyHidden>

        <div className="mx-auto mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Paiement confirmé !
          </h2>
          <p className="text-muted-foreground mb-6">
            Votre réservation est confirmée. Vous allez recevoir un email de
            confirmation avec toutes les informations nécessaires.
          </p>

          <div className="space-y-3">
            <Button
              onClick={handleAccessPortal}
              className="w-full gap-2"
              size="lg"
            >
              Accéder à mon espace
              <ExternalLink className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="w-full"
            >
              Continuer à explorer
            </Button>
          </div>

          {/* Meeting Room Credits CTA */}
          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3">
              Besoin de salles de réunion ? Achetez des crédits pour réserver
              des salles dans tous les espaces Hopper.
            </p>
            <Button
              onClick={handleBuyMeetingRoomCredits}
              variant="outline"
              className="w-full gap-2"
              size="lg"
            >
              <CreditCard className="h-4 w-4" />
              Acheter des crédits salle de réunion
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
