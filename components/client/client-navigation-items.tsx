"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { clientNavigation } from "@/lib/navigation"

interface ClientNavigationItemsProps {
  onItemClick?: () => void
  className?: string
}

export function ClientNavigationItems({ onItemClick, className }: ClientNavigationItemsProps) {
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
    <nav className={cn("space-y-1", className)}>
      {clientNavigation.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.name}
            href={getHref(item.href)}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium transition-all duration-200 text-[#F0E8DC]",
              isActive
                ? "bg-[#F0E8DC] text-[#1B1918]"
                : "opacity-70 hover:bg-[#F0E8DC]/5 hover:opacity-100"
            )}
          >
            <item.icon className="h-5 w-5" />
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
