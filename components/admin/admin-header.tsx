"use client"

import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MobileNav } from "./mobile-nav"

const pageTitles: Record<string, string> = {
  "/admin": "Accueil",
  "/admin/sites": "Sites",
  "/admin/reservations": "Réservations",
  "/admin/users": "Utilisateurs",
  "/admin/clients": "Clients",
  "/admin/tickets": "Tickets",
  "/admin/tests": "Test Stripe",
}

interface AdminHeaderProps {
  userEmail?: string | null
  siteName?: string | null
}

export function AdminHeader({ userEmail, siteName }: AdminHeaderProps) {
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
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between bg-[#f0e8dc] px-4 md:h-20 md:px-6">
      <div className="flex items-center gap-3">
        <MobileNav />
        <h1 className="type-h3 text-foreground">{title}</h1>
      </div>

      {/* Centered Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Image
          src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
          alt="Hopper Logo"
          width={400}
          height={160}
          className="h-14 w-auto md:h-20"
          priority
        />
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {siteName && (
          <span className="hidden truncate rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground sm:block sm:max-w-[150px]">
            {siteName}
          </span>
        )}
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
