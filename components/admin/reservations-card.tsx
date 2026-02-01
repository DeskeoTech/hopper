"use client"

import { useState } from "react"
import { Armchair, DoorOpen, ChevronRight, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface SiteAvailability {
  siteId: string
  siteName: string
  available: number
  total: number
}

interface ReservationsCardProps {
  todayBenchBookings: number
  todayMeetingRoomBookings: number
  benchAvailabilityBySite: SiteAvailability[]
  meetingRoomAvailabilityBySite: SiteAvailability[]
}

function SiteAvailabilityItem({ site }: { site: SiteAvailability }) {
  const percentage = site.total > 0 ? Math.round((site.available / site.total) * 100) : 0

  return (
    <div className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
        <span className="text-base font-medium">{site.siteName}</span>
      </div>
      <div className="text-right">
        <span
          className={cn(
            "text-lg font-bold",
            percentage >= 50 && "text-green-600",
            percentage >= 20 && percentage < 50 && "text-orange-500",
            percentage < 20 && "text-red-500"
          )}
        >
          {site.available}
        </span>
        <span className="text-muted-foreground"> / {site.total}</span>
      </div>
    </div>
  )
}

function AvailabilityModal({
  title,
  subtitle,
  sites,
  totalAvailable,
  totalCapacity,
  children,
}: {
  title: string
  subtitle: string
  sites: SiteAvailability[]
  totalAvailable: number
  totalCapacity: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-header text-xl">{title}</DialogTitle>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </DialogHeader>
        <div className="mt-4 max-h-[60vh] overflow-y-auto">
          {sites.length > 0 ? (
            <div className="space-y-1">
              {sites.map((site) => (
                <SiteAvailabilityItem key={site.siteId} site={site} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune donnée disponible
            </p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">
              Total disponible
            </span>
            <span className="font-header text-xl">
              {totalAvailable} / {totalCapacity}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ReservationsCard({
  todayBenchBookings,
  todayMeetingRoomBookings,
  benchAvailabilityBySite,
  meetingRoomAvailabilityBySite,
}: ReservationsCardProps) {
  const totalBenchAvailable = benchAvailabilityBySite.reduce((sum, s) => sum + s.available, 0)
  const totalBenchCapacity = benchAvailabilityBySite.reduce((sum, s) => sum + s.total, 0)
  const totalMeetingRoomAvailable = meetingRoomAvailabilityBySite.reduce((sum, s) => sum + s.available, 0)
  const totalMeetingRoomCapacity = meetingRoomAvailabilityBySite.reduce((sum, s) => sum + s.total, 0)

  return (
    <div className="rounded-[20px] bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-header text-lg uppercase tracking-wide">Réservations</h2>
        <span className="text-[14px] bg-brand text-brand-foreground px-2 py-0.5 rounded-full font-medium">
          TEMPS RÉEL
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* Places disponibles */}
        <AvailabilityModal
          title="Places disponibles par site"
          subtitle="Disponibilité des places aujourd'hui"
          sites={benchAvailabilityBySite}
          totalAvailable={totalBenchAvailable}
          totalCapacity={totalBenchCapacity}
        >
          <button className="bg-muted/50 p-4 rounded-lg text-center hover:bg-muted/70 transition-colors group w-full">
            <div className="flex items-center justify-center gap-1 mb-2">
              <Armchair className="h-5 w-5 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-header text-2xl">{totalBenchAvailable}</p>
            <p className="text-[13px] text-muted-foreground uppercase font-medium">Places disponibles</p>
          </button>
        </AvailabilityModal>

        {/* Salles disponibles */}
        <AvailabilityModal
          title="Salles disponibles par site"
          subtitle="Disponibilité des salles aujourd'hui"
          sites={meetingRoomAvailabilityBySite}
          totalAvailable={totalMeetingRoomAvailable}
          totalCapacity={totalMeetingRoomCapacity}
        >
          <button className="bg-muted/50 p-4 rounded-lg text-center hover:bg-muted/70 transition-colors group w-full">
            <div className="flex items-center justify-center gap-1 mb-2">
              <DoorOpen className="h-5 w-5 text-muted-foreground" />
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <p className="font-header text-2xl">{totalMeetingRoomAvailable}</p>
            <p className="text-[13px] text-muted-foreground uppercase font-medium">Salles disponibles</p>
          </button>
        </AvailabilityModal>
      </div>
    </div>
  )
}
