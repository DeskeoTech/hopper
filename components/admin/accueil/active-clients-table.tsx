"use client"

import { useState, useMemo, Suspense } from "react"
import Link from "next/link"
import { Users, ChevronDown } from "lucide-react"

import { DateNavigator } from "./date-navigator"
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { CompanyPaymentStatus, StripeSubscriptionStatus } from "@/lib/actions/stripe"

interface ActiveClient {
  id: string
  firstName: string | null
  lastName: string | null
  companyId: string | null
  companyName: string | null
  customerIdStripe: string | null
  siteId: string | null
  siteName: string | null
}

interface ActiveClientsTableProps {
  clients: ActiveClient[]
  selectedDate: string // YYYY-MM-DD
  paymentStatuses?: Record<string, CompanyPaymentStatus>
  subscriptionStatuses?: Record<string, StripeSubscriptionStatus>
}

interface CompanyGroup {
  companyId: string | null
  companyName: string
  customerIdStripe: string | null
  siteName: string | null
  clients: ActiveClient[]
}

const SUB_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "actif", color: "bg-success" },
  trialing: { label: "essai", color: "bg-blue-500" },
  past_due: { label: "impayé", color: "bg-destructive" },
  unpaid: { label: "impayé", color: "bg-destructive" },
  canceled: { label: "annulé", color: "bg-muted-foreground/40" },
  incomplete: { label: "incomplet", color: "bg-orange-500" },
  paused: { label: "en pause", color: "bg-orange-500" },
}

function PaymentDot({ status, subscriptionStatus }: { status: CompanyPaymentStatus; subscriptionStatus?: StripeSubscriptionStatus }) {
  // Prefer subscription status if available
  if (subscriptionStatus && SUB_STATUS_LABELS[subscriptionStatus]) {
    const config = SUB_STATUS_LABELS[subscriptionStatus]
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        Abonnement :
        <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", config.color)} />
        {config.label}
        <span className="ml-1">|</span>
      </span>
    )
  }

  // Fallback to charge-based payment status
  const dotColor = status === "ok"
    ? "bg-success"
    : status === "failed"
      ? "bg-destructive"
      : "bg-muted-foreground/40"
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      Statut du dernier paiement :
      <span className={cn("inline-block h-2 w-2 shrink-0 rounded-full", dotColor)} />
      {status}
      <span className="ml-1">|</span>
    </span>
  )
}

function CompanyGroupRow({ group, paymentStatus, subscriptionStatus }: { group: CompanyGroup; paymentStatus: CompanyPaymentStatus; subscriptionStatus?: StripeSubscriptionStatus }) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <TableRow
        className="cursor-pointer hover:bg-muted/50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <TableCell colSpan={2}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
              {group.companyId ? (
                <Link
                  href={`/admin/clients/${group.companyId}`}
                  className="font-semibold hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {group.companyName}
                </Link>
              ) : (
                <span className="font-semibold">{group.companyName}</span>
              )}
              
              <span className="text-xs text-muted-foreground">
                ({group.clients.length})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <PaymentDot status={paymentStatus} subscriptionStatus={subscriptionStatus} />
              <span className="text-sm text-muted-foreground hidden sm:inline">{group.siteName || "—"}</span>
            </div>
          </div>
        </TableCell>
      </TableRow>
      {isOpen && (
        <>
          <TableRow className="bg-muted/30">
            <TableCell className="pl-10 text-xs font-semibold uppercase text-muted-foreground" colSpan={2}>
              Nom Prénom
            </TableCell>
          </TableRow>
          {group.clients.map((client) => (
            <TableRow key={client.id} className="bg-muted/20">
              <TableCell className="pl-10 font-medium" colSpan={2}>
                {group.companyId ? (
                  <Link
                    href={`/admin/clients/${group.companyId}`}
                    className="hover:underline"
                  >
                    {client.lastName || "—"} {client.firstName || "—"}
                  </Link>
                ) : (
                  <span>{client.lastName || "—"} {client.firstName || "—"}</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </>
      )}
    </>
  )
}

export function ActiveClientsTable({ clients, selectedDate, paymentStatuses = {}, subscriptionStatuses = {} }: ActiveClientsTableProps) {
  // Grouper par entreprise
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
          clients: [client],
        })
      }
    })
    return Array.from(groups.values()).sort((a, b) =>
      a.companyName.localeCompare(b.companyName, "fr")
    )
  }, [clients])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <h2 className="type-h3 text-foreground">Clients présents</h2>
          <span className="inline-flex items-center rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {clients.length}
          </span>
        </div>
        <Suspense fallback={null}>
          <DateNavigator currentDate={selectedDate} />
        </Suspense>
      </div>

      {companyGroups.length === 0 ? (
        <div className="rounded-lg bg-card p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Aucun client avec un forfait actif aujourd&apos;hui
          </p>
        </div>
      ) : (
        <div className="rounded-lg bg-card max-h-[400px] overflow-y-auto">
          <Table>
            <TableBody>
              {companyGroups.map((group) => {
                const status: CompanyPaymentStatus = group.customerIdStripe
                  ? (paymentStatuses[group.customerIdStripe] || "none")
                  : "none"
                const subStatus = group.companyId ? subscriptionStatuses[group.companyId] : undefined
                return (
                  <CompanyGroupRow key={group.companyId || group.companyName} group={group} paymentStatus={status} subscriptionStatus={subStatus} />
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
