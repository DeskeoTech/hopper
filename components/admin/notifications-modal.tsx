"use client"

import { useState, useEffect } from "react"
import { Bell } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { createClient } from "@/lib/supabase/client"

interface NotificationsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SiteOption {
  value: string
  label: string
}

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const [sites, setSites] = useState<SiteOption[]>([])
  const [selectedSite, setSelectedSite] = useState("all")

  useEffect(() => {
    if (!open) return

    async function fetchSites() {
      const supabase = createClient()
      const { data } = await supabase
        .from("sites")
        .select("id, name")
        .eq("status", "open")
        .order("name")

      if (data) {
        setSites(data.map((s) => ({ value: s.id, label: s.name })))
      }
    }

    fetchSites()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="size-5" />
            Notifications
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <SearchableSelect
            options={[{ value: "all", label: "Tous les sites" }, ...sites]}
            value={selectedSite}
            onValueChange={setSelectedSite}
            placeholder="Filtrer par site"
          />

          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Bell className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Aucune notification pour le moment.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
