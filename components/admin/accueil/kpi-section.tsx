"use client"

import { useState, type ReactNode } from "react"
import { cn } from "@/lib/utils"

interface KpiSectionProps {
  clientsCount: number
  meetingRoomCount: number
  dateLabel: string
  clientsContent: ReactNode
  meetingRoomsContent: ReactNode
}

type ActiveTab = "clients" | "meeting_rooms"

export function KpiSection({
  clientsCount,
  meetingRoomCount,
  dateLabel,
  clientsContent,
  meetingRoomsContent,
}: KpiSectionProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("clients")

  return (
    <>
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Clients présents */}
        <button
          type="button"
          onClick={() => setActiveTab("clients")}
          className={cn(
            "rounded-[20px] p-5 sm:p-6 text-left transition-all",
            activeTab === "clients"
              ? "bg-[#221D1A] text-white ring-2 ring-[#221D1A]"
              : "bg-card text-foreground ring-1 ring-foreground/5 hover:ring-foreground/10"
          )}
        >
          <p className={cn(
            "text-xs font-medium uppercase tracking-wide",
            activeTab === "clients" ? "text-white/70" : "text-muted-foreground"
          )}>
            Clients présents {dateLabel}
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-header text-4xl">{clientsCount}</span>
            <span className={cn(
              "mb-1 text-sm",
              activeTab === "clients" ? "text-white/60" : "text-muted-foreground"
            )}>personnes</span>
          </div>
        </button>

        {/* Salles de réunion */}
        <button
          type="button"
          onClick={() => setActiveTab("meeting_rooms")}
          className={cn(
            "rounded-[20px] p-5 sm:p-6 text-left transition-all",
            activeTab === "meeting_rooms"
              ? "bg-[#221D1A] text-white ring-2 ring-[#221D1A]"
              : "bg-card text-foreground ring-1 ring-foreground/5 hover:ring-foreground/10"
          )}
        >
          <p className={cn(
            "text-xs font-medium uppercase tracking-wide",
            activeTab === "meeting_rooms" ? "text-white/70" : "text-muted-foreground"
          )}>
            Salles de réunion
          </p>
          <div className="mt-4 flex items-end gap-2">
            <span className="font-header text-4xl">{meetingRoomCount}</span>
            <span className={cn(
              "mb-1 text-sm",
              activeTab === "meeting_rooms" ? "text-white/60" : "text-muted-foreground"
            )}>réservations</span>
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === "clients" ? clientsContent : meetingRoomsContent}
    </>
  )
}
