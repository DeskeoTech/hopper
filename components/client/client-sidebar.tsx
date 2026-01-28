"use client"

import { ClientNavigationItems } from "./client-navigation-items"
import { SiteSelector } from "./site-selector"

export function ClientSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand text-brand-foreground md:flex">
      {/* Site Selector Header */}
      <div className="flex h-16 items-center border-b border-brand-foreground/10 px-6">
        <SiteSelector />
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <ClientNavigationItems />
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
