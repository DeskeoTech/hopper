"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Tab {
  value: string
  label: string
  content: React.ReactNode
}

interface DetailsTabsProps {
  defaultTab: string
  tabs: Tab[]
}

export function DetailsTabs({ defaultTab, tabs }: DetailsTabsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // First tab value is the default (no ?tab= param in URL)
  const defaultTabValue = tabs[0]?.value

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value === defaultTabValue) {
        params.delete("tab")
      } else {
        params.set("tab", value)
      }
      const queryString = params.toString()
      router.push(queryString ? `${pathname}?${queryString}` : pathname)
    },
    [router, pathname, searchParams, defaultTabValue]
  )

  return (
    <Tabs value={defaultTab} onValueChange={handleTabChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}
