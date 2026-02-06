"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { format, addDays, subDays, isToday } from "date-fns"
import { fr } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateNavigatorProps {
  currentDate: string // YYYY-MM-DD
  basePath?: string // defaults to "/admin"
}

export function DateNavigator({ currentDate, basePath = "/admin" }: DateNavigatorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const date = new Date(currentDate + "T12:00:00")
  const [open, setOpen] = useState(false)

  function navigateTo(newDate: Date) {
    const params = new URLSearchParams(searchParams.toString())
    const dateStr = format(newDate, "yyyy-MM-dd")
    if (isToday(newDate)) {
      params.delete("date")
    } else {
      params.set("date", dateStr)
    }
    const query = params.toString()
    router.push(`${basePath}${query ? `?${query}` : ""}`)
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
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="min-w-[160px] justify-center gap-2 text-sm font-medium capitalize"
          >
            <CalendarDays className="h-4 w-4" />
            {label}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(day) => {
              if (day) {
                navigateTo(day)
                setOpen(false)
              }
            }}
            defaultMonth={date}
          />
        </PopoverContent>
      </Popover>
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
