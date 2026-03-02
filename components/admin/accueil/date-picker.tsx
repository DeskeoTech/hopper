"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useState } from "react"
import { format, parse } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface AccueilDatePickerProps {
  currentDate: string // YYYY-MM-DD
}

export function AccueilDatePicker({ currentDate }: AccueilDatePickerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const selectedDate = parse(currentDate, "yyyy-MM-dd", new Date())
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isToday = currentDate === format(today, "yyyy-MM-dd")

  const navigateDate = (dateStr: string) => {
    const params = new URLSearchParams(searchParams.toString())
    const todayStr = format(today, "yyyy-MM-dd")
    if (dateStr === todayStr) {
      params.delete("date")
    } else {
      params.set("date", dateStr)
    }
    const query = params.toString()
    router.push(`/admin${query ? `?${query}` : ""}`)
  }

  const handleSelect = (date: Date | undefined) => {
    if (!date) return
    navigateDate(format(date, "yyyy-MM-dd"))
    setOpen(false)
  }

  const goToPrevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    navigateDate(format(prev, "yyyy-MM-dd"))
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    navigateDate(format(next, "yyyy-MM-dd"))
  }

  const goToToday = () => {
    navigateDate(format(today, "yyyy-MM-dd"))
  }

  const displayLabel = isToday
    ? "Aujourd'hui"
    : format(selectedDate, "EEE d MMM", { locale: fr })

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={goToPrevDay}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "min-w-[160px] justify-center gap-2 rounded-[12px] border-none bg-card font-medium shadow-sm ring-1 ring-foreground/5",
              !isToday && "text-foreground"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            <span className="capitalize">{displayLabel}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleSelect}
            defaultMonth={selectedDate}
          />
          {!isToday && (
            <div className="border-t px-3 pb-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-sm"
                onClick={() => { goToToday(); setOpen(false) }}
              >
                Retour à aujourd&apos;hui
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <button
        type="button"
        onClick={goToNextDay}
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
