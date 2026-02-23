"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface DetailsTabsProps {
  defaultTab: string
  infoContent: React.ReactNode
  reservationsContent: React.ReactNode
  clientsContent?: React.ReactNode
}

export function DetailsTabs({
  defaultTab,
  infoContent,
  reservationsContent,
  clientsContent,
}: DetailsTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === "info") {
        params.delete("tab")
      } else {
        params.set("tab", value)
      }
      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams]
  )

  return (
    <Tabs value={defaultTab} onValueChange={handleTabChange}>
      <TabsList>
        <TabsTrigger value="info">Informations générales</TabsTrigger>
        <TabsTrigger value="reservations">Réservations</TabsTrigger>
        {clientsContent && <TabsTrigger value="clients">Clients</TabsTrigger>}
      </TabsList>
      <TabsContent value="info" className="mt-6">
        {infoContent}
      </TabsContent>
      <TabsContent value="reservations" className="mt-6">
        {reservationsContent}
      </TabsContent>
      {clientsContent && (
        <TabsContent value="clients" className="mt-6">
          {clientsContent}
        </TabsContent>
      )}
    </Tabs>
  )
}
