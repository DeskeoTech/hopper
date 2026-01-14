"use client"

import { usePathname } from "next/navigation"
import { Bell, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard Hopper",
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
    <header className="flex h-16 items-center justify-between bg-card px-6">
      <h1 className="type-h3 text-foreground">{title}</h1>
    </header>
  )
}
