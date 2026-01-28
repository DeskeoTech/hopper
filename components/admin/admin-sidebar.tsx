"use client"

import { LogOut, MapPin } from "lucide-react"
import { useRouter } from "next/navigation"
import { NavigationItems } from "./navigation-items"
import { createClient } from "@/lib/supabase/client"

export function AdminSidebar() {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand text-brand-foreground md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-brand-foreground/10 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-brand-accent">
          <MapPin className="h-5 w-5 text-brand-accent-foreground" />
        </div>
        <div>
          <span className="font-header text-lg">HOPPER</span>
          <span className="ml-1.5 text-xs text-brand-foreground/60">by Deskeo</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <NavigationItems />
      </div>

      {/* Footer */}
      <div className="border-t border-brand-foreground/10 p-4">
        <button
          onClick={handleLogout}
          className="mb-3 flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-brand-foreground/50 transition-colors hover:bg-brand-foreground/5 hover:text-brand-foreground/70"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Déconnexion</span>
        </button>
        <div className="text-xs text-brand-foreground/40">
          <p>Hopper Coworking</p>
          <p>© 2026 Deskeo</p>
          <p className="mt-1">v0.1.0</p>
        </div>
      </div>
    </aside>
  )
}
