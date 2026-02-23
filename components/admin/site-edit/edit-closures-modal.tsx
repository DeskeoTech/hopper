"use client"

import { useState, useMemo } from "react"
import { CalendarOff, Trash2, Loader2, Plus } from "lucide-react"
import { format, parseISO, startOfDay } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { addSiteClosure, removeSiteClosure } from "@/lib/actions/sites"
import type { SiteClosure } from "@/lib/types/database"

interface EditClosuresModalProps {
  siteId: string
  initialClosures: SiteClosure[]
}

export function EditClosuresModal({ siteId, initialClosures }: EditClosuresModalProps) {
  const [open, setOpen] = useState(false)
  const [closures, setClosures] = useState<SiteClosure[]>(initialClosures)
  const [loading, setLoading] = useState<string | null>(null)
  const [reason, setReason] = useState("")
  const [error, setError] = useState<string | null>(null)

  const today = startOfDay(new Date())

  const selectedDates = useMemo(
    () => closures.map((c) => parseISO(c.date)),
    [closures]
  )

  const upcomingClosures = useMemo(
    () => closures.filter((c) => parseISO(c.date) >= today),
    [closures, today]
  )

  const handleDayClick = async (day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd")
    setError(null)

    const existing = closures.find((c) => c.date === dateStr)

    if (existing) {
      setLoading(existing.id)
      const result = await removeSiteClosure(siteId, existing.id)
      if (result.error) {
        setError(result.error)
      } else {
        setClosures((prev) => prev.filter((c) => c.id !== existing.id))
      }
      setLoading(null)
    } else {
      setLoading(dateStr)
      const result = await addSiteClosure(siteId, dateStr, reason || undefined)
      if (result.error) {
        setError(result.error)
      } else if (result.closure) {
        setClosures((prev) =>
          [...prev, result.closure!].sort((a, b) => a.date.localeCompare(b.date))
        )
      }
      setLoading(null)
    }
  }

  const handleRemove = async (closure: SiteClosure) => {
    setError(null)
    setLoading(closure.id)
    const result = await removeSiteClosure(siteId, closure.id)
    if (result.error) {
      setError(result.error)
    } else {
      setClosures((prev) => prev.filter((c) => c.id !== closure.id))
    }
    setLoading(null)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <Plus className="h-3.5 w-3.5" />
          Fermetures
          {upcomingClosures.length > 0 && (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
              {upcomingClosures.length}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarOff className="h-5 w-5" />
            Fermetures exceptionnelles
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Reason input */}
          <Input
            placeholder="Motif (optionnel)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="text-sm"
          />

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="multiple"
              selected={selectedDates}
              onSelect={() => {}}
              onDayClick={handleDayClick}
              disabled={{ before: today }}
              modifiers={{ closed: selectedDates }}
              modifiersClassNames={{ closed: "bg-red-100 text-red-700 hover:bg-red-200" }}
            />
          </div>

          {error && (
            <p className="text-xs text-red-600">{error}</p>
          )}

          {/* Upcoming closures list */}
          {upcomingClosures.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-sm font-medium text-muted-foreground">Fermetures à venir</span>
              {upcomingClosures.map((closure) => (
                <div
                  key={closure.id}
                  className="flex items-center justify-between rounded-md bg-muted/50 px-2.5 py-1.5"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-foreground">
                      {format(parseISO(closure.date), "EEE d MMM yyyy", { locale: fr })}
                    </span>
                    {closure.reason && (
                      <span className="ml-1.5 text-xs text-muted-foreground">— {closure.reason}</span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-1 h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-red-600"
                    onClick={() => handleRemove(closure)}
                    disabled={loading === closure.id}
                  >
                    {loading === closure.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
