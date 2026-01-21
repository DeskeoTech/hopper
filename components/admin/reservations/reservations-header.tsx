"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="type-h2 text-foreground">Reservations</h1>
          <p className="mt-1 text-muted-foreground">
            Gerez les reservations de vos espaces
          </p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle reservation
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
