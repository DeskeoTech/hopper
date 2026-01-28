"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { ClientNavigationItems } from "./client-navigation-items"
import { useClientLayout } from "./client-layout-provider"

export function ClientSidebar() {
  const { isDeskeoEmployee } = useClientLayout()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand text-brand-foreground md:flex">
      {/* Logo Header */}
      <div className="flex flex-col gap-0.5 border-b border-brand-foreground/10 px-6 py-5">
        <span className="font-header text-xl font-bold uppercase tracking-tight text-brand-foreground">
          HOPPER
        </span>
        <span className="text-sm text-brand-foreground/50">La Casa Deskeo</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <ClientNavigationItems />

        {/* Admin Link for Deskeo Employees */}
        {isDeskeoEmployee && (
          <div className="mt-4 border-t border-brand-foreground/10 pt-4">
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-[12px] px-3 py-2.5 text-sm font-medium text-brand-foreground/70 transition-all duration-200 hover:bg-brand-foreground/5 hover:text-brand-foreground"
            >
              <Settings className="h-5 w-5" />
              Espace Admin Deskeo
            </Link>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-brand-foreground/10 p-4">
        <div className="text-xs text-brand-foreground/40">
          <p>Hopper Coworking</p>
          <p>&copy; 2026 Deskeo</p>
          <p className="mt-1">v0.1.0</p>
        </div>
      </div>
    </aside>
  )
}
