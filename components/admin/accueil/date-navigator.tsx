"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addDays, subDays, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"

interface DateNavigatorProps {
  currentDate: string // YYYY-MM-DD
}

export function DateNavigator({ currentDate }: DateNavigatorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const date = new Date(currentDate + "T12:00:00")

  function navigateTo(newDate: Date) {
    const params = new URLSearchParams(searchParams.toString())
    const dateStr = format(newDate, "yyyy-MM-dd")
    if (isToday(newDate)) {
      params.delete("date")
    } else {
      params.set("date", dateStr)
    }
    const query = params.toString()
    router.push(`/admin${query ? `?${query}` : ""}`)
  }

  const label = isToday(date)
    ? "Aujourd'hui"
    : format(date, "EEEE d MMMM", { locale: fr })

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigateTo(subDays(date, 1))}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <span className="min-w-[160px] text-center text-sm font-medium capitalize">
        {label}
      </span>
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => navigateTo(addDays(date, 1))}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
      {!isToday(date) && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-1 text-xs"
          onClick={() => navigateTo(new Date())}
        >
          Aujourd&apos;hui
        </Button>
      )}
    </div>
  )
}
