"use client"

import { useTranslations, useLocale } from "next-intl"
import { CreditCard, Calendar, Check } from "lucide-react"
import { useClientLayout } from "./client-layout-provider"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import type { ContractHistoryItem } from "@/lib/actions/contracts"

interface MonForfaitTabProps {
  initialContractHistory: ContractHistoryItem[] | null
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  suspended: "bg-orange-100 text-orange-700",
  terminated: "bg-gray-100 text-gray-700",
}

export function MonForfaitTab({ initialContractHistory }: MonForfaitTabProps) {
  const { plan } = useClientLayout()
  const t = useTranslations("plan")
  const tc = useTranslations("common")
  const locale = useLocale()

  const activeContract = initialContractHistory?.find((c) => c.status === "active")

  return (
    <div className="space-y-6">
      {/* Current Plan Card */}
      <div className="rounded-[16px] bg-card p-5 sm:p-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
              <CreditCard className="h-5 w-5 text-foreground/70" />
            </div>
            <h2 className="font-header text-xl font-bold uppercase tracking-tight">{t("currentPlan")}</h2>
          </div>
          {plan && (
            <span
              className={cn(
                "inline-flex rounded-full px-3 py-1.5 text-sm font-medium",
                activeContract ? statusColors[activeContract.status] : "bg-green-100 text-green-700"
              )}
            >
              {activeContract ? t(`status.${activeContract.status}`) : t("status.active")}
            </span>
          )}
        </div>

        {plan ? (
          <div className="space-y-6">
            {/* Plan name and details */}
            <div>
              <p className="text-2xl font-semibold text-foreground">{plan.name}</p>
              {activeContract?.number_of_seats && activeContract.number_of_seats > 1 && (
                <p className="mt-2 text-lg text-foreground/60">
                  {activeContract.number_of_seats} {tc("seats")}
                </p>
              )}
            </div>

            {/* Dates */}
            <div className="flex flex-col gap-5 sm:flex-row sm:flex-wrap sm:gap-8">
              {activeContract?.start_date && (
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                    <Calendar className="h-5 w-5 text-foreground/50" />
                  </div>
                  <div>
                    <p className="text-base text-foreground/50">{t("startDate")}</p>
                    <p className="text-lg font-medium">
                      {new Date(activeContract.start_date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
              {activeContract?.commitment_end_date && (
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5">
                    <Calendar className="h-5 w-5 text-foreground/50" />
                  </div>
                  <div>
                    <p className="text-base text-foreground/50">{t("commitmentEnd")}</p>
                    <p className="text-lg font-medium">
                      {new Date(activeContract.commitment_end_date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Benefits list */}
            <div className="rounded-[12px] bg-foreground/[0.03] p-5">
              <p className="mb-4 text-base font-medium uppercase text-foreground/50">{t("includedTitle")}</p>
              <ul className="space-y-4">
                <li className="flex items-center gap-4 text-lg text-foreground/80">
                  <Check className="h-6 w-6 shrink-0 text-green-600" />
                  {t("includedAccess")}
                </li>
                <li className="flex items-center gap-4 text-lg text-foreground/80">
                  <Check className="h-6 w-6 shrink-0 text-green-600" />
                  {t("includedRooms")}
                </li>
                <li className="flex items-center gap-4 text-lg text-foreground/80">
                  <Check className="h-6 w-6 shrink-0 text-green-600" />
                  {t("includedWifi")}
                </li>
              </ul>
            </div>

            {/* Manage button */}
            <button
              type="button"
              disabled
              className="w-full rounded-full bg-foreground/5 px-6 py-4 text-sm font-semibold uppercase tracking-wide text-foreground/50 transition-colors disabled:cursor-not-allowed"
            >
              {t("managePlan")}
            </button>
          </div>
        ) : (
          <p className="text-lg text-muted-foreground">{t("noPlan")}</p>
        )}
      </div>

      {/* Contract History */}
      <div className="rounded-[16px] bg-card p-5 sm:p-6">
        <h3 className="mb-5 font-header text-lg font-bold uppercase tracking-tight">{t("history")}</h3>

        {!initialContractHistory || initialContractHistory.length === 0 ? (
          <p className="text-lg text-muted-foreground">{t("noHistory")}</p>
        ) : (
          <div className="overflow-x-auto -mx-5 px-5 sm:mx-0 sm:px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-base">{t("tableHeaders.plan")}</TableHead>
                  <TableHead className="hidden sm:table-cell text-base">{t("tableHeaders.startDate")}</TableHead>
                  <TableHead className="hidden sm:table-cell text-base">{t("tableHeaders.endDate")}</TableHead>
                  <TableHead className="hidden md:table-cell text-base">{t("tableHeaders.seats")}</TableHead>
                  <TableHead className="hidden md:table-cell text-base">{t("tableHeaders.priceTtc")}</TableHead>
                  <TableHead className="text-base">{tc("status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {initialContractHistory.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell className="font-medium text-base py-4">{contract.plan_name}</TableCell>
                    <TableCell className="hidden sm:table-cell text-base py-4">
                      {contract.start_date
                        ? new Date(contract.start_date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-base py-4">
                      {contract.commitment_end_date
                        ? new Date(contract.commitment_end_date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US")
                        : "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base py-4">
                      {contract.number_of_seats ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-base py-4">
                      {contract.price_per_seat_month
                        ? `${contract.price_per_seat_month.toLocaleString(locale === "fr" ? "fr-FR" : "en-US")} €`
                        : "—"}
                    </TableCell>
                    <TableCell className="py-4">
                      <span
                        className={cn(
                          "inline-flex rounded-full px-3 py-1.5 text-sm font-medium",
                          statusColors[contract.status] || "bg-gray-100 text-gray-700"
                        )}
                      >
                        {t(`status.${contract.status}`)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
