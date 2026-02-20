"use client"

import { useState, useMemo } from "react"
import { FileText, Calendar, Users, ChevronDown } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { StripePortalButton } from "@/components/admin/company-edit/stripe-actions"
import { PassDetailModal } from "./pass-detail-modal"
import { CreatePassModal } from "./create-pass-modal"
import type { AdminPassForDisplay } from "@/lib/types/database"

interface PassesSectionProps {
  passes: AdminPassForDisplay[]
  companyId: string
  stripeCustomerId?: string | null
  stripeCustomerEmail?: string | null
  companyName?: string
}

const MAX_VISIBLE = 5

export function PassesSection({
  passes,
  companyId,
  stripeCustomerId,
  stripeCustomerEmail,
  companyName,
}: PassesSectionProps) {
  const [selectedPass, setSelectedPass] = useState<AdminPassForDisplay | null>(null)
  const [showAll, setShowAll] = useState(false)

  // Sort: active first, then by start_date desc
  const sortedPasses = useMemo(() => {
    return [...passes].sort((a, b) => {
      // Active passes first
      const statusOrder = { active: 0, suspended: 1, terminated: 2 }
      const aOrder = statusOrder[a.status] ?? 3
      const bOrder = statusOrder[b.status] ?? 3
      if (aOrder !== bOrder) return aOrder - bOrder

      // Then by start_date desc
      const dateA = a.start_date ? new Date(a.start_date).getTime() : 0
      const dateB = b.start_date ? new Date(b.start_date).getTime() : 0
      return dateB - dateA
    })
  }, [passes])

  const visiblePasses = showAll ? sortedPasses : sortedPasses.slice(0, MAX_VISIBLE)
  const hasMore = sortedPasses.length > MAX_VISIBLE

  return (
    <>
      <div className="rounded-lg bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <FileText className="h-5 w-5" />
            Pass
          </h2>
          <CreatePassModal companyId={companyId} />
        </div>

        {passes.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucun pass</p>
        ) : (
          <div className="space-y-2">
            {visiblePasses.map((pass) => (
              <PassCard
                key={pass.id}
                pass={pass}
                onClick={() => setSelectedPass(pass)}
              />
            ))}

            {hasMore && !showAll && (
              <button
                type="button"
                onClick={() => setShowAll(true)}
                className="flex w-full items-center justify-center gap-1 rounded-sm py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Voir tous ({sortedPasses.length})
                <ChevronDown className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {stripeCustomerId && (
          <div className="mt-4 pt-4 border-t border-border">
            <StripePortalButton
              customerId={stripeCustomerId}
              customerEmail={stripeCustomerEmail}
              companyName={companyName}
            />
          </div>
        )}
      </div>

      <PassDetailModal
        pass={selectedPass}
        open={!!selectedPass}
        onOpenChange={(open) => !open && setSelectedPass(null)}
      />
    </>
  )
}

function PassCard({
  pass,
  onClick,
}: {
  pass: AdminPassForDisplay
  onClick: () => void
}) {
  const startDate = pass.start_date ? parseISO(pass.start_date) : null
  const endDate = pass.end_date ? parseISO(pass.end_date) : null
  const formatDate = (date: Date) => format(date, "d MMM yyyy", { locale: fr })

  const isTerminated = pass.status === "terminated"
  const isSuspended = pass.status === "suspended"
  const now = new Date()
  const isOngoing =
    pass.status === "active" &&
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
        <p className="text-sm font-medium text-foreground truncate">{pass.plan_name}</p>
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
      </div>
      <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {dateString}
        </span>
        {pass.number_of_seats !== null && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            {pass.assigned_users_count}/{pass.number_of_seats}
          </span>
        )}
      </div>
    </button>
  )
}
