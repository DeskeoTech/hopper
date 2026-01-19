"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import type { User, UserCredits, UserPlan } from "@/lib/types/database"

interface Site {
  id: string
  name: string
}

interface ClientLayoutContextValue {
  user: User & { companies: { id: string; name: string | null; main_site_id: string | null } | null }
  credits: UserCredits | null
  plan: UserPlan | null
  sites: Site[]
  selectedSiteId: string | null
  selectedSite: Site | null
  setSelectedSiteId: (siteId: string) => void
  isAdmin: boolean
}

const ClientLayoutContext = createContext<ClientLayoutContextValue | null>(null)

interface ClientLayoutProviderProps {
  children: ReactNode
  user: User & { companies: { id: string; name: string | null; main_site_id: string | null } | null }
  credits: UserCredits | null
  plan: UserPlan | null
  sites: Site[]
  selectedSiteId: string | null
  isAdmin: boolean
}

export function ClientLayoutProvider({
  children,
  user,
  credits,
  plan,
  sites,
  selectedSiteId,
  isAdmin,
}: ClientLayoutProviderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || null

  const setSelectedSiteId = (siteId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("site", siteId)
    router.push(`?${params.toString()}`)
  }

  return (
    <ClientLayoutContext.Provider
      value={{
        user,
        credits,
        plan,
        sites,
        selectedSiteId,
        selectedSite,
        setSelectedSiteId,
        isAdmin,
      }}
    >
      {children}
    </ClientLayoutContext.Provider>
  )
}

export function useClientLayout() {
  const context = useContext(ClientLayoutContext)
  if (!context) {
    throw new Error("useClientLayout must be used within a ClientLayoutProvider")
  }
  return context
}
