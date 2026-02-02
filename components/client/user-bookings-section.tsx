"use client"

import { useMemo } from "react"
import { CalendarX2, Briefcase } from "lucide-react"
import { UserBookingCard } from "./user-booking-card"
import { ContractCard } from "./contract-card"
import type { BookingWithDetails, ContractForDisplay, ReservationItemType } from "@/lib/types/database"

interface UserBookingsSectionProps {
  bookings: BookingWithDetails[]
  contracts?: ContractForDisplay[]
  userId?: string
}

function getPassType(recurrence: string | null): ReservationItemType {
  switch (recurrence) {
    case "daily":
      return "pass_day"
    case "weekly":
      return "pass_week"
    case "monthly":
      return "pass_month"
    default:
      return "pass_month"
  }
}

export function UserBookingsSection({
  bookings,
  contracts = [],
  userId,
}: UserBookingsSectionProps) {
  // Filter meeting room bookings (upcoming or ongoing, not cancelled)
  const meetingRoomBookings = useMemo(() => {
    const now = new Date()
    return bookings
      .filter((b) => {
        // Include if: upcoming (start > now) OR ongoing (start <= now <= end)
        const isUpcoming = new Date(b.start_date) > now
        const isOngoing = new Date(b.start_date) <= now && new Date(b.end_date) >= now
        return (isUpcoming || isOngoing) && b.status !== "cancelled"
      })
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
  }, [bookings])

  // Filter passes (active or not terminated)
  const activeContracts = useMemo(() => {
    const now = new Date()
    return contracts
      .filter((c) => {
        return c.status !== "terminated" && (!c.end_date || new Date(c.end_date) >= now)
      })
      .sort((a, b) => {
        const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
        const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
        return dateA - dateB
      })
  }, [contracts])

  const hasAnyReservations = meetingRoomBookings.length > 0 || activeContracts.length > 0

  return (
    <div className="space-y-6">
      <h2 className="font-header text-xl text-foreground">Mes réservations</h2>

      {!hasAnyReservations ? (
        <div className="rounded-[20px] bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarX2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Aucune réservation
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Meeting Rooms Section */}
          <div className="space-y-3">
            <h3 className="font-header text-sm font-medium text-foreground/70 uppercase tracking-wide">
              Salles de réunion
            </h3>
            {meetingRoomBookings.length > 0 ? (
              <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 pb-2">
                  {meetingRoomBookings.map((booking) => (
                    <UserBookingCard
                      key={`booking-${booking.id}`}
                      booking={booking}
                      userId={userId}
                      isPast={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucune réservation de salle
                </p>
              </div>
            )}
          </div>

          {/* Postes Section (Passes) */}
          <div className="space-y-3">
            <h3 className="font-header text-sm font-medium text-foreground/70 uppercase tracking-wide">
              Postes
            </h3>
            {activeContracts.length > 0 ? (
              <div className="-mx-4 px-4 overflow-x-auto scrollbar-hide">
                <div className="flex gap-3 pb-2">
                  {activeContracts.map((contract) => (
                    <ContractCard
                      key={`contract-${contract.id}`}
                      contract={contract}
                      type={getPassType(contract.plan_recurrence)}
                      isPast={false}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[16px] bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun pass actif
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
