"use client"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface HopperResidenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HopperResidenceModal({ open, onOpenChange }: HopperResidenceModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>Hopper Residence</DialogTitle>
        </VisuallyHidden>

        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 h-8 w-8 rounded-full bg-background/80 hover:bg-background flex items-center justify-center transition-colors border border-border"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6 sm:p-8 bg-[#D4C4B0]">
          {/* Header */}
          <h2 className="font-heading text-2xl sm:text-3xl font-bold text-foreground mb-4">
            HOPPER RESIDENCE
          </h2>

          {/* Tagline */}
          <p className="font-editorial text-2xl sm:text-3xl text-foreground mb-6">
            Votre poste fixe, en illimité
          </p>

          {/* Description */}
          <p className="text-base text-foreground leading-relaxed mb-8 text-justify">
            Profitez d&apos;un poste de travail attitré dans les espaces Hopper
            Residence, avec accès à tous les espaces Hopper Lounge. Votre
            abonnement inclut deux boissons offertes par jour et un casier
            personnel. Parfait pour s&apos;installer durablement, créer votre
            routine et vous sentir &quot;chez vous&quot; au bureau.
          </p>

          {/* CTA Button */}
          <Button
            className="w-full h-12 text-base font-bold"
            onClick={() => window.open("https://www.deskeo.com/fr/contact/", "_blank")}
          >
            Contact
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
