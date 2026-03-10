"use client"

import { useState, useMemo } from "react"
import { Coffee, Calendar, Users, ChevronDown } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { CafeDetailModal } from "./cafe-detail-modal"
import { CreateCafeModal } from "./create-cafe-modal"
import type { AdminPassForDisplay } from "@/lib/types/database"

interface CafeSubscriptionsSectionProps {
  subscriptions: AdminPassForDisplay[]
  companyId: string
}

const MAX_VISIBLE = 5

export function CafeSubscriptionsSection({
  subscriptions,
  companyId,
}: CafeSubscriptionsSectionProps) {
  const [selected, setSelected] = useState<AdminPassForDisplay | null>(null)
  const [showAll, setShowAll] = useState(false)

  const sorted = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      const statusOrder = { active: 0, suspended: 1, terminated: 2 }
      const aOrder = statusOrder[a.status] ?? 3
      const bOrder = statusOrder[b.status] ?? 3
      if (aOrder !== bOrder) return aOrder - bOrder
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
      return dateB - dateA
    })
  }, [subscriptions])

  const visible = showAll ? sorted : sorted.slice(0, MAX_VISIBLE)
  const hasMore = sorted.length > MAX_VISIBLE

  return (
    <>
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Coffee className="h-5 w-5" />
            Abonnement Café
          </h2>
          <CreateCafeModal companyId={companyId} />
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun abonnement café</p>
        ) : (
          <div className="space-y-2">
            {visible.map((sub) => (
              <CafeCard
                key={sub.id}
                subscription={sub}
                onClick={() => setSelected(sub)}
              />
            ))}

            {hasMore && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="flex w-full items-center justify-center gap-1 rounded-sm py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Voir tous ({sorted.length})
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      <CafeDetailModal
        subscription={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </>
  )
}

function CafeCard({
  subscription,
  onClick,
}: {
  subscription: AdminPassForDisplay
  onClick: () => void
}) {
  const startDate = subscription.start_date ? parseISO(subscription.start_date) : null
  const endDate = subscription.end_date ? parseISO(subscription.end_date) : null
  const formatDate = (date: Date) => format(date, "d MMM yyyy", { locale: fr })

  const isTerminated = subscription.status === "terminated"
  const isSuspended = subscription.status === "suspended"
  const now = new Date()
  const isOngoing =
    subscription.status === "active" &&
    startDate &&
    startDate <= now &&
    (!endDate || endDate >= now)

  let dateString = "—"
  if (startDate && endDate) {
    dateString = `${formatDate(startDate)} → ${formatDate(endDate)}`
  } else if (startDate) {
    dateString = `Depuis le ${formatDate(startDate)}`
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-sm border border-border p-3 text-left hover:bg-muted/50 transition-colors cursor-pointer"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground truncate">{subscription.plan_name}</p>
        <div className="flex items-center gap-1.5">
          {isOngoing && (
            <span className="shrink-0 rounded-sm bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Actif
            </span>
          )}
          {isSuspended && (
            <span className="shrink-0 rounded-sm bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
              Suspendu
            </span>
          )}
          {isTerminated && (
            <span className="shrink-0 rounded-sm bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
              Terminé
            </span>
          )}
          {!isOngoing && !isSuspended && !isTerminated && (
            <span className="shrink-0 rounded-sm bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
              À venir
            </span>
          )}
          {subscription.stripe_status && subscription.stripe_status !== "active" && (
            <span className={cn(
              "shrink-0 rounded-sm px-2 py-0.5 text-xs font-medium",
              ["past_due", "unpaid"].includes(subscription.stripe_status)
                ? "bg-red-100 text-red-700"
                : subscription.stripe_status === "canceled"
                  ? "bg-gray-100 text-gray-600"
                  : "bg-orange-100 text-orange-700"
            )}>
              {subscription.stripe_status === "past_due" ? "Paiement en retard" :
                subscription.stripe_status === "canceled" ? "Stripe annulé" :
                subscription.stripe_status === "unpaid" ? "Non payé" :
                `Stripe: ${subscription.stripe_status}`}
            </span>
          )}
        </div>
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dateString}
        </span>
        {subscription.number_of_seats !== null && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {subscription.assigned_users_count}/{subscription.number_of_seats}
          </span>
        )}
      </div>
    </button>
  )
}
