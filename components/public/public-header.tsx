"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { CityFilter } from "@/components/public/reservation/city-filter"
import { LanguageSwitcher } from "@/components/public/language-switcher"

interface PublicHeaderProps {
  selectedCity?: "paris" | "lyon" | null
  onCityChange?: (city: "paris" | "lyon" | null) => void
}

const NOOP_CITY_CHANGE = () => {}

export function PublicHeader({ selectedCity = null, onCityChange }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-black/10 bg-background">
      <div className="flex h-16 md:h-20 items-center justify-between px-4 lg:px-6 xl:px-8">
        {/* Left - Language Switcher + Filter */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <CityFilter selectedCity={selectedCity} onCityChange={onCityChange || NOOP_CITY_CHANGE} />
        </div>

        {/* Center - Logo */}
        <Link href="/reservation" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center leading-none">
          <span className="font-heading text-2xl md:text-3xl font-black tracking-tight">HOPPER</span>
          <span className="text-[10px] md:text-xs text-muted-foreground tracking-wide italic">Coworking</span>
        </Link>

        {/* Right - Navigation + Contact + Profile */}
        <div className="flex items-center gap-4">
          <nav className="hidden lg:flex items-center gap-6">
            <a
              href="https://www.deskeo.com/fr/work-spaces/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
            >
              Work Spaces
            </a>
            <a
              href="https://www.deskeo.com/fr/design-build/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
            >
              Design & Build
            </a>
            <a
              href="https://www.deskeo.com/fr/meetings-events/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-foreground hover:text-foreground/70 transition-colors"
            >
              Meetings & Events
            </a>
          </nav>
          <a
            href="https://www.deskeo.com/fr/contact/"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center justify-center rounded-full bg-[#1B1918] px-4 h-9 text-sm font-semibold text-white hover:bg-[#1B1918]/90 transition-colors"
          >
            CONTACT
          </a>
          <Link
            href="/compte"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1B1918] text-white hover:bg-[#1B1918]/90 transition-colors"
          >
            <User className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  )
}
