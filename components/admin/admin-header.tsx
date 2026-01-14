"use client"

import { usePathname } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { signOut } from "@/app/login/actions"

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard Hopper",
  "/admin/sites": "Sites",
  "/admin/reservations": "Réservations",
  "/admin/users": "Utilisateurs",
  "/admin/settings": "Paramètres",
}

interface AdminHeaderProps {
  userEmail?: string | null
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const pathname = usePathname()

  // Get title - check for dynamic routes
  let title = pageTitles[pathname] || "Dashboard"
  if (pathname.startsWith("/admin/sites/") && pathname !== "/admin/sites") {
    title = "Détails du site"
  }

  return (
    <header className="flex h-16 items-center justify-between bg-card px-6">
      <h1 className="type-h3 text-foreground">{title}</h1>

      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="type-small text-muted-foreground">{userEmail}</span>
        )}
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm">
            <LogOut className="size-4" />
            <span className="sr-only">Déconnexion</span>
          </Button>
        </form>
      </div>
    </header>
  )
}
