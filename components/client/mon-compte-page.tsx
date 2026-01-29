"use client"

import { useState } from "react"
import { LogOut, MessageCircle, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { useClientLayout } from "./client-layout-provider"
import { MesCoordonneesTab } from "./mes-coordonnees-tab"
import { MonForfaitTab } from "./mon-forfait-tab"
import { MesCreditsTab } from "./mes-credits-tab"
import { MonEntrepriseTab } from "./mon-entreprise-tab"
import { FacturationTab } from "./facturation-tab"
import { createClient } from "@/lib/supabase/client"
import type { ContractHistoryItem } from "@/lib/actions/contracts"

interface MonComptePageProps {
  initialContractHistory: ContractHistoryItem[] | null
}

export function MonComptePage({ initialContractHistory }: MonComptePageProps) {
  const { canManageCompany } = useClientLayout()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 pt-4 md:px-0 md:pt-6">
      <h1 className="font-header text-xl sm:text-2xl font-bold uppercase tracking-tight">
        Mon Compte
      </h1>

      <Tabs defaultValue="coordonnees" className="w-full">
        {/* Mobile: horizontal scroll, Desktop: flex row */}
        <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide sm:mx-0 sm:px-0 sm:overflow-visible">
          <TabsList className="inline-flex h-auto w-max gap-1 p-1 sm:w-full sm:justify-start">
            <TabsTrigger value="coordonnees" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Mes coordonnées
            </TabsTrigger>
            <TabsTrigger value="forfait" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Mon forfait
            </TabsTrigger>
            <TabsTrigger value="credits" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Mes crédits
            </TabsTrigger>
            {canManageCompany && (
              <TabsTrigger value="entreprise" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
                Mon entreprise
              </TabsTrigger>
            )}
            <TabsTrigger value="facturation" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Facturation
            </TabsTrigger>
            <TabsTrigger value="contact" className="whitespace-nowrap px-3 py-2 text-xs sm:text-sm">
              Contact
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="coordonnees" className="mt-6">
          <MesCoordonneesTab />
        </TabsContent>

        <TabsContent value="forfait" className="mt-6">
          <MonForfaitTab initialContractHistory={initialContractHistory} />
        </TabsContent>

        <TabsContent value="credits" className="mt-6">
          <MesCreditsTab />
        </TabsContent>

        {canManageCompany && (
          <TabsContent value="entreprise" className="mt-6">
            <MonEntrepriseTab />
          </TabsContent>
        )}

        <TabsContent value="facturation" className="mt-6">
          <FacturationTab />
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="rounded-[20px] bg-card p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-header text-lg font-semibold">Nous contacter</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Une question ? Un problème ? Notre équipe est à votre disposition.
            </p>
            <div className="space-y-3">
              <a
                href="mailto:contact@deskeo.com"
                className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3 transition-colors hover:bg-muted"
              >
                <span className="text-sm">📧 contact@deskeo.com</span>
              </a>
              <a
                href="tel:+33176440240"
                className="flex items-center gap-3 rounded-[12px] bg-muted/50 p-3 transition-colors hover:bg-muted"
              >
                <span className="text-sm">📞 01 76 44 02 40</span>
              </a>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action buttons at bottom */}
      <div className="flex flex-col gap-3 border-t border-border pt-6">
        <Button
          variant="outline"
          className="w-full justify-start gap-3 h-12 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <LogOut className="h-5 w-5" />
          )}
          <span className="text-sm font-medium">Déconnexion</span>
        </Button>
      </div>
    </div>
  )
}
