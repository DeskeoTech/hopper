"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { ClientNavigationItems } from "./client-navigation-items"
import { useClientLayout } from "./client-layout-provider"

export function ClientSidebar() {
  const { isDeskeoEmployee } = useClientLayout()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#1B1918] text-[#F0E8DC] md:flex">
      {/* Logo Header */}
      <div className="flex flex-col gap-0.5 border-b border-[#F0E8DC]/10 px-6 py-5">
        <span className="font-header text-xl font-bold uppercase tracking-tight text-[#F0E8DC]">
          HOPPER
        </span>
        <span className="text-sm text-[#F0E8DC]/60">La Casa Deskeo</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <ClientNavigationItems />
      </div>

      {/* Footer */}
      <div className="border-t border-[#F0E8DC]/10 p-4">
        {/* Admin Link for Deskeo Employees */}
        {isDeskeoEmployee && (
          <Link
            href="/admin"
            className="mb-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-[#F0E8DC]/60 transition-colors hover:bg-[#F0E8DC]/5 hover:text-[#F0E8DC]/80"
          >
            <Settings className="h-3.5 w-3.5 text-[#F0E8DC]" />
            Espace Admin Deskeo
          </Link>
        )}
        <div className="text-xs text-[#F0E8DC]/50">
          <p>Hopper Coworking</p>
          <p>&copy; 2026 Deskeo</p>
          <p className="mt-1">v0.1.0</p>
        </div>
      </div>
    </aside>
  )
}
