"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import type { User, UserCredits, UserPlan, Equipment, CompanyType, CreditMovement } from "@/lib/types/database"

interface Site {
  id: string
  name: string
}

export interface SiteWithDetails {
  id: string
  name: string
  address: string
  imageUrl: string | null
  photoUrls: string[]
  capacityRange: { min: number; max: number } | null
  openingHours: string | null
  openingDays: string[] | null
  wifiSsid: string | null
  wifiPassword: string | null
  equipments: Equipment[] | null
  instructions: string | null
  access: string | null
}

interface ClientLayoutContextValue {
  user: User & { companies: { id: string; name: string | null; main_site_id: string | null; company_type: CompanyType | null } | null }
  credits: UserCredits | null
  creditMovements: CreditMovement[]
  plan: UserPlan | null
  sites: Site[]
  sitesWithDetails: SiteWithDetails[]
  selectedSiteId: string | null
  selectedSite: Site | null
  selectedSiteWithDetails: SiteWithDetails | null
  setSelectedSiteId: (siteId: string) => void
  isAdmin: boolean
  isDeskeoEmployee: boolean
  isNomad: boolean
  mainSiteId: string | null
  canManageCompany: boolean
}

const ClientLayoutContext = createContext<ClientLayoutContextValue | null>(null)

interface ClientLayoutProviderProps {
  children: ReactNode
  user: User & { companies: { id: string; name: string | null; main_site_id: string | null; company_type: CompanyType | null } | null }
  credits: UserCredits | null
  creditMovements: CreditMovement[]
  plan: UserPlan | null
  sites: Site[]
  sitesWithDetails: SiteWithDetails[]
  selectedSiteId: string | null
  isAdmin: boolean
  isDeskeoEmployee: boolean
}

export function ClientLayoutProvider({
  children,
  user,
  credits,
  creditMovements,
  plan,
  sites,
  sitesWithDetails,
  selectedSiteId: initialSelectedSiteId,
  isAdmin,
  isDeskeoEmployee,
}: ClientLayoutProviderProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  // Use local state for selectedSiteId to update immediately on selection
  const [currentSelectedSiteId, setCurrentSelectedSiteId] = useState(initialSelectedSiteId)

  const selectedSite = sites.find((s) => s.id === currentSelectedSiteId) || null
  const selectedSiteWithDetails = sitesWithDetails.find((s) => s.id === currentSelectedSiteId) || null
  const isNomad = plan?.name?.toUpperCase().includes("NOMAD") ?? false
  const mainSiteId = user.companies?.main_site_id || null
  const canManageCompany = user.role === "admin" && user.companies !== null

  const setSelectedSiteId = (siteId: string) => {
    // Update local state immediately for instant UI feedback
    setCurrentSelectedSiteId(siteId)
    // Also update URL for bookmarking/sharing
    const params = new URLSearchParams(searchParams.toString())
    params.set("site", siteId)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <ClientLayoutContext.Provider
      value={{
        user,
        credits,
        creditMovements,
        plan,
        sites,
        sitesWithDetails,
        selectedSiteId: currentSelectedSiteId,
        selectedSite,
        selectedSiteWithDetails,
        setSelectedSiteId,
        isAdmin,
        isDeskeoEmployee,
        isNomad,
        mainSiteId,
        canManageCompany,
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
