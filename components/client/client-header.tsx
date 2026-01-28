"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ClientMobileNav } from "./client-mobile-nav"

interface ClientHeaderProps {
  userEmail?: string | null
}

export function ClientHeader({ userEmail }: ClientHeaderProps) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center justify-between bg-[#F1E8DC] px-4 md:h-20">
      {/* Mobile Nav - Left */}
      <div className="md:hidden">
        <ClientMobileNav />
      </div>
      {/* Spacer for desktop */}
      <div className="hidden md:block md:w-[200px]" />

      {/* Centered Logo */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Image
          src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
          alt="Hopper Logo"
          width={400}
          height={160}
          className="h-8 w-auto md:h-16"
          priority
        />
      </div>

      {/* User menu - Right */}
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
