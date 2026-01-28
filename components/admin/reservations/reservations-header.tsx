"use client"

import { useState } from "react"
import { Calendar, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BookingCreateDialog } from "./booking-create-dialog"

interface Site {
  id: string
  name: string
}

interface User {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
}

interface ReservationsHeaderProps {
  sites: Site[]
  users: User[]
}

export function ReservationsHeader({ sites, users }: ReservationsHeaderProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-muted sm:h-14 sm:w-14">
            <Calendar className="h-5 w-5 text-foreground sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="type-h2 text-foreground">Réservations</h1>
            <p className="mt-1 text-muted-foreground">
              Gérez les réservations de vos espaces
            </p>
          </div>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle réservation
        </Button>
      </div>

      <BookingCreateDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sites={sites}
        users={users}
      />
    </>
  )
}
