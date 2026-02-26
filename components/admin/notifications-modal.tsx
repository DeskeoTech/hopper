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

interface SupportTicket {
  id: string
  subject: string
  status: string
  updated_at: string
  user_id: string
  last_name: string
}

export function NotificationsModal({ open, onOpenChange }: NotificationsModalProps) {
  const [sites, setSites] = useState<SiteOption[]>([])
  const [selectedSite, setSelectedSite] = useState("all")
  const [notifications, setNotifications] = useState<SupportTicket[]>([])

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

  useEffect(() => {
    if (!open) return

    const fetchNotifications = async () => {
      const supabase = createClient()

      let query = supabase
        .from("support_tickets")
        .select("*")
        .order("updated_at", { ascending: false })

      if (selectedSite !== "all") {
        query = query.eq("site_id", selectedSite)
      }

      const { data, error } = await query
      if (error) console.error(error)
      if (data) setNotifications(data)
    }

    fetchNotifications()
  }, [selectedSite, open])

  const statusColor = (status: string) => {
    if (status === "open") return "bg-green-100 text-green-700"
    if (status === "closed") return "bg-gray-100 text-gray-500"
    if (status === "pending") return "bg-yellow-100 text-yellow-700"
    return "bg-muted text-muted-foreground"
  }

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

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                <Bell className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Aucune notification pour le moment.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="flex items-start justify-between rounded-lg border p-3 text-sm"
                >
                  <div className="flex flex-col gap-1">
                    <span className="font-medium">{notif.subject}</span>
                    <span className="text-muted-foreground text-xs">{notif.last_name}</span>
                    <span className="text-muted-foreground text-xs">
                      {new Date(notif.updated_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor(notif.status)}`}>
                    {notif.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}