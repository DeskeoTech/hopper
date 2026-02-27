"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback, useTransition } from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
  const [isPending, startTransition] = useTransition()

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
      startTransition(() => {
        router.push(queryString ? `${pathname}?${queryString}` : pathname)
      })
    },
    [router, pathname, searchParams, defaultTabValue]
  )

  return (
    <Tabs value={defaultTab} onValueChange={handleTabChange}>
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="cursor-pointer">
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-6">
          <div className={cn("relative", isPending && "pointer-events-none")}>
            {isPending && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50 rounded-lg">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <div className={cn(isPending && "opacity-50 transition-opacity")}>
              {tab.content}
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
