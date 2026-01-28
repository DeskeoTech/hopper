"use client"

import Image from "next/image"
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
    <header className="relative flex h-16 items-center justify-between bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="type-h3 text-foreground">{title}</h1>
      </div>

      {/* Centered Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Image
          src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
          alt="Hopper Logo"
          width={200}
          height={80}
          className="h-8 w-auto md:h-10"
          priority
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {userEmail && (
          <span className="hidden truncate type-small text-muted-foreground sm:block sm:max-w-[200px]">
            {userEmail}
          </span>
        )}
        <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          <span className="sr-only">Déconnexion</span>
        </Button>
      </div>
    </header>
  )
}
