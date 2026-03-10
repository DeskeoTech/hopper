"use client"

import { useEffect, useState, useCallback } from "react"
import { Calendar, Users, User, Loader2, CreditCard } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getAdminCafeUsers, type AdminPassUser } from "@/lib/actions/admin-passes"
import type { AdminPassForDisplay } from "@/lib/types/database"

interface CafeDetailModalProps {
  subscription: AdminPassForDisplay | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CafeDetailModal({ subscription, open, onOpenChange }: CafeDetailModalProps) {
  const [users, setUsers] = useState<AdminPassUser[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUsers = useCallback(() => {
    if (subscription) {
      setLoading(true)
      getAdminCafeUsers(subscription.id).then((result) => {
        setUsers(result.data || [])
        setLoading(false)
      })
    }
  }, [subscription])

  useEffect(() => {
    if (open && subscription) {
      fetchUsers()
    } else {
      setUsers([])
    }
  }, [open, subscription, fetchUsers])

  if (!subscription) return null

  const startDate = subscription.start_date ? parseISO(subscription.start_date) : null
  const endDate = subscription.end_date ? parseISO(subscription.end_date) : null
  const formatDate = (date: Date) => format(date, "d MMMM yyyy", { locale: fr })

  const isTerminated = subscription.status === "terminated"
  const isSuspended = subscription.status === "suspended"
  const now = new Date()
  const isOngoing =
    subscription.status === "active" &&
    startDate &&
    startDate <= now &&
    (!endDate || endDate >= now)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{subscription.plan_name}</DialogTitle>
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
          {subscription.stripe_status && (
            <span className={cn(
              "rounded-sm px-2 py-0.5 text-xs font-medium",
              subscription.stripe_status === "active" ? "bg-green-100 text-green-700" :
              ["past_due", "unpaid"].includes(subscription.stripe_status) ? "bg-red-100 text-red-700" :
              subscription.stripe_status === "canceled" ? "bg-gray-100 text-gray-600" :
              "bg-orange-100 text-orange-700"
            )}>
              Stripe: {subscription.stripe_status === "active" ? "À jour" :
                subscription.stripe_status === "past_due" ? "Paiement en retard" :
                subscription.stripe_status === "canceled" ? "Annulé" :
                subscription.stripe_status === "unpaid" ? "Non payé" :
                subscription.stripe_status}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="space-y-3">
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
              {!startDate && !endDate && (
                <span className="text-muted-foreground">Dates non définies</span>
              )}
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Abonnements : </span>
                <span className="text-foreground">
                  {subscription.number_of_seats !== null
                    ? `${subscription.assigned_users_count} / ${subscription.number_of_seats}`
                    : "Non défini"}
                </span>
              </div>
              {subscription.price_per_seat_month !== null && (
                <div>
                  <span className="text-muted-foreground">Prix : </span>
                  <span className="text-foreground">
                    {subscription.price_per_seat_month.toFixed(2)} €/pers/mois
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stripe info */}
        {subscription.subscription_id && (
          <div className="flex items-start gap-3 rounded-lg border border-border p-3">
            <CreditCard className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="space-y-1 text-sm">
              <div>
                <span className="text-muted-foreground">Subscription ID : </span>
                <span className="text-foreground font-mono text-xs">{subscription.subscription_id}</span>
              </div>
              {subscription.stripe_status && (
                <div>
                  <span className="text-muted-foreground">Statut paiement : </span>
                  <span className={cn(
                    "font-medium",
                    subscription.stripe_status === "active" ? "text-green-700" :
                    ["past_due", "unpaid"].includes(subscription.stripe_status) ? "text-red-700" :
                    "text-orange-700"
                  )}>
                    {subscription.stripe_status === "active" ? "À jour" :
                      subscription.stripe_status === "past_due" ? "Paiement en retard" :
                      subscription.stripe_status === "canceled" ? "Annulé" :
                      subscription.stripe_status === "unpaid" ? "Non payé" :
                      subscription.stripe_status === "trialing" ? "Période d'essai" :
                      subscription.stripe_status}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

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
