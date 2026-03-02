"use client"

import { useState } from "react"
import { LogOut, MessageCircle, Loader2, Building2, Ticket, Crown, User, Package, Coins, Receipt, ArrowLeft } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"
import { MesCoordonneesTab } from "./mes-coordonnees-tab"
import { ContractsListSection } from "./contracts-list-section"
import { MesCreditsTab } from "./mes-credits-tab"
import { FacturationTab } from "./facturation-tab"
import { SupportTab } from "./support-tab"
import { createClient } from "@/lib/supabase/client"
import { useTranslations } from "next-intl"
import type { ContractForDisplay } from "@/lib/types/database"

interface MonComptePageProps {
  contracts: ContractForDisplay[]
}

export function MonComptePage({ contracts }: MonComptePageProps) {
  const { user, credits, plan, isAdmin } = useClientLayout()
  const t = useTranslations("common")
  const tAccount = useTranslations("account")
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loggingOut, setLoggingOut] = useState(false)
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Admin-only tabs
  const adminOnlyTabs = ["forfait", "facturation"]

  // Sanitize tab param: non-admin cannot access admin-only tabs
  const tabParam = searchParams.get("tab")
  const initialTab = tabParam && (!adminOnlyTabs.includes(tabParam) || isAdmin)
    ? tabParam
    : "coordonnees"
  const [activeTab, setActiveTab] = useState(initialTab)

  // Preserve site param in navigation
  const siteParam = searchParams.get("site")
  const accueilHref = siteParam ? `/compte?site=${siteParam}` : "/compte"

  // User info
  const firstName = user?.first_name || ""
  const lastName = user?.last_name || ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || t("user")
  const companyName = user?.companies?.name || null
  const planName = plan?.name || null
  const remainingCredits = credits?.remaining ?? 0

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  // Menu items for mobile grid
  const menuItems = [
    { value: "coordonnees", label: tAccount("tabs.profile"), icon: User },
    { value: "forfait", label: tAccount("tabs.plan"), icon: Package },
    { value: "credits", label: tAccount("tabs.credits"), icon: Coins },
    { value: "facturation", label: tAccount("tabs.billing"), icon: Receipt },
    { value: "contact", label: tAccount("tabs.support"), icon: MessageCircle },
  ]

  // Filter out admin-only tabs for non-admin users
  const visibleMenuItems = isAdmin
    ? menuItems
    : menuItems.filter((item) => !adminOnlyTabs.includes(item.value))

  return (
    <>
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-4 md:px-0 md:pt-6">
      {/* Back to home + logout */}
      <div className="flex items-center justify-between">
        <Link
          href={accueilHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
        >
          <div className="flex h-9 w-9 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-foreground/5">
            <ArrowLeft className="h-4 w-4" />
          </div>
          <span className="hidden sm:inline">{t("backToHome")}</span>
        </Link>

        {/* Logout button */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex shrink-0 items-center gap-2 rounded-full bg-foreground/5 px-4 py-2.5 sm:px-3 sm:py-2 text-sm sm:text-xs font-medium text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
          <span>{t("logout")}</span>
        </button>
      </div>

      {/* User Info Block - Mobile only */}
      <div className="flex items-start gap-4">
        <div className="md:hidden flex-1 rounded-[16px] bg-card p-5">
          <p className="font-header text-xl font-bold text-foreground">{fullName}</p>
          {companyName && (
            <div className="mt-1.5 flex items-center gap-2 text-base text-foreground/70">
              <Building2 className="h-4 w-4" />
              <span>{companyName}</span>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-1.5 text-sm font-medium text-foreground/70">
              <Ticket className="h-4 w-4" />
              <span>{remainingCredits} {remainingCredits !== 1 ? t("credits") : t("credit")}</span>
            </div>
            {planName && (
              <div className="flex items-center gap-2 rounded-full bg-foreground/5 px-3 py-1.5 text-sm font-medium text-foreground/70">
                <Crown className="h-4 w-4" />
                <span>{planName}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: 2-column grid */}
        <div className="grid grid-cols-2 gap-2.5 md:hidden">
          {visibleMenuItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveTab(item.value)}
              className={cn(
                "flex items-center gap-3 rounded-[14px] px-4 py-3.5 text-left transition-all",
                activeTab === item.value
                  ? "bg-foreground text-background"
                  : "bg-card hover:bg-card/80"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium truncate">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Desktop: horizontal tabs */}
        <div className="hidden md:block">
          <TabsList className="inline-flex h-auto w-full gap-1 p-1 justify-start">
            <TabsTrigger value="coordonnees" className="whitespace-nowrap px-3 py-2 text-sm">
              {tAccount("tabs.profile")}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="forfait" className="whitespace-nowrap px-3 py-2 text-sm">
                {tAccount("tabs.plan")}
              </TabsTrigger>
            )}
            <TabsTrigger value="credits" className="whitespace-nowrap px-3 py-2 text-sm">
              {tAccount("tabs.credits")}
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger value="facturation" className="whitespace-nowrap px-3 py-2 text-sm">
                {tAccount("tabs.billing")}
              </TabsTrigger>
            )}
            <TabsTrigger value="contact" className="whitespace-nowrap px-3 py-2 text-sm">
              {tAccount("tabs.support")}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="coordonnees" className="mt-6">
          <MesCoordonneesTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="forfait" className="mt-6">
            <ContractsListSection contracts={contracts} />
          </TabsContent>
        )}

        <TabsContent value="credits" className="mt-6">
          <MesCreditsTab />
        </TabsContent>

        {isAdmin && (
          <TabsContent value="facturation" className="mt-6">
            <FacturationTab />
          </TabsContent>
        )}

        <TabsContent value="contact" className="mt-6">
          <SupportTab />
        </TabsContent>
      </Tabs>
    </div>

    {/* Logout Confirmation Dialog */}
    <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
      <AlertDialogContent className="bg-background sm:rounded-[20px]">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-header text-lg font-bold uppercase tracking-tight">
            {t("logout")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("logoutConfirm")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-destructive/90 disabled:opacity-50"
          >
            {loggingOut ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("loggingOut")}
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                {t("logout")}
              </>
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
