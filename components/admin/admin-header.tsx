"use client"

import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MobileNav } from "./mobile-nav"

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard Hopper",
  "/admin/sites": "Sites",
  "/admin/reservations": "Réservations",
  "/admin/users": "Utilisateurs",
}

interface AdminHeaderProps {
  userEmail?: string | null
}

export function AdminHeader({ userEmail }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()

  // Get title - check for dynamic routes
  let title = pageTitles[pathname] || "Dashboard"
  if (pathname.startsWith("/admin/sites/") && pathname !== "/admin/sites") {
    title = "Détails du site"
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between bg-card px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="type-h3 text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="type-small text-muted-foreground">{userEmail}</span>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          <span className="sr-only">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}
