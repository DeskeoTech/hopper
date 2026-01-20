"use client"

import { usePathname, useRouter } from "next/navigation"
import { LogOut, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ClientMobileNav } from "./client-mobile-nav"
import { useClientLayout } from "./client-layout-provider"
import Link from "next/link"

const pageTitles: Record<string, string> = {
  "/salles": "Salles",
  "/postes": "Postes de travail",
  "/compte": "Mon compte",
  "/actualites": "Fil d'actualité",
}

export function ClientHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAdmin } = useClientLayout()

  const title = pageTitles[pathname] || "Hopper"

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  return (
    <header className="flex h-16 items-center justify-between bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <ClientMobileNav />
        <h1 className="type-h3 text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {isAdmin && (
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/admin">
              <Shield className="mr-1.5 size-4" />
              Admin
            </Link>
          </Button>
        )}
        {user.email && (
          <span className="hidden truncate type-small text-muted-foreground sm:block sm:max-w-[200px]">
            {user.email}
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
