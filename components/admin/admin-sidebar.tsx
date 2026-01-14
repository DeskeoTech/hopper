"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, Calendar, Users, Settings, LayoutDashboard, MapPin, Home } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Accueil", href: "/admin", icon: Home },
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Sites", href: "/admin/sites", icon: Building2 },
  { name: "Réservations", href: "/admin/reservations", icon: Calendar },
  { name: "Utilisateurs", href: "/admin/users", icon: Users },
  { name: "Paramètres", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col bg-brand text-brand-foreground">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-brand-foreground/10 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-accent">
          <MapPin className="h-5 w-5 text-brand-accent-foreground" />
        </div>
        <div>
          <span className="font-header text-lg">HOPPER</span>
          <span className="ml-1.5 text-xs text-brand-foreground/60">by Deskeo</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-brand-accent text-brand-accent-foreground" : "text-brand-foreground/70 hover:bg-brand-foreground/10 hover:text-brand-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-brand-foreground/10 p-4">
        <div className="text-xs text-brand-foreground/40">
          <p>Hopper Coworking</p>
          <p>© 2026 Deskeo</p>
        </div>
      </div>
    </aside>
  )
}
