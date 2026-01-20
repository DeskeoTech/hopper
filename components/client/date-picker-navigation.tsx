"use client"

import { useState } from "react"
import { format, addDays, subDays, isToday, isBefore, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerNavigationProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  minDate?: Date
}

export function DatePickerNavigation({
  selectedDate,
  onDateChange,
  minDate = new Date(),
}: DatePickerNavigationProps) {
  const [calendarOpen, setCalendarOpen] = useState(false)

  const handlePreviousDay = () => {
    const prevDay = subDays(selectedDate, 1)
    if (!isBefore(prevDay, startOfDay(minDate))) {
      onDateChange(prevDay)
    }
  }

  const handleNextDay = () => {
    onDateChange(addDays(selectedDate, 1))
  }

  const handleToday = () => {
    onDateChange(startOfDay(new Date()))
  }

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      onDateChange(date)
      setCalendarOpen(false)
    }
  }

  const canGoPrevious = !isBefore(subDays(selectedDate, 1), startOfDay(minDate))
  const showTodayButton = !isToday(selectedDate)

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        onClick={handlePreviousDay}
        disabled={!canGoPrevious}
        aria-label="Jour precedent"
      >
        <ChevronLeft className="size-4" />
      </Button>

      {showTodayButton && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleToday}
          className="px-3"
        >
          Aujourd&apos;hui
        </Button>
      )}

      <Button
        variant="outline"
        size="icon-sm"
        onClick={handleNextDay}
        aria-label="Jour suivant"
      >
        <ChevronRight className="size-4" />
      </Button>

      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="min-w-[140px] justify-start gap-2 px-3"
          >
            <CalendarIcon className="size-4" />
            <span className="capitalize">
              {format(selectedDate, "d MMM yyyy", { locale: fr })}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleCalendarSelect}
            disabled={(date) => isBefore(date, startOfDay(minDate))}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
