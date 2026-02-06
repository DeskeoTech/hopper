"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { User, Building2, Ticket, Settings, ChevronRight, MessageCircleQuestion } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClientLayout } from "./client-layout-provider"

export function ClientHeader() {
  const { user, credits, isDeskeoEmployee, canManageCompany } = useClientLayout()
  const searchParams = useSearchParams()

  // Preserve site param in navigation
  const siteParam = searchParams.get("site")
  const monCompteHref = siteParam ? `/mon-compte?site=${siteParam}` : "/mon-compte"

  // User info
  const firstName = user?.first_name || ""
  const lastName = user?.last_name || ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Utilisateur"
  const companyName = user?.companies?.name || null
  const remainingCredits = credits?.remaining ?? 0

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-end bg-background px-4 md:h-20">
      {/* Centered Logo - Clickable to home */}
      <Link href="/compte" className="absolute left-1/2 -translate-x-1/2 transition-opacity hover:opacity-80">
        <Image
          src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
          alt="Hopper Logo"
          width={400}
          height={160}
          className="h-14 w-auto md:h-20"
          priority
        />
      </Link>

      {/* User Info Block + Profile Dropdown */}
      <div className="flex items-center gap-3">
        {/* User Name & Company - Desktop only */}
        <div className="hidden md:block text-right">
          <p className="font-header text-sm font-bold uppercase tracking-tight">
            {fullName}
          </p>
          {companyName && (
            <p className="text-xs text-muted-foreground">{companyName}</p>
          )}
        </div>

        {/* Credits Badge - Desktop only */}
        <div className="hidden md:flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5">
          <Ticket className="h-4 w-4 text-foreground/70" />
          <span className="text-xs font-medium">
            {remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10"
              suppressHydrationWarning
            >
              <User className="h-5 w-5 text-foreground/70" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-56 rounded-[16px] bg-card p-0 border-0 shadow-none"
          >
            {/* Credits - Mobile only */}
            <div className="flex md:hidden items-center gap-3 px-4 py-3 border-b border-foreground/5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <Ticket className="h-4 w-4 text-foreground/70" />
              </div>
              <span className="text-sm font-medium">
                {remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Mon Compte Link */}
            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link
                href={monCompteHref}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                    <User className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span>Mon Compte</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </DropdownMenuItem>

            {/* Company Management Link for Company Admins */}
            {canManageCompany && (
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link
                  href="/entreprise"
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors border-t border-foreground/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                      <Building2 className="h-4 w-4 text-foreground/70" />
                    </div>
                    <span>Gérer mon entreprise</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </DropdownMenuItem>
            )}

            {/* Contact Support Link */}
            <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
              <Link
                href={siteParam ? `/mon-compte?tab=contact&site=${siteParam}` : "/mon-compte?tab=contact"}
                className="flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors border-t border-foreground/5"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                    <MessageCircleQuestion className="h-4 w-4 text-foreground/70" />
                  </div>
                  <span>Contact support</span>
                </div>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </DropdownMenuItem>

            {/* Admin Link for Deskeo Employees */}
            {isDeskeoEmployee && (
              <DropdownMenuItem asChild className="p-0 focus:bg-transparent">
                <Link
                  href="/admin"
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors border-t border-foreground/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                      <Settings className="h-4 w-4 text-foreground/70" />
                    </div>
                    <span>Espace Admin</span>
                  </div>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
