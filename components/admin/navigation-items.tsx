"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { adminNavigation } from "@/lib/navigation"

interface NavigationItemsProps {
  onItemClick?: () => void
  className?: string
}

export function NavigationItems({ onItemClick, className }: NavigationItemsProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("space-y-1", className)}>
      {adminNavigation.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-accent text-brand-accent-foreground"
                : "text-brand-foreground/70 hover:bg-brand-foreground/10 hover:text-brand-foreground"
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
