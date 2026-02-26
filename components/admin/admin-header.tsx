"use client"

import { useState, useCallback } from "react"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { MobileNav } from "./mobile-nav"
import { NotificationsModal } from "./notifications-modal"

const pageTitles: Record<string, string> = {
  "/admin": "Accueil",
  "/admin/sites": "Sites",
  "/admin/reservations": "Réservations",
  "/admin/users": "Utilisateurs",
  "/admin/clients": "Clients",
  "/admin/tickets": "Tickets",
  "/admin/compte": "Mon Compte",
}

interface AdminHeaderProps {
  userEmail?: string | null
  siteName?: string | null
  siteId?: string | null
  adminId?: string | null
}

export function AdminHeader({ userEmail, siteName, siteId, adminId }: AdminHeaderProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

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

  const handleUnreadCountChange = useCallback((count: number) => {
    setUnreadCount(count)
  }, [])

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
        {userEmail && (
          <span className="hidden truncate type-small text-muted-foreground sm:block sm:max-w-[200px]">
            {userEmail}
          </span>
        )}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="relative"
          onClick={() => setNotificationsOpen(true)}
        >
          <Bell className="size-4" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
          <span className="sr-only">Déconnexion</span>
        </Button>
      </div>

      <NotificationsModal
        open={notificationsOpen}
        onOpenChange={setNotificationsOpen}
        siteId={siteId ?? null}
        userEmail={userEmail ?? null}
        onUnreadCountChange={handleUnreadCountChange}
      />
    </header>
  )
}
