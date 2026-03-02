"use client"

import { useMemo, useState } from "react"
import { useTranslations, useLocale } from "next-intl"
import { ArrowDown, ArrowUp, Coins, ShoppingCart } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"
import { useClientLayout } from "./client-layout-provider"
import { AdminContactDialog } from "./admin-contact-dialog"
import type { CreditMovementType } from "@/lib/types/database"

const typeColors: Record<CreditMovementType | "purchase", string> = {
  reservation: "bg-blue-100 text-blue-700",
  cancellation: "bg-orange-100 text-orange-700",
  adjustment: "bg-purple-100 text-purple-700",
  purchase: "bg-green-100 text-green-700",
  allocation: "bg-teal-100 text-teal-700",
  expiration: "bg-red-100 text-red-700",
}

export function MesCreditsTab() {
  const { credits, creditMovements, user, isAdmin, companyAdmin } = useClientLayout()
  const t = useTranslations("creditsTab")
  const locale = useLocale()
  const [typeFilter, setTypeFilter] = useState("all")

  const filterOptions = [
    { value: "all", label: t("types.all") },
    { value: "reservation", label: t("types.reservation") },
    { value: "cancellation", label: t("types.cancellation") },
    { value: "adjustment", label: t("types.adjustment") },
    { value: "purchase", label: t("types.purchase") },
    { value: "allocation", label: t("types.allocation") },
    { value: "expiration", label: t("types.expiration") },
  ]
  const [adminDialogOpen, setAdminDialogOpen] = useState(false)

  const handleBuyCredits = () => {
    if (!isAdmin) {
      setAdminDialogOpen(true)
      return
    }
    const stripeUrl = `https://buy.stripe.com/5kQeVf6455TeaCt8wBgIo01?prefilled_email=${encodeURIComponent(user.email || "")}`
    window.open(stripeUrl, "_blank")
  }

  const filteredMovements = useMemo(() => {
    if (typeFilter === "all") return creditMovements
    return creditMovements.filter((m) => m.type === typeFilter)
  }, [creditMovements, typeFilter])

  return (
    <div className="space-y-6">
      {/* Credit Balance Card */}
      <div className="rounded-[16px] bg-card p-5 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm sm:text-xs text-muted-foreground">{t("currentBalance")}</p>
            <p className="text-3xl sm:text-2xl font-bold text-foreground">
              {credits?.remaining ?? 0}
            </p>
          </div>
          <div className="flex h-12 w-12 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Coins className="h-6 w-6 sm:h-5 sm:w-5 text-foreground/70" />
          </div>
        </div>
      </div>

      {/* Buy Credits Button */}
      <button
        type="button"
        className="flex w-full items-center justify-center gap-2 rounded-full bg-[#1B1918] px-6 py-4 sm:py-3.5 text-base sm:text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90"
        onClick={handleBuyCredits}
      >
        <ShoppingCart className="h-5 w-5 sm:h-4 sm:w-4" />
        {t("buyCredits")}
      </button>

      {/* Admin Contact Dialog for non-admin users */}
      <AdminContactDialog
        open={adminDialogOpen}
        onOpenChange={setAdminDialogOpen}
        admin={companyAdmin}
        actionType="credits"
      />

      {/* Credits History */}
      <div className="rounded-[16px] bg-card p-4 sm:p-6">
        <h3 className="mb-4 font-header text-xl sm:text-lg font-bold uppercase tracking-tight">{t("history")}</h3>

        {creditMovements.length === 0 ? (
          <p className="text-base sm:text-sm text-muted-foreground">{t("noMovements")}</p>
        ) : (
          <div className="space-y-4">
            {/* Filter */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <SearchableSelect
                options={filterOptions}
                value={typeFilter}
                onValueChange={setTypeFilter}
                placeholder={t("filterByType")}
                searchPlaceholder={t("searchType")}
                triggerClassName="w-full sm:w-[200px]"
              />
            </div>

            {/* Mobile: Card layout */}
            <div className="space-y-2.5 sm:hidden">
              {filteredMovements.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-4">{t("noMovementsFilter")}</p>
              ) : (
                filteredMovements.map((movement) => (
                  <div key={movement.id} className="rounded-[12px] bg-foreground/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                          typeColors[movement.type as CreditMovementType | "purchase"]
                        )}
                      >
                        {t(`types.${movement.type}`)}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-base font-bold",
                          movement.amount > 0 ? "text-green-600" : "text-red-600"
                        )}
                      >
                        {movement.amount > 0 ? (
                          <>
                            <ArrowUp className="h-4 w-4" />+{movement.amount}
                          </>
                        ) : (
                          <>
                            <ArrowDown className="h-4 w-4" />
                            {movement.amount}
                          </>
                        )}
                      </span>
                    </div>
                    {movement.description && (
                      <p className="text-sm text-foreground/70 mb-1.5 line-clamp-2">{movement.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(movement.date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}</span>
                      <span>{t("tableHeaders.balanceAfter")}: {movement.balance_after}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop: Table */}
            <div className="hidden sm:block overflow-x-auto rounded-[12px] bg-foreground/[0.02]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("tableHeaders.date")}</TableHead>
                    <TableHead>{t("tableHeaders.type")}</TableHead>
                    <TableHead className="text-right">{t("tableHeaders.amount")}</TableHead>
                    <TableHead className="hidden md:table-cell">{t("tableHeaders.reason")}</TableHead>
                    <TableHead className="text-right">{t("tableHeaders.balanceAfter")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        {t("noMovementsFilter")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredMovements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(movement.date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex rounded-sm px-2 py-0.5 text-xs font-medium",
                              typeColors[movement.type as CreditMovementType | "purchase"]
                            )}
                          >
                            {t(`types.${movement.type}`)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 font-medium",
                              movement.amount > 0 ? "text-green-600" : "text-red-600"
                            )}
                          >
                            {movement.amount > 0 ? (
                              <>
                                <ArrowUp className="h-3 w-3" />+{movement.amount}
                              </>
                            ) : (
                              <>
                                <ArrowDown className="h-3 w-3" />
                                {movement.amount}
                              </>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px] truncate">
                          {movement.description}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {movement.balance_after}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
