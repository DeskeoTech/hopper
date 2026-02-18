"use client"

import { useTranslations } from "next-intl"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

interface HopperResidenceModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HopperResidenceModal({ open, onOpenChange }: HopperResidenceModalProps) {
  const t = useTranslations("hopperResidence")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden rounded-2xl [&>button]:hidden">
        <VisuallyHidden>
          <DialogTitle>{t("title")}</DialogTitle>
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
            {t("heading")}
          </h2>

          {/* Tagline */}
          <p className="font-editorial text-2xl sm:text-3xl text-foreground mb-6">
            {t("tagline")}
          </p>

          {/* Description */}
          <p className="text-base text-foreground leading-relaxed mb-8 text-justify">
            {t("description")}
          </p>

          {/* CTA Button */}
          <Button
            className="w-full rounded-full h-12 text-base font-bold"
            onClick={() => window.open("https://www.deskeo.com/fr/contact/", "_blank")}
          >
            {t("contact")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
