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
import { MonForfaitTab } from "./mon-forfait-tab"
import { MesCreditsTab } from "./mes-credits-tab"
import { MonEntrepriseTab } from "./mon-entreprise-tab"
import { FacturationTab } from "./facturation-tab"
import { SupportTab } from "./support-tab"
import { createClient } from "@/lib/supabase/client"
import type { ContractHistoryItem } from "@/lib/actions/contracts"

interface MonComptePageProps {
  initialContractHistory: ContractHistoryItem[] | null
}

export function MonComptePage({ initialContractHistory }: MonComptePageProps) {
  const { user, credits, plan, canManageCompany } = useClientLayout()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loggingOut, setLoggingOut] = useState(false)
  const [activeTab, setActiveTab] = useState("coordonnees")
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  // Preserve site param in navigation
  const siteParam = searchParams.get("site")
  const accueilHref = siteParam ? `/compte?site=${siteParam}` : "/compte"

  // User info
  const firstName = user?.first_name || ""
  const lastName = user?.last_name || ""
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "Utilisateur"
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
    { value: "coordonnees", label: "Coordonnées", icon: User },
    ...(canManageCompany ? [{ value: "entreprise", label: "Entreprise", icon: Building2 }] : []),
    { value: "forfait", label: "Forfait", icon: Package },
    { value: "credits", label: "Crédits", icon: Coins },
    { value: "facturation", label: "Facturation", icon: Receipt },
    { value: "contact", label: "Support", icon: MessageCircle },
  ]

  return (
    <>
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-4 md:px-0 md:pt-6">
      {/* Back to home button */}
      <Link
        href={accueilHref}
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5">
          <ArrowLeft className="h-4 w-4" />
        </div>
        <span>Retour à l&apos;accueil</span>
      </Link>

      {/* Header with logout button */}
      <div className="flex items-start justify-between gap-4">
        {/* User Info Block - Mobile only */}
        <div className="md:hidden flex-1 rounded-[16px] bg-card p-4">
          <p className="font-header text-lg font-semibold text-foreground">{fullName}</p>
          {companyName && (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-foreground/70">
              <Building2 className="h-3.5 w-3.5" />
              <span>{companyName}</span>
            </div>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm text-foreground/70">
              <Ticket className="h-3.5 w-3.5" />
              <span>{remainingCredits} crédit{remainingCredits !== 1 ? "s" : ""}</span>
            </div>
            {planName && (
              <div className="flex items-center gap-1.5 text-sm text-foreground/70">
                <Crown className="h-3.5 w-3.5" />
                <span>{planName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Desktop spacer */}
        <div className="hidden md:block flex-1" />

        {/* Logout button - top right */}
        <button
          type="button"
          onClick={() => setShowLogoutConfirm(true)}
          className="flex shrink-0 items-center gap-2 rounded-full bg-foreground/5 px-3 py-2 text-xs font-medium text-foreground/70 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Déconnexion</span>
        </button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Mobile: 2-column grid */}
        <div className="grid grid-cols-2 gap-2 md:hidden">
          {menuItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveTab(item.value)}
              className={cn(
                "flex items-center gap-2.5 rounded-[12px] p-3 text-left transition-all",
                activeTab === item.value
                  ? "bg-foreground text-background"
                  : "bg-card hover:bg-card/80"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-medium truncate">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Desktop: horizontal tabs */}
        <div className="hidden md:block">
          <TabsList className="inline-flex h-auto w-full gap-1 p-1 justify-start">
            <TabsTrigger value="coordonnees" className="whitespace-nowrap px-3 py-2 text-sm">
              Coordonnées
            </TabsTrigger>
            {canManageCompany && (
              <TabsTrigger value="entreprise" className="whitespace-nowrap px-3 py-2 text-sm">
                Entreprise
              </TabsTrigger>
            )}
            <TabsTrigger value="forfait" className="whitespace-nowrap px-3 py-2 text-sm">
              Forfait
            </TabsTrigger>
            <TabsTrigger value="credits" className="whitespace-nowrap px-3 py-2 text-sm">
              Crédits
            </TabsTrigger>
            <TabsTrigger value="facturation" className="whitespace-nowrap px-3 py-2 text-sm">
              Facturation
            </TabsTrigger>
            <TabsTrigger value="contact" className="whitespace-nowrap px-3 py-2 text-sm">
              Support
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="coordonnees" className="mt-6">
          <MesCoordonneesTab />
        </TabsContent>

        {canManageCompany && (
          <TabsContent value="entreprise" className="mt-6">
            <MonEntrepriseTab />
          </TabsContent>
        )}

        <TabsContent value="forfait" className="mt-6">
          <MonForfaitTab initialContractHistory={initialContractHistory} />
        </TabsContent>

        <TabsContent value="credits" className="mt-6">
          <MesCreditsTab />
        </TabsContent>

        <TabsContent value="facturation" className="mt-6">
          <FacturationTab />
        </TabsContent>

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
            Déconnexion
          </AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir vous déconnecter ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(false)}
            className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
          >
            Annuler
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
                Déconnexion...
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                Déconnexion
              </>
            )}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  )
}
