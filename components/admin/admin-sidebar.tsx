"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, Calendar, Users, Settings, LayoutDashboard, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Sites", href: "/admin/sites", icon: Building2 },
  { name: "Réservations", href: "/admin/reservations", icon: Calendar },
  { name: "Utilisateurs", href: "/admin/users", icon: Users },
  { name: "Paramètres", href: "/admin/settings", icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex w-64 flex-col bg-[#1A1A1A] text-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#C5A572]">
          <MapPin className="h-5 w-5 text-[#1A1A1A]" />
        </div>
        <div>
          <span className="text-lg font-semibold tracking-tight">HOPPER</span>
          <span className="ml-1.5 text-xs text-white/60">by Deskeo</span>
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
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive ? "bg-[#C5A572] text-[#1A1A1A]" : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 p-4">
        <div className="text-xs text-white/40">
          <p>Hopper Coworking</p>
          <p>© 2026 Deskeo</p>
        </div>
      </div>
    </aside>
  )
}
