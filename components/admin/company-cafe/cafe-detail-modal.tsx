"use client"

import { useEffect, useState, useCallback } from "react"
import { Calendar, Users, User, Loader2, CreditCard, Plus, X, Search } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  getAdminCafeUsers,
  getAdminCompanyUsersNotInCafe,
  adminAssignUserToCafeContract,
  type AdminPassUser,
} from "@/lib/actions/admin-passes"
import type { AdminPassForDisplay } from "@/lib/types/database"

interface CafeDetailModalProps {
  subscription: AdminPassForDisplay | null
  companyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CafeDetailModal({ subscription, companyId, open, onOpenChange }: CafeDetailModalProps) {
  const [users, setUsers] = useState<AdminPassUser[]>([])
  const [loading, setLoading] = useState(false)
  const [showAssign, setShowAssign] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<AdminPassUser[]>([])
  const [loadingAvailable, setLoadingAvailable] = useState(false)
  const [assigningUserId, setAssigningUserId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

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
      setShowAssign(false)
      setSearchQuery("")
    }
  }, [open, subscription, fetchUsers])

  const handleShowAssign = async () => {
    if (!subscription) return
    setShowAssign(true)
    setLoadingAvailable(true)
    const result = await getAdminCompanyUsersNotInCafe(subscription.id, companyId)
    setAvailableUsers(result.data || [])
    setLoadingAvailable(false)
  }

  const handleAssign = async (userId: string) => {
    if (!subscription) return
    setAssigningUserId(userId)
    const result = await adminAssignUserToCafeContract(userId, subscription.id)
    if (result.success) {
      fetchUsers()
      setAvailableUsers((prev) => prev.filter((u) => u.id !== userId))
    }
    setAssigningUserId(null)
  }

  const handleUnassign = async (userId: string) => {
    setAssigningUserId(userId)
    const result = await adminAssignUserToCafeContract(userId, null)
    if (result.success) {
      fetchUsers()
    }
    setAssigningUserId(null)
  }

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

  const maxSeats = subscription.number_of_seats ?? 0
  const isFull = users.length >= maxSeats

  const filteredAvailable = searchQuery.trim()
    ? availableUsers.filter((u) => {
        const q = searchQuery.toLowerCase()
        const name = [u.first_name, u.last_name].filter(Boolean).join(" ").toLowerCase()
        return name.includes(q) || (u.email?.toLowerCase().includes(q) ?? false)
      })
    : availableUsers

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
                    ? `${users.length} / ${subscription.number_of_seats}`
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
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              Utilisateurs assignés
            </h3>
            {isOngoing && !isFull && !showAssign && (
              <button
                type="button"
                onClick={handleShowAssign}
                className="flex items-center gap-1 rounded-sm bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-3 w-3" />
                Assigner
              </button>
            )}
          </div>

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
                  <button
                    type="button"
                    onClick={() => handleUnassign(user.id)}
                    disabled={assigningUserId === user.id}
                    className="shrink-0 rounded-sm p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
                    title="Retirer"
                  >
                    {assigningUserId === user.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Assign user panel */}
          {showAssign && (
            <div className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-muted-foreground">Ajouter un utilisateur</p>
                <button
                  type="button"
                  onClick={() => { setShowAssign(false); setSearchQuery("") }}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Fermer
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un utilisateur..."
                  className="h-8 pl-8 text-xs"
                />
              </div>

              {loadingAvailable ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredAvailable.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-3">
                  {searchQuery ? "Aucun résultat" : "Aucun utilisateur disponible"}
                </p>
              ) : (
                <div className="max-h-[200px] overflow-y-auto space-y-1">
                  {filteredAvailable.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleAssign(user.id)}
                      disabled={assigningUserId === user.id || isFull}
                      className="flex w-full items-center gap-2 rounded-sm p-2 text-left text-sm hover:bg-muted/50 transition-colors disabled:opacity-50"
                    >
                      <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <div className="min-w-0 flex-1">
                        <span className="text-xs font-medium truncate block">
                          {user.first_name} {user.last_name}
                        </span>
                        {user.email && (
                          <span className="text-[11px] text-muted-foreground truncate block">{user.email}</span>
                        )}
                      </div>
                      {assigningUserId === user.id ? (
                        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
