"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Users, ChevronDown, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CompanyPaymentStatus, StripeSubscriptionStatus } from "@/lib/actions/stripe"

const ITEMS_PER_PAGE = 10

interface ActiveClient {
  id: string
  firstName: string | null
  lastName: string | null
  companyId: string | null
  companyName: string | null
  customerIdStripe: string | null
  siteId: string | null
  siteName: string | null
  planName?: string | null
}

interface ActiveClientsTableProps {
  clients: ActiveClient[]
  selectedDate: string
  dateLabel?: string
  paymentStatuses?: Record<string, CompanyPaymentStatus>
  subscriptionStatuses?: Record<string, StripeSubscriptionStatus>
  siteName?: string
}

interface CompanyGroup {
  companyId: string | null
  companyName: string
  customerIdStripe: string | null
  siteName: string | null
  planName: string | null
  clients: ActiveClient[]
}

const SUB_STATUS_LABELS: Record<string, { label: string; dotColor: string }> = {
  active: { label: "Paiement OK", dotColor: "bg-green-500" },
  trialing: { label: "Essai", dotColor: "bg-blue-500" },
  past_due: { label: "Impayé", dotColor: "bg-red-500" },
  unpaid: { label: "Impayé", dotColor: "bg-red-500" },
  canceled: { label: "Annulé", dotColor: "bg-gray-400" },
  incomplete: { label: "Incomplet", dotColor: "bg-orange-500" },
  paused: { label: "En pause", dotColor: "bg-orange-500" },
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map(w => w[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function PaymentBadge({ status, subscriptionStatus }: { status: CompanyPaymentStatus; subscriptionStatus?: StripeSubscriptionStatus }) {
  if (subscriptionStatus && SUB_STATUS_LABELS[subscriptionStatus]) {
    const config = SUB_STATUS_LABELS[subscriptionStatus]
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", config.dotColor)} />
        {config.label}
      </span>
    )
  }

  const dotColor = status === "ok"
    ? "bg-green-500"
    : status === "failed"
      ? "bg-red-500"
      : "bg-gray-400"

  const label = status === "ok"
    ? "Paiement OK"
    : status === "failed"
      ? "Échec paiement"
      : "NONE"

  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", dotColor)} />
      {label}
    </span>
  )
}

export function ActiveClientsTable({ clients, dateLabel = "aujourd'hui", paymentStatuses = {}, subscriptionStatuses = {}, siteName }: ActiveClientsTableProps) {
  const [showAll, setShowAll] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  const companyGroups = useMemo(() => {
    const groups = new Map<string, CompanyGroup>()
    clients.forEach((client) => {
      const key = client.companyId || client.companyName || "__none__"
      const existing = groups.get(key)
      if (existing) {
        existing.clients.push(client)
      } else {
        groups.set(key, {
          companyId: client.companyId,
          companyName: client.companyName || "Sans entreprise",
          customerIdStripe: client.customerIdStripe,
          siteName: client.siteName,
          planName: client.planName || null,
          clients: [client],
        })
      }
    })
    return Array.from(groups.values()).sort((a, b) =>
      a.companyName.localeCompare(b.companyName, "fr")
    )
  }, [clients])

  const visibleGroups = showAll
    ? companyGroups
    : companyGroups.slice(0, ITEMS_PER_PAGE)
  const hasMore = companyGroups.length > ITEMS_PER_PAGE

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) {
        next.delete(groupKey)
      } else {
        next.add(groupKey)
      }
      return next
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="type-h3 text-foreground">
          Clients présents {dateLabel}{siteName ? ` - ${siteName}` : ""}
        </h2>
        {hasMore && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            className="text-sm font-medium text-[#221D1A] hover:text-[#221D1A]/70"
          >
            {showAll ? "Réduire" : "Voir tout"}
          </button>
        )}
      </div>

      {companyGroups.length === 0 ? (
        <div className="rounded-[20px] bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun client avec un forfait actif {dateLabel}
          </p>
        </div>
      ) : (
        <div className="rounded-[20px] bg-card">
          <div className="divide-y divide-gray-100">
            {visibleGroups.map((group) => {
              const groupKey = group.companyId || group.companyName
              const isExpanded = expandedGroups.has(groupKey)
              const paymentStatus: CompanyPaymentStatus = group.customerIdStripe
                ? (paymentStatuses[group.customerIdStripe] || "none")
                : "none"
              const subStatus = group.companyId ? subscriptionStatuses[group.companyId] : undefined

              return (
                <div key={groupKey}>
                  {/* Company row */}
                  <button
                    type="button"
                    onClick={() => toggleGroup(groupKey)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-gray-50/50 sm:px-6"
                  >
                    {/* Initials avatar */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs font-bold text-gray-500">
                      {getInitials(group.companyName)}
                    </div>

                    {/* Company info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate font-bold text-foreground">
                          {group.companyName}
                        </span>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          ({group.clients.length})
                        </span>
                      </div>
                      {group.planName && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {group.planName}
                        </p>
                      )}
                    </div>

                    {/* Payment status */}
                    <div className="hidden shrink-0 sm:block">
                      <PaymentBadge status={paymentStatus} subscriptionStatus={subStatus} />
                    </div>

                    {/* Site name */}
                    <span className="hidden shrink-0 text-sm text-muted-foreground lg:inline min-w-[140px] text-right">
                      {group.siteName || "—"}
                    </span>

                    {/* Chevron */}
                    <ChevronDown className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      isExpanded && "rotate-180"
                    )} />
                  </button>

                  {/* Expanded user list */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 bg-gray-50/30 px-5 py-2 sm:px-6">
                      {group.clients.map((client) => {
                        const fullName = [client.firstName, client.lastName].filter(Boolean).join(" ") || "Utilisateur"
                        return (
                          <Link
                            key={client.id}
                            href={group.companyId ? `/admin/clients/${group.companyId}` : "#"}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-white"
                          >
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200/60">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                            <span className="text-sm text-foreground">{fullName}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </section>
  )
}
