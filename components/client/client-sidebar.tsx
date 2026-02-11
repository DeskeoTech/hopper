"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Settings, Building2, Ticket, Crown } from "lucide-react"
import { ClientNavigationItems } from "./client-navigation-items"
import { useClientLayout } from "./client-layout-provider"

export function ClientSidebar() {
  const { user, credits, plan, isDeskeoEmployee } = useClientLayout()
  const searchParams = useSearchParams()

  // Preserve site param in navigation
  const siteParam = searchParams.get("site")
  const monCompteHref = siteParam ? `/mon-compte?site=${siteParam}` : "/mon-compte"

  // User info
  const firstName = user?.first_name || ""
  const lastName = user?.last_name || ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Utilisateur"
  const companyName = user?.companies?.name || null
  const planName = plan?.name || null
  const remainingCredits = credits?.remaining ?? 0

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-[#1B1918] text-[#F0E8DC] md:flex">
      {/* Logo Header */}
      <div className="flex h-16 items-center border-b border-[#F0E8DC]/10 px-6">
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4">
        <ClientNavigationItems />
      </div>

      {/* Footer */}
      <div className="border-t border-[#F0E8DC]/10 p-4">
        {/* User Info Block */}
        <Link
          href={monCompteHref}
          className="mb-4 block rounded-[12px] bg-[#F0E8DC]/10 p-3 transition-colors hover:bg-[#F0E8DC]/15"
        >
          <p className="font-header text-sm font-semibold text-[#F0E8DC]">{fullName}</p>
          {companyName && (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-[#F0E8DC]/60">
              <Building2 className="h-3 w-3" />
              <span>{companyName}</span>
            </div>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 text-xs text-[#F0E8DC]/60">
              <Ticket className="h-3 w-3" />
              <span>{remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}</span>
            </div>
            {planName && (
              <div className="flex items-center gap-1 text-xs text-[#F0E8DC]/60">
                <Crown className="h-3 w-3" />
                <span>{planName}</span>
              </div>
            )}
          </div>
        </Link>

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
          <div className="mb-2 flex gap-2">
            <Link href="/conditions-generales" className="transition-colors hover:text-[#F0E8DC]/80">CGV/CGU</Link>
            <span className="text-[#F0E8DC]/20">|</span>
            <Link href="/politique-de-confidentialite" className="transition-colors hover:text-[#F0E8DC]/80">Confidentialité</Link>
          </div>
          <p>Hopper Coworking</p>
          <p>&copy; 2026 Deskeo</p>
          <p className="mt-1">v0.1.0</p>
        </div>
      </div>
    </aside>
  )
}
