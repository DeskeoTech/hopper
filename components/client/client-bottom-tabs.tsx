"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { clientNavigation } from "@/lib/navigation"

// Short labels for mobile tabs
const shortLabels: Record<string, string> = {
  "Accueil": "Accueil",
  // "Fil d'actualité": "Actus", // TODO: réactiver quand la page sera enrichie
  "Boutique": "Boutique",
  "Mon Compte": "Compte",
}

export function ClientBottomTabs() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Preserve site param in navigation
  const siteParam = searchParams.get("site")
  const getHref = (href: string) => {
    if (siteParam) {
      return `${href}?site=${siteParam}`
    }
    return href
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#F0E8DC]/10 bg-[#1B1918] pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-stretch">
        {clientNavigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const shortLabel = shortLabels[item.name] || item.name

          return (
            <Link
              key={item.href}
              href={getHref(item.href)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 transition-colors text-[#F0E8DC]",
                isActive ? "opacity-100" : "opacity-60"
              )}
            >
              <item.icon className="h-5 w-5 text-[#F0E8DC]" />
              <span className="text-[10px] font-medium text-[#F0E8DC]">
                {shortLabel}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
