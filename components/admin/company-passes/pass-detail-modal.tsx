"use client"

import { useEffect, useState, useCallback } from "react"
import { Calendar, Users, User, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getAdminPassUsers, type AdminPassUser } from "@/lib/actions/admin-passes"
import type { AdminPassForDisplay } from "@/lib/types/database"

interface PassDetailModalProps {
  pass: AdminPassForDisplay | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PassDetailModal({ pass, open, onOpenChange }: PassDetailModalProps) {
  const [users, setUsers] = useState<AdminPassUser[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(() => {
    if (pass) {
      setLoading(true)
      getAdminPassUsers(pass.id).then((result) => {
        setUsers(result.data || [])
        setLoading(false)
      })
    }
  }, [pass])

  useEffect(() => {
    if (open && pass) {
      fetchUsers()
    } else {
      setUsers([])
    }
  }, [open, pass, fetchUsers])

  if (!pass) return null

  const startDate = pass.start_date ? parseISO(pass.start_date) : null
  const endDate = pass.end_date ? parseISO(pass.end_date) : null
  const commitmentDate = pass.commitment_end_date ? parseISO(pass.commitment_end_date) : null
  const renewalDate = pass.renewal_end_date ? parseISO(pass.renewal_end_date) : null
  const formatDate = (date: Date) => format(date, "d MMMM yyyy", { locale: fr })

  const isTerminated = pass.status === "terminated"
  const isSuspended = pass.status === "suspended"
  const now = new Date()
  const isOngoing =
    pass.status === "active" &&
    startDate &&
    startDate <= now &&
    (!endDate || endDate >= now)

  const recurrenceLabel =
    pass.plan_recurrence === "daily"
      ? "Journalier"
      : pass.plan_recurrence === "weekly"
        ? "Hebdomadaire"
        : pass.plan_recurrence === "monthly"
          ? "Mensuel"
          : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{pass.plan_name}</DialogTitle>
        </DialogHeader>

        {/* Status badge */}
        <div className="flex items-center gap-2">
          {isOngoing && (
            <span className="rounded-sm bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Actif
            </span>
          )}
          {isSuspended && (
            <span className="rounded-sm bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              Suspendu
            </span>
          )}
          {isTerminated && (
            <span className="rounded-sm bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              Terminé
            </span>
          )}
          {!isOngoing && !isSuspended && !isTerminated && (
            <span className="rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              À venir
            </span>
          )}
          {recurrenceLabel && (
            <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {recurrenceLabel}
            </span>
          )}
        </div>

        {/* Pass details */}
        <div className="space-y-3">
          {/* Dates */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              {startDate && (
                <div>
                  <span className="text-muted-foreground">Début : </span>
                  <span className="text-foreground">{formatDate(startDate)}</span>
                </div>
              )}
              {endDate && (
                <div>
                  <span className="text-muted-foreground">Fin : </span>
                  <span className="text-foreground">{formatDate(endDate)}</span>
                </div>
              )}
              {commitmentDate && (
                <div>
                  <span className="text-muted-foreground">Fin engagement : </span>
                  <span className="text-foreground">{formatDate(commitmentDate)}</span>
                </div>
              )}
              {renewalDate && (
                <div>
                  <span className="text-muted-foreground">Fin renouvellement : </span>
                  <span className="text-foreground">{formatDate(renewalDate)}</span>
                </div>
              )}
              {!startDate && !endDate && (
                <span className="text-muted-foreground">Dates non définies</span>
              )}
            </div>
          </div>

          {/* Seats & Price */}
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Postes : </span>
                <span className="text-foreground">
                  {pass.number_of_seats !== null
                    ? `${pass.assigned_users_count} / ${pass.number_of_seats}`
                    : "Non défini"}
                </span>
              </div>
              {pass.price_per_seat_month !== null && (
                <div>
                  <span className="text-muted-foreground">Prix : </span>
                  <span className="text-foreground">
                    {pass.price_per_seat_month.toFixed(2)} €/poste/mois
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Assigned users */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Utilisateurs assignés
          </h3>

          {loading ? (
            <div className="flex items-center justify-center rounded-lg border border-border p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-lg border border-border p-4 text-center">
              <p className="text-sm text-muted-foreground">Aucun utilisateur assigné</p>
            </div>
          ) : (
            <div className="space-y-1">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-lg border border-border p-3"
                >
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium",
                      user.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    )}
                  >
                    {user.status === "active" ? "Actif" : "Inactif"}
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
