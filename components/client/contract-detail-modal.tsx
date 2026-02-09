"use client"

import { useEffect, useState, useCallback } from "react"
import { X, Calendar, Users, User, ExternalLink, Loader2 } from "lucide-react"
import { format, parseISO } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { getContractUsers, type ContractUser } from "@/lib/actions/contracts"
import { createBillingPortalSession } from "@/lib/actions/billing"
import { useClientLayout } from "./client-layout-provider"
import { AssignUserToContract } from "./assign-user-to-contract"
import type { ContractForDisplay } from "@/lib/types/database"

interface ContractDetailModalProps {
  contract: ContractForDisplay | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ContractDetailModal({
  contract,
  open,
  onOpenChange,
}: ContractDetailModalProps) {
  const { isDeskeoEmployee, plan, isAdmin, user } = useClientLayout()
  const [users, setUsers] = useState<ContractUser[]>([])
  const [loading, setLoading] = useState(false)
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  // Check if expired contract banner is visible
  const showBanner = !isDeskeoEmployee && !plan

  const companyId = user.companies?.id || null

  const refreshUsers = useCallback(() => {
    if (contract) {
      setLoading(true)
      getContractUsers(contract.id).then((result) => {
        setUsers(result.data || [])
        setLoading(false)
      })
    }
  }, [contract])

  useEffect(() => {
    if (open && contract) {
      refreshUsers()
    } else {
      setUsers([])
    }
  }, [open, contract, refreshUsers])

  if (!open || !contract) {
    return null
  }

  const startDate = contract.start_date ? parseISO(contract.start_date) : null
  const endDate = contract.end_date ? parseISO(contract.end_date) : null
  const formatDate = (date: Date) => format(date, "d MMMM yyyy", { locale: fr })

  const isTerminated = contract.status === "terminated"
  const isSuspended = contract.status === "suspended"
  const now = new Date()
  const isOngoing =
    contract.status === "active" &&
    startDate &&
    startDate <= now &&
    (!endDate || endDate >= now)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />

      <div
        className={cn(
          "fixed z-50 bg-background",
          // Mobile: full screen
          "inset-0",
          showBanner && "top-[56px] sm:top-[58px]",
          // Desktop: centered modal
          "md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2",
          "md:w-full md:max-w-lg md:max-h-[85vh] md:rounded-[20px]"
        )}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-background px-4 py-4 md:rounded-t-[20px]">
          <h1 className="font-header text-xl font-bold uppercase tracking-tight">
            {contract.plan_name}
          </h1>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div
          className={cn(
            "overflow-y-auto overscroll-contain p-4 space-y-6",
            // Mobile heights
            showBanner
              ? "h-[calc(100vh-57px-56px)] sm:h-[calc(100vh-57px-58px)]"
              : "h-[calc(100vh-57px)]",
            // Desktop: auto height within max-height
            "md:h-auto md:max-h-[calc(85vh-64px)]"
          )}
        >
          {/* Status badge */}
          <div className="flex items-center gap-2">
            {isOngoing && (
              <span className="rounded-full bg-green-500/20 px-3 py-1 text-sm font-semibold text-green-700">
                En cours
              </span>
            )}
            {isSuspended && (
              <span className="rounded-full bg-orange-500/20 px-3 py-1 text-sm font-semibold text-orange-700">
                Suspendu
              </span>
            )}
            {isTerminated && (
              <span className="rounded-full bg-foreground/5 px-3 py-1 text-sm text-foreground/50">
                Terminé
              </span>
            )}
            {!isOngoing && !isSuspended && !isTerminated && (
              <span className="rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-700">
                À venir
              </span>
            )}
          </div>

          {/* Contract info */}
          <div className="space-y-3">
            {/* Dates */}
            <div className="flex items-start gap-3 rounded-[12px] bg-card p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <Calendar className="h-4 w-4 text-foreground/60" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground/50 uppercase">Période</p>
                <p className="text-sm text-foreground">
                  {startDate && endDate
                    ? `${formatDate(startDate)} → ${formatDate(endDate)}`
                    : startDate
                    ? `Depuis le ${formatDate(startDate)}`
                    : "—"}
                </p>
              </div>
            </div>

            {/* Number of seats */}
            <div className="flex items-start gap-3 rounded-[12px] bg-card p-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <Users className="h-4 w-4 text-foreground/60" />
              </div>
              <div>
                <p className="text-xs font-medium text-foreground/50 uppercase">Postes</p>
                <p className="text-sm text-foreground">
                  {contract.number_of_seats !== null
                    ? `${contract.number_of_seats} poste${contract.number_of_seats > 1 ? "s" : ""}`
                    : "Non défini"}
                </p>
              </div>
            </div>
          </div>

          {/* Users section */}
          <div className="space-y-3">
            <h3 className="font-header text-sm font-medium text-foreground/70 uppercase tracking-wide">
              Utilisateurs assignés
            </h3>

            {loading ? (
              <div className="rounded-[12px] bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="rounded-[12px] bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Aucun utilisateur assigné à ce contrat
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((contractUser) => (
                  <div
                    key={contractUser.id}
                    className="flex items-center gap-3 rounded-[12px] bg-card p-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                      <User className="h-4 w-4 text-foreground/60" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">
                        {contractUser.first_name} {contractUser.last_name}
                      </p>
                      {contractUser.email && (
                        <p className="text-xs text-foreground/50 truncate">{contractUser.email}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Assign user section - only visible for admins */}
          {isAdmin && companyId && (
            <AssignUserToContract
              contractId={contract.id}
              companyId={companyId}
              onUserAssigned={refreshUsers}
            />
          )}

          {/* Stripe billing portal button - only visible for admins */}
          {isAdmin && (
            <button
              type="button"
              disabled={billingLoading}
              onClick={async () => {
                setBillingLoading(true)
                setBillingError(null)
                try {
                  const returnUrl = `${window.location.origin}/mon-compte?tab=forfait`
                  const result = await createBillingPortalSession(returnUrl)
                  if (result.error) {
                    setBillingError(result.error)
                  } else if (result.url) {
                    window.location.href = result.url
                  }
                } catch {
                  setBillingError("Une erreur est survenue")
                } finally {
                  setBillingLoading(false)
                }
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1B1918] px-6 py-3.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90 disabled:opacity-50"
            >
              {billingLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Gérer sur Stripe
            </button>
          )}

          {billingError && (
            <p className="rounded-[12px] bg-destructive/10 p-3 text-sm text-destructive">{billingError}</p>
          )}
        </div>
      </div>
    </>
  )
}
