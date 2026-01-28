"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useClientLayout } from "./client-layout-provider"
import { MesCoordonneesTab } from "./mes-coordonnees-tab"
import { MonForfaitTab } from "./mon-forfait-tab"
import { MesCreditsTab } from "./mes-credits-tab"
import { MonEntrepriseTab } from "./mon-entreprise-tab"
import { FacturationTab } from "./facturation-tab"
import type { ContractHistoryItem } from "@/lib/actions/contracts"

interface MonComptePageProps {
  initialContractHistory: ContractHistoryItem[] | null
}

export function MonComptePage({ initialContractHistory }: MonComptePageProps) {
  const { canManageCompany } = useClientLayout()

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 pt-6">
      <h1 className="font-header text-2xl font-bold uppercase tracking-tight">
        Mon Compte
      </h1>

      <Tabs defaultValue="coordonnees" className="w-full">
        <TabsList className="grid w-full h-auto gap-1 p-1 grid-cols-2 sm:grid-cols-5">
          <TabsTrigger value="coordonnees" className="text-xs sm:text-sm px-2">
            Mes coordonnées
          </TabsTrigger>
          <TabsTrigger value="forfait" className="text-xs sm:text-sm px-2">
            Mon forfait
          </TabsTrigger>
          <TabsTrigger value="credits" className="text-xs sm:text-sm px-2">
            Mes crédits
          </TabsTrigger>
          {canManageCompany && (
            <TabsTrigger value="entreprise" className="text-xs sm:text-sm px-2">
              Mon entreprise
            </TabsTrigger>
          )}
          <TabsTrigger value="facturation" className="text-xs sm:text-sm px-2">
            Facturation
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  )
}
