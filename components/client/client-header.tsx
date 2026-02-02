"use client"

import Image from "next/image"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { User, Building2, Ticket, Crown, Settings, ChevronRight } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useClientLayout } from "./client-layout-provider"

export function ClientHeader() {
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
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between bg-background px-4 md:h-20">
      {/* Spacer for centering logo */}
      <div className="w-10" />

      {/* Centered Logo - Clickable to home */}
      <Link href="/compte" className="transition-opacity hover:opacity-80">
        <Image
          src="https://7abaef3fdedbe876fc93938b593e38d3.cdn.bubble.io/f1769541414085x621762003247008800/pasted-image-1766415040793%20%281%29.png"
          alt="Hopper Logo"
          width={400}
          height={160}
          className="h-8 w-auto md:h-12"
          priority
        />
      </Link>

      {/* Profile Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 transition-colors hover:bg-foreground/10">
            <User className="h-5 w-5 text-foreground/70" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-72 rounded-[16px] bg-card p-0 border-0 shadow-none"
        >
          {/* User Info Section */}
          <div className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <User className="h-6 w-6 text-foreground/70" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-header text-sm font-bold uppercase tracking-tight truncate">
                  {fullName}
                </p>
                {companyName && (
                  <p className="mt-0.5 text-xs text-muted-foreground truncate">
                    {companyName}
                  </p>
                )}
              </div>
            </div>

            {/* Credits & Plan */}
            <div className="mt-4 flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-full bg-foreground/5 px-3 py-2">
                <Ticket className="h-4 w-4 text-foreground/70" />
                <span className="text-xs font-medium">
                  {remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}
                </span>
              </div>
              {planName && (
                <div className="flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-2">
                  <Crown className="h-4 w-4 text-foreground/70" />
                  <span className="text-xs font-medium">{planName}</span>
                </div>
              )}
            </div>
          </div>

          {/* Links Section */}
          <div className="border-t border-foreground/5">
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
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
