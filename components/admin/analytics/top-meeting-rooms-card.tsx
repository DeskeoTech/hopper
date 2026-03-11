"use client"

import { useState } from "react"
import { DoorOpen, BarChart3, List } from "lucide-react"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { cn } from "@/lib/utils"

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#ec4899", "#f97316", "#06b6d4", "#84cc16", "#6366f1"]

interface TopMeetingRoom {
  resourceId: string
  resourceName: string
  siteName: string
  bookingsCount: number
}

interface TopMeetingRoomsCardProps {
  rooms: TopMeetingRoom[]
  maxBookings: number
  periodLabel?: string
}

export function TopMeetingRoomsCard({ rooms, maxBookings, periodLabel }: TopMeetingRoomsCardProps) {
  const [view, setView] = useState<"list" | "chart">("list")

  const pieData = rooms.map((room) => ({
    name: room.resourceName,
    value: room.bookingsCount,
  }))
  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0)

  return (
    <div className="rounded-[20px] bg-card p-5 h-full">
      <div className="flex items-start justify-between mb-1">
        <h2 className="font-header text-lg uppercase tracking-wide">Top Salles de Réunion</h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setView(view === "list" ? "chart" : "list")}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-muted transition-colors"
            title={view === "list" ? "Vue graphique" : "Vue liste"}
          >
            {view === "list" ? (
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            ) : (
              <List className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          <DoorOpen className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground mb-4">Les plus réservées — {periodLabel || "ce mois"}</p>

      {rooms.length > 0 ? (
        view === "list" ? (
          <div className="space-y-3">
            {rooms.map((room, index) => {
              const percentage = maxBookings > 0 ? (room.bookingsCount / maxBookings) * 100 : 0

              return (
                <div key={room.resourceId} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold",
                          index === 0 && "bg-yellow-100 text-yellow-700",
                          index === 1 && "bg-gray-100 text-gray-600",
                          index === 2 && "bg-orange-100 text-orange-700",
                          index > 2 && "bg-muted text-muted-foreground"
                        )}
                      >
                        {index + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{room.resourceName}</p>
                        <p className="text-xs text-muted-foreground truncate">{room.siteName}</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold tabular-nums shrink-0 ml-2">
                      {room.bookingsCount}
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-muted-foreground/40 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-center gap-4">
            <div className="relative shrink-0 h-[180px] w-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value} résa.`, ""]}
                    contentStyle={{ borderRadius: 12, fontSize: 13 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <span className="font-header text-xl">{pieTotal}</span>
                  <p className="text-[10px] text-muted-foreground">résa.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                  <span className="truncate text-muted-foreground">{d.name}</span>
                  <span className="flex-1 border-b border-dotted border-border/40 min-w-[12px] mx-1" />
                  <span className="font-bold tabular-nums shrink-0">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <p className="text-center text-muted-foreground py-8">
          Aucune réservation de salle ce mois
        </p>
      )}
    </div>
  )
}
