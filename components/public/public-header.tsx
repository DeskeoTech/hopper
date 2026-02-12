"use client"

import { useState } from "react"
import Link from "next/link"
import { User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CityFilter } from "@/components/public/reservation/city-filter"
import { PricingModal } from "@/components/public/reservation/pricing-modal"

interface PublicHeaderProps {
  selectedCity?: "paris" | "lyon" | null
  onCityChange?: (city: "paris" | "lyon" | null) => void
}

export function PublicHeader({ selectedCity = null, onCityChange }: PublicHeaderProps) {
  const [pricingOpen, setPricingOpen] = useState(false)

  return (
    <>
      {/* Promotional Banner - Black */}
      <div className="bg-[#1B1918] text-[#F1E8DC]">
        <div className="hidden sm:block">
          <div className="flex items-center justify-center px-4 py-2.5 text-[11px] font-medium tracking-wide uppercase">
            Découvrez les offres Deskeo pour vos événements, aménagements et bureaux
          </div>
        </div>
        <div className="sm:hidden overflow-hidden">
          <div className="animate-marquee whitespace-nowrap py-2.5 text-[11px] font-medium tracking-wide uppercase">
            Découvrez les offres Deskeo pour vos événements, aménagements et bureaux •
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left - Filter Button */}
          <CityFilter selectedCity={selectedCity} onCityChange={onCityChange || (() => {})} />

          {/* Center - Logo */}
          <Link href="/reservation" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-none">
            <span className="font-heading text-xl font-black tracking-tight">HOPPER</span>
            <span className="text-[10px] text-muted-foreground tracking-wide">Coworking</span>
          </Link>

          {/* Right - Pricing + Login */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPricingOpen(true)}
              className="hidden sm:inline-flex text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1"
            >
              Nos tarifs
            </button>
            <Link href="/login">
              <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                <User className="h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <PricingModal open={pricingOpen} onOpenChange={setPricingOpen} />
    </>
  )
}
