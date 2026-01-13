"use client"

import { usePathname } from "next/navigation"
import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/sites": "Sites",
  "/admin/reservations": "Réservations",
  "/admin/users": "Utilisateurs",
  "/admin/settings": "Paramètres",
}

export function AdminHeader() {
  const pathname = usePathname()

  // Get title - check for dynamic routes
  let title = pageTitles[pathname] || "Dashboard"
  if (pathname.startsWith("/admin/sites/") && pathname !== "/admin/sites") {
    title = "Détails du site"
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-[#1A1A1A]/10 bg-white px-6">
      <h1 className="text-xl font-semibold text-[#1A1A1A]">{title}</h1>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/40" />
          <Input
            type="search"
            placeholder="Rechercher..."
            className="w-64 border-[#1A1A1A]/20 bg-[#F5F1EB] pl-9 placeholder:text-[#1A1A1A]/40 focus-visible:ring-[#C5A572]"
          />
        </div>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notifications</span>
        </Button>

        {/* User */}
        <Button variant="ghost" size="icon" className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
          <User className="h-5 w-5" />
          <span className="sr-only">Profil</span>
        </Button>
      </div>
    </header>
  )
}
