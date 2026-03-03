"use client"

import Link from "next/link"
import { User } from "lucide-react"
import { NavigationItems } from "./navigation-items"

export function AdminSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-brand text-brand-foreground md:flex">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-brand-foreground/10 px-6">
        <Link href="/admin" className="flex items-baseline gap-1.5">
          <span className="font-header text-xl text-[#F1E8DC]">HOPPER</span>
          <span className="font-editorial text-sm text-[#F1E8DC]/80">coworking</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <NavigationItems />
      </div>

      {/* Footer */}
      <div className="border-t border-brand-foreground/10 p-4">
        <Link
          href="/compte"
          className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-brand-foreground/50 transition-colors hover:bg-brand-foreground/5 hover:text-brand-foreground/70"
        >
          <User className="h-3.5 w-3.5" />
          Interface client
        </Link>
        <div className="text-xs text-brand-foreground/40">
          <p>Hopper Coworking</p>
          <p>© 2026 Deskeo</p>
          <p className="mt-1">v0.1.0</p>
        </div>
      </div>
    </aside>
  )
}
