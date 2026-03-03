"use client"

import { useEffect } from "react"
import { Coins, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTranslations, useLocale } from "next-intl"
import { markCreditsNotified } from "@/lib/actions/credits"
import type { UnnotifiedCredit } from "./account-page"

interface CreditsInfoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  credit?: UnnotifiedCredit | null
}

export function CreditsInfoModal({ open, onOpenChange, credit }: CreditsInfoModalProps) {
  const t = useTranslations("creditsTab.info")
  const locale = useLocale()

  useEffect(() => {
    if (open && credit?.id) {
      markCreditsNotified(credit.id)
    }
  }, [open, credit?.id])

  if (!open || !credit) return null

  const expirationDate = credit.expiration
    ? new Date(credit.expiration).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          "fixed z-50 bg-background",
          "inset-0",
          "md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-[400px] md:rounded-[20px]"
        )}
      >
        <div className="flex h-full flex-col items-center justify-center px-6 py-8 md:h-auto">
          {/* Close */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Icon */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-foreground/5">
            <Coins className="h-8 w-8 text-foreground/70" />
          </div>

          {/* Title */}
          <h1 className="mt-4 font-header text-xl font-bold uppercase tracking-tight text-center">
            {t("title")}
          </h1>

          {/* Reason */}
          {credit.reason && (
            <p className="mt-2 text-sm text-muted-foreground text-center">
              {credit.reason}
            </p>
          )}

          {/* Amount */}
          <p className="mt-4 text-4xl font-bold text-foreground">
            {credit.allocated_credits} <span className="text-lg font-medium text-muted-foreground">{t("credits")}</span>
          </p>

          {/* Expiration */}
          {expirationDate && (
            <p className="mt-4 text-sm text-muted-foreground text-center">
              {t("expiresOn")} {expirationDate}
            </p>
          )}

          {/* Button */}
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="mt-6 flex w-full items-center justify-center rounded-full bg-[#1B1918] px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90"
          >
            {t("understood")}
          </button>
        </div>
      </div>
    </>
  )
}
