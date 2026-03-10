"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Building2,
  ChevronDown,
  Coins,
  FileText,
  Users,
  Shield,
  UserCircle,
  Plus,
  Loader2,
  Check,
  X,
  Globe,
  Search,
  UserMinus,
  Coffee,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  getCompanyUsers,
  getCompanySeatsInfo,
  createUserByAdmin,
  removeUserFromCompany,
} from "@/lib/actions/users"
import { assignUserToContract, assignUserToCafeContract, toggleOffPlatformLink } from "@/lib/actions/user-contracts"
import { ContractDetailModal } from "./contract-detail-modal"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { cn } from "@/lib/utils"
import type { Company, ContractForDisplay } from "@/lib/types/database"
import type { ContractWithSeats, CafeContractWithSeats, UserWithContract, CompanyCreditTransaction } from "@/app/(client)/entreprise/page"

const txTypeColors: Record<string, string> = {
  allocation: "bg-teal-100 text-teal-700",
  consumption: "bg-red-100 text-red-700",
  cancellation: "bg-orange-100 text-orange-700",
  adjustment: "bg-purple-100 text-purple-700",
  expiration: "bg-red-100 text-red-700",
  refund: "bg-green-100 text-green-700",
}

const txTypeLabels: Record<string, string> = {
  allocation: "Allocation",
  consumption: "Consommation",
  cancellation: "Annulation",
  adjustment: "Ajustement",
  expiration: "Expiration",
  refund: "Remboursement",
}

interface EntreprisePageProps {
  company: Company
  contracts: ContractWithSeats[]
  cafeContracts?: CafeContractWithSeats[]
  users: UserWithContract[]
  currentUserId: string
  spacebringSeats?: number
  offPlatformPlanName?: string | null
  offPlatformLinkedCount?: number
  creditTransactions?: CompanyCreditTransaction[]
  creditBalance?: number
}

export function EntreprisePage({
  company,
  contracts: initialContracts,
  cafeContracts: initialCafeContracts = [],
  users: initialUsers,
  currentUserId,
  spacebringSeats = 0,
  offPlatformPlanName = null,
  offPlatformLinkedCount = 0,
  creditTransactions = [],
  creditBalance = 0,
}: EntreprisePageProps) {
  const t = useTranslations("company")
  const tc = useTranslations("common")
  const locale = useLocale()

  const [users, setUsers] = useState(initialUsers)
  const [contracts, setContracts] = useState(initialContracts)
  const [cafeContracts, setCafeContracts] = useState(initialCafeContracts)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  // Add user form state
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [newUserFirstName, setNewUserFirstName] = useState("")
  const [newUserLastName, setNewUserLastName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")

  // User detail modal state
  const [selectedUser, setSelectedUser] = useState<UserWithContract | null>(null)

  // Link contract modal state (opened from user detail)
  const [linkContractOpen, setLinkContractOpen] = useState(false)

  // Link café contract modal state
  const [linkCafeOpen, setLinkCafeOpen] = useState(false)

  // No seats dialog state
  const [noSeatsDialogOpen, setNoSeatsDialogOpen] = useState(false)

  // User search state
  const [userSearch, setUserSearch] = useState("")

  // Remove user confirmation state
  const [removeUserConfirmOpen, setRemoveUserConfirmOpen] = useState(false)
  const [removingUser, setRemovingUser] = useState(false)

  // Contract detail modal state
  const [selectedContract, setSelectedContract] = useState<ContractForDisplay | null>(null)
  const [creditsHistoryOpen, setCreditsHistoryOpen] = useState(false)
  const [creditTypeFilter, setCreditTypeFilter] = useState("all")

  // Off-platform seat tracking
  const [offPlatformCount, setOffPlatformCount] = useState(offPlatformLinkedCount)

  const creditFilterOptions = [
    { value: "all", label: "Tous" },
    { value: "allocation", label: "Allocation" },
    { value: "consumption", label: "Consommation" },
    { value: "cancellation", label: "Annulation" },
    { value: "refund", label: "Remboursement" },
    { value: "adjustment", label: "Ajustement" },
    { value: "expiration", label: "Expiration" },
  ]

  const filteredCreditTransactions = creditTypeFilter === "all"
    ? creditTransactions
    : creditTransactions.filter((tx) => tx.type === creditTypeFilter)

  // Calculate seats info from contracts + off-platform subscription
  const contractSeats = contracts.reduce((sum, c) => sum + c.total_seats, 0)
  const totalSeats = contractSeats > 0 ? contractSeats + spacebringSeats : spacebringSeats
  const activeUsers = users.filter((u) => u.status === "active").length

  const hasOffPlatform = spacebringSeats > 0

  const handleContractChange = async (userId: string, contractId: string | null) => {
    setUpdatingUserId(userId)
    setError(null)

    const result = await assignUserToContract(userId, contractId)
    if (result.error) {
      setError(result.error)
    } else {
      const contract = contracts.find((c) => c.id === contractId)
      const contractName = contract?.plan_name || null

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, contract_id: contractId, contract_name: contractName }
            : u
        )
      )

      const oldUser = users.find((u) => u.id === userId)
      const oldContractId = oldUser?.contract_id

      setContracts((prev) =>
        prev.map((c) => {
          if (c.id === oldContractId) {
            return { ...c, assigned_seats: Math.max(0, c.assigned_seats - 1) }
          }
          if (c.id === contractId) {
            return { ...c, assigned_seats: c.assigned_seats + 1 }
          }
          return c
        })
      )

      // Update selected user if open
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev ? { ...prev, contract_id: contractId, contract_name: contractName } : prev
        )
      }
    }
    setUpdatingUserId(null)
  }

  const handleToggleOffPlatform = async (userId: string, linked: boolean) => {
    setUpdatingUserId(userId)
    setError(null)

    const result = await toggleOffPlatformLink(userId, linked)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, off_platform_linked: linked } : u
        )
      )
      setOffPlatformCount((prev) => linked ? prev + 1 : Math.max(0, prev - 1))

      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev ? { ...prev, off_platform_linked: linked } : prev
        )
      }
    }
    setUpdatingUserId(null)
  }

  const handleLinkContract = async (contractId: string) => {
    if (!selectedUser) return
    await handleContractChange(selectedUser.id, contractId)
    setLinkContractOpen(false)
  }

  const handleCafeContractChange = async (userId: string, cafeContractId: string | null) => {
    setUpdatingUserId(userId)
    setError(null)

    const result = await assignUserToCafeContract(userId, cafeContractId)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, cafe_contract_id: cafeContractId } : u
        )
      )

      const oldUser = users.find((u) => u.id === userId)
      const oldCafeContractId = oldUser?.cafe_contract_id

      setCafeContracts((prev) =>
        prev.map((c) => {
          if (c.id === oldCafeContractId) {
            return { ...c, assigned_seats: Math.max(0, c.assigned_seats - 1) }
          }
          if (c.id === cafeContractId) {
            return { ...c, assigned_seats: c.assigned_seats + 1 }
          }
          return c
        })
      )

      if (selectedUser?.id === userId) {
        setSelectedUser((prev) =>
          prev ? { ...prev, cafe_contract_id: cafeContractId } : prev
        )
      }
    }
    setUpdatingUserId(null)
  }

  const handleLinkCafeContract = async (cafeContractId: string) => {
    if (!selectedUser) return
    await handleCafeContractChange(selectedUser.id, cafeContractId)
    setLinkCafeOpen(false)
  }

  const handleAddUser = async () => {
    if (!company.id) return
    setAddingUser(true)
    setError(null)

    const result = await createUserByAdmin(company.id, {
      first_name: newUserFirstName || null,
      last_name: newUserLastName || null,
      email: newUserEmail || null,
      phone: null,
      role: "user",
    })

    if (result.error) {
      setError(result.error)
    } else {
      const usersResult = await getCompanyUsers(company.id)
      if (usersResult.data) {
        setUsers(usersResult.data.map((u) => ({ ...u, contract_name: null })))
      }
      setNewUserFirstName("")
      setNewUserLastName("")
      setNewUserEmail("")
      setAddUserOpen(false)
    }

    setAddingUser(false)
  }

  const handleRemoveUser = async () => {
    if (!selectedUser || !company.id) return
    setRemovingUser(true)
    setError(null)

    const result = await removeUserFromCompany(selectedUser.id, company.id)
    if (result.error) {
      setError(result.error)
    } else {
      // Remove user from local state
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id))

      // Update contract seat counts if user had a contract
      if (selectedUser.contract_id) {
        setContracts((prev) =>
          prev.map((c) =>
            c.id === selectedUser.contract_id
              ? { ...c, assigned_seats: Math.max(0, c.assigned_seats - 1) }
              : c
          )
        )
      }

      // Update café contract seat counts if user had a café contract
      if (selectedUser.cafe_contract_id) {
        setCafeContracts((prev) =>
          prev.map((c) =>
            c.id === selectedUser.cafe_contract_id
              ? { ...c, assigned_seats: Math.max(0, c.assigned_seats - 1) }
              : c
          )
        )
      }

      // Update off-platform count if user was linked
      if (selectedUser.off_platform_linked) {
        setOffPlatformCount((prev) => Math.max(0, prev - 1))
      }

      setSelectedUser(null)
    }

    setRemovingUser(false)
    setRemoveUserConfirmOpen(false)
  }

  const progressValue = totalSeats > 0 ? (activeUsers / totalSeats) * 100 : 0

  const getCompanyTypeLabel = (type: string | null) => {
    switch (type) {
      case "self_employed":
        return t("companyType.selfEmployed")
      case "multi_employee":
        return t("companyType.company")
      default:
        return "—"
    }
  }

  const formatDateRange = (start: string | null, end: string | null) => {
    const fmtDate = (date: string) => {
      return new Date(date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }
    if (start && end) {
      return `${fmtDate(start)} → ${fmtDate(end)}`
    }
    if (start) {
      return t("dateRange.since", { date: fmtDate(start) })
    }
    if (end) {
      return t("dateRange.until", { date: fmtDate(end) })
    }
    return null
  }

  const getUserName = (user: UserWithContract) =>
    [user.first_name, user.last_name].filter(Boolean).join(" ") || "—"

  const filteredUsers = userSearch.trim()
    ? users.filter((user) => {
        const q = userSearch.toLowerCase()
        const name = [user.first_name, user.last_name].filter(Boolean).join(" ").toLowerCase()
        return name.includes(q) || (user.email?.toLowerCase().includes(q) ?? false)
      })
    : users

  return (
    <div className="min-h-screen bg-[#f0e8dc]">
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      {/* Back link */}
      <Link
        href="/compte"
        className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/50 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {tc("back")}
      </Link>

      <div className="space-y-6">
        {/* Section 1: Company Info */}
        <div className="rounded-[16px] bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
              <Building2 className="h-5 w-5 text-foreground/70" />
            </div>
            <div>
              <h1 className="font-header text-lg font-bold uppercase tracking-tight">
                {company.name || t("myCompany")}
              </h1>
              <p className="text-xs text-foreground/50">
                {getCompanyTypeLabel(company.company_type)}
              </p>
            </div>
          </div>

          {company.address && (
            <p className="text-sm text-foreground/70">{company.address}</p>
          )}
        </div>

        {/* Section 2: Contracts */}
        <div className="rounded-[16px] bg-card p-4 sm:p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
              <FileText className="h-5 w-5 text-foreground/70" />
            </div>
            <h2 className="font-header text-lg font-bold uppercase tracking-tight">
              {t("pass")}
            </h2>
          </div>

          {contracts.length === 0 && !hasOffPlatform ? (
            <p className="text-sm text-foreground/50">{t("noActivePass")}</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contracts.map((contract) => {
                const progressPercent =
                  contract.total_seats > 0
                    ? (contract.assigned_seats / contract.total_seats) * 100
                    : 0

                return (
                  <button
                    key={contract.id}
                    type="button"
                    onClick={() =>
                      setSelectedContract({
                        id: contract.id,
                        status: contract.status,
                        start_date: contract.start_date,
                        end_date: contract.end_date,
                        plan_name: contract.plan_name,
                        plan_recurrence: contract.plan_recurrence,
                        site_name: null,
                        number_of_seats: contract.total_seats,
                      })
                    }
                    className="rounded-[12px] bg-background/50 p-4 text-left transition-colors hover:bg-foreground/5 cursor-pointer"
                  >
                    <div className="mb-2">
                      <h3 className="font-medium text-sm">{contract.plan_name}</h3>
                      {(contract.start_date || contract.end_date) && (
                        <p className="text-xs text-foreground/50">
                          {formatDateRange(contract.start_date, contract.end_date)}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-foreground/50">{t("seatsUsed")}</span>
                        <span className="font-medium text-foreground/70">
                          {contract.assigned_seats} / {contract.total_seats}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  </button>
                )
              })}

              {/* Off-platform subscription card */}
              {hasOffPlatform && (
                <div className="rounded-[12px] bg-background/50 p-4">
                  <div className="mb-2">
                    <div className="flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-foreground/40" />
                      <h3 className="font-medium text-sm">
                        {offPlatformPlanName || "Hors plateforme"}
                      </h3>
                    </div>
                    <p className="text-xs text-foreground/40 mt-0.5">Abonnement hors plateforme</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-foreground/50">{t("seatsUsed")}</span>
                      <span className="font-medium text-foreground/70">
                        {offPlatformCount} / {spacebringSeats}
                      </span>
                    </div>
                    <Progress
                      value={spacebringSeats > 0 ? (offPlatformCount / spacebringSeats) * 100 : 0}
                      className="h-1.5"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Section 3: Credits */}
        <div className="rounded-[16px] bg-card">
          <div className="flex items-center gap-3 p-4 sm:p-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
              <Coins className="h-5 w-5 text-foreground/70" />
            </div>
            <div className="flex-1">
              <h2 className="font-header text-lg font-bold uppercase tracking-tight">
                Crédits
              </h2>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{creditBalance}</p>
              <p className="text-xs text-foreground/50">crédits disponibles</p>
            </div>
          </div>

          {creditTransactions.length > 0 && (
            <>
              <div className="mx-4 sm:mx-6 border-t border-foreground/10" />
              <button
                type="button"
                onClick={() => setCreditsHistoryOpen((v) => !v)}
                className="flex w-full items-center justify-between px-4 py-3 sm:px-6 sm:py-3"
              >
                <span className="text-sm font-medium text-foreground/60">Historique des mouvements</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-foreground/40 transition-transform duration-200",
                    creditsHistoryOpen && "rotate-180"
                  )}
                />
              </button>

              <div
                className={cn(
                  "overflow-hidden transition-all duration-200",
                  creditsHistoryOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                )}
              >
                <div className="px-4 pb-2 sm:px-6">
                  <SearchableSelect
                    options={creditFilterOptions}
                    value={creditTypeFilter}
                    onValueChange={setCreditTypeFilter}
                    placeholder="Filtrer par type"
                    searchPlaceholder="Rechercher..."
                    triggerClassName="w-full sm:w-[200px]"
                  />
                </div>
                <div className="max-h-[480px] space-y-2 overflow-y-auto px-4 pb-4 sm:px-6 sm:pb-6">
                  {filteredCreditTransactions.length === 0 ? (
                    <p className="text-center text-sm text-foreground/40 py-4">Aucun mouvement pour ce filtre.</p>
                  ) : filteredCreditTransactions.map((tx, i) => {
                    const txDate = new Date(tx.date)
                    const monthKey = `${txDate.getFullYear()}-${txDate.getMonth()}`
                    const prevTx = i > 0 ? filteredCreditTransactions[i - 1] : null
                    const prevDate = prevTx ? new Date(prevTx.date) : null
                    const prevMonthKey = prevDate ? `${prevDate.getFullYear()}-${prevDate.getMonth()}` : null
                    const showMonthHeader = monthKey !== prevMonthKey

                    return (
                      <div key={tx.id}>
                        {showMonthHeader && (
                          <p className={cn("text-xs font-semibold uppercase text-foreground/40 tracking-wide", i > 0 && "mt-3 mb-1")}>
                            {txDate.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { month: "long", year: "numeric" })}
                          </p>
                        )}
                        <div className="rounded-[12px] bg-background/50 p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-1.5">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
                                txTypeColors[tx.type] || "bg-gray-100 text-gray-700"
                              )}
                            >
                              {txTypeLabels[tx.type] || tx.type}
                            </span>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 text-sm font-bold",
                                tx.amount > 0 ? "text-green-600" : "text-red-600"
                              )}
                            >
                              {tx.amount > 0 ? (
                                <><ArrowUp className="h-3.5 w-3.5" />+{tx.amount}</>
                              ) : (
                                <><ArrowDown className="h-3.5 w-3.5" />{tx.amount}</>
                              )}
                            </span>
                          </div>
                          {tx.reason && (
                            <p className="text-xs text-foreground/70 mb-1 line-clamp-2">{tx.reason}</p>
                          )}
                          <div className="flex items-center justify-between text-[11px] text-foreground/40">
                            <div className="flex items-center gap-2">
                              <span>
                                {txDate.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {tx.userName && (
                                <span>· {tx.userName}</span>
                              )}
                            </div>
                            <span>Solde : {tx.balance_after}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {creditTransactions.length === 0 && (
            <p className="px-4 pb-4 sm:px-6 sm:pb-6 text-sm text-foreground/50">Aucun mouvement de crédits.</p>
          )}
        </div>

        {/* Section 4: Users */}
        <div className="rounded-[16px] bg-card p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <Users className="h-5 w-5 text-foreground/70" />
              </div>
              <h2 className="font-header text-lg font-bold uppercase tracking-tight">
                {t("users")}
              </h2>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {totalSeats > 0 && (
                <div className="flex-1 min-w-[150px] max-w-[200px]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-foreground/50">{t("seatsOccupied")}</span>
                    <span className="font-medium text-foreground/70">
                      {activeUsers} / {totalSeats}
                    </span>
                  </div>
                  <Progress value={progressValue} className="h-1.5" />
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  if (activeUsers >= totalSeats) {
                    setNoSeatsDialogOpen(true)
                  } else {
                    setAddUserOpen(true)
                  }
                }}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1B1918] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90"
              >
                <Plus className="h-3.5 w-3.5" />
                {tc("add")}
              </button>
            </div>
          </div>

          {users.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/30" />
              <Input
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder={t("searchUsers")}
                className="rounded-full bg-background/50 pl-9 text-sm"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-[12px] bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {users.length === 0 ? (
            <p className="text-sm text-foreground/50">{t("noUsers")}</p>
          ) : filteredUsers.length === 0 ? (
            <p className="text-sm text-foreground/50">{t("noSearchResults")}</p>
          ) : (
            <div className="max-h-[720px] space-y-2 overflow-y-auto">
              {filteredUsers.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const isDisabled = user.status === "inactive"
                const userName = getUserName(user)
                const hasContract = !!user.contract_id
                const hasCafeContract = !!user.cafe_contract_id
                const hasOffPlatformLink = user.off_platform_linked
                const hasAnyLink = hasContract || hasCafeContract || hasOffPlatformLink

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => !isDisabled && setSelectedUser(user)}
                    disabled={isDisabled}
                    className={cn(
                      "flex w-full flex-col gap-3 rounded-[12px] bg-background/50 p-3 text-left transition-colors sm:flex-row sm:items-center",
                      !isDisabled && "cursor-pointer hover:bg-foreground/5",
                      isDisabled && "opacity-50"
                    )}
                  >
                    {/* Avatar/Icon + User info */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                        {user.role === "admin" ? (
                          <Shield className="h-4 w-4 text-foreground/40" />
                        ) : (
                          <UserCircle className="h-4 w-4 text-foreground/40" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-foreground">
                            {userName}
                          </span>
                          {isCurrentUser && (
                            <span className="text-[10px] text-foreground/40">{t("youLabel")}</span>
                          )}
                          {user.role === "admin" && (
                            <span className="inline-flex items-center rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-medium text-foreground/70">
                              {t("companyAdmin")}
                            </span>
                          )}
                        </div>
                        <p className="truncate text-xs text-foreground/50">
                          {user.email || "—"}
                        </p>
                      </div>
                    </div>

                    {/* Pass badges */}
                    <div className="flex shrink-0 items-center gap-1.5 flex-wrap">
                      {hasContract && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-foreground/60">
                          <FileText className="h-3 w-3" />
                          {user.contract_name || t("pass")}
                        </span>
                      )}
                      {hasCafeContract && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-foreground/60">
                          <Coffee className="h-3 w-3" />
                          Café
                        </span>
                      )}
                      {hasOffPlatformLink && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-[11px] font-medium text-foreground/60">
                          <Globe className="h-3 w-3" />
                          Hors plateforme
                        </span>
                      )}
                      {!hasAnyLink && !isDisabled && (
                        <span className="text-xs text-foreground/30">
                          {t("linkToPass")}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent>
          {selectedUser && (() => {
            const userName = getUserName(selectedUser)
            const isUpdating = updatingUserId === selectedUser.id
            const hasContract = !!selectedUser.contract_id
            const hasCafe = !!selectedUser.cafe_contract_id
            const cafeContractName = hasCafe
              ? cafeContracts.find((c) => c.id === selectedUser.cafe_contract_id)?.plan_name || "Forfait café"
              : null
            const hasOffPlatformLink = selectedUser.off_platform_linked
            const offPlatformFull = offPlatformCount >= spacebringSeats

            return (
              <>
                <DialogHeader>
                  <DialogTitle>{userName}</DialogTitle>
                  <DialogDescription>{selectedUser.email || "—"}</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                  {/* Platform contracts */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">
                      {t("pass")}
                    </p>

                    {hasContract ? (
                      <div className="flex items-center justify-between rounded-[12px] bg-foreground/5 p-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-foreground/40" />
                          <span className="text-sm font-medium">
                            {selectedUser.contract_name || t("pass")}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleContractChange(selectedUser.id, null)}
                          disabled={isUpdating}
                          className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <X className="h-3 w-3" />
                          )}
                          {t("removeFromPass")}
                        </button>
                      </div>
                    ) : contracts.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setLinkContractOpen(true)}
                        disabled={isUpdating || contracts.every((c) => c.assigned_seats >= c.total_seats)}
                        className="flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-foreground/15 p-3 text-xs font-medium text-foreground/50 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t("linkToPass")}
                      </button>
                    ) : (
                      <p className="text-sm text-foreground/40">{t("noActivePass")}</p>
                    )}
                  </div>

                  {/* Café subscription */}
                  {cafeContracts.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">
                        Forfait café
                      </p>

                      {hasCafe ? (
                        <div className="flex items-center justify-between rounded-[12px] bg-foreground/5 p-3">
                          <div className="flex items-center gap-2">
                            <Coffee className="h-4 w-4 text-foreground/40" />
                            <span className="text-sm font-medium">
                              {cafeContractName}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCafeContractChange(selectedUser.id, null)}
                            disabled={isUpdating}
                            className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            Retirer
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setLinkCafeOpen(true)}
                          disabled={isUpdating || cafeContracts.every((c) => c.assigned_seats >= c.total_seats)}
                          className="flex w-full items-center justify-center gap-1.5 rounded-[12px] border border-dashed border-foreground/15 p-3 text-xs font-medium text-foreground/50 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Attribuer un forfait café
                        </button>
                      )}
                    </div>
                  )}

                  {/* Off-platform subscription */}
                  {hasOffPlatform && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40 mb-2">
                        Abonnement hors plateforme
                      </p>

                      {hasOffPlatformLink ? (
                        <div className="flex items-center justify-between rounded-[12px] bg-foreground/5 p-3">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-foreground/40" />
                            <div>
                              <span className="text-sm font-medium">
                                {offPlatformPlanName || "Hors plateforme"}
                              </span>
                              <p className="text-[11px] text-foreground/40">
                                {offPlatformCount} / {spacebringSeats} {t("seatsUsed").toLowerCase()}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleOffPlatform(selectedUser.id, false)}
                            disabled={isUpdating}
                            className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            {isUpdating ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                            Délier
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleToggleOffPlatform(selectedUser.id, true)}
                          disabled={isUpdating || offPlatformFull}
                          className="flex w-full items-center justify-between rounded-[12px] border border-dashed border-foreground/15 p-3 transition-colors hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-foreground/30" />
                            <span className="text-xs font-medium text-foreground/50">
                              {offPlatformPlanName || "Hors plateforme"}
                            </span>
                          </div>
                          {offPlatformFull ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-600">
                              <Check className="h-3 w-3" />
                              {t("full")}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-foreground/50">
                              <Plus className="h-3 w-3" />
                              Lier
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Remove from company */}
                {selectedUser.id !== currentUserId && (
                  <div className="border-t border-foreground/10 pt-4">
                    <button
                      type="button"
                      onClick={() => setRemoveUserConfirmOpen(true)}
                      disabled={isUpdating}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <UserMinus className="h-4 w-4" />
                      {t("removeUser.button")}
                    </button>
                  </div>
                )}

                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
                  >
                    {tc("close")}
                  </button>
                </DialogFooter>
              </>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Remove User Confirmation Dialog */}
      <Dialog open={removeUserConfirmOpen} onOpenChange={setRemoveUserConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("removeUser.title")}</DialogTitle>
            <DialogDescription>
              {selectedUser && t("removeUser.description", { name: getUserName(selectedUser) })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setRemoveUserConfirmOpen(false)}
              disabled={removingUser}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10 disabled:opacity-50"
            >
              {tc("cancel")}
            </button>
            <button
              type="button"
              onClick={handleRemoveUser}
              disabled={removingUser}
              className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {removingUser ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("removeUser.removing")}
                </>
              ) : (
                t("removeUser.confirm")
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Contract Dialog (from user detail) */}
      <Dialog open={linkContractOpen} onOpenChange={setLinkContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("linkPassDialog.title")}</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  {t("linkPassDialog.selectPass")}{" "}
                  <span className="font-medium">
                    {getUserName(selectedUser)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {contracts.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center py-4">
                {t("linkPassDialog.noPass")}
              </p>
            ) : (
              contracts.map((contract) => {
                const isFull = contract.assigned_seats >= contract.total_seats
                const availableSeats = contract.total_seats - contract.assigned_seats

                return (
                  <button
                    key={contract.id}
                    type="button"
                    onClick={() => handleLinkContract(contract.id)}
                    disabled={isFull || updatingUserId === selectedUser?.id}
                    className="flex w-full items-center justify-between rounded-[12px] bg-foreground/5 p-4 text-left transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div>
                      <p className="font-medium text-sm">{contract.plan_name}</p>
                      <p className="text-xs text-foreground/50">
                        {contract.assigned_seats} / {contract.total_seats} {t("seatsUsed").toLowerCase()}
                      </p>
                    </div>
                    {isFull ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-600">
                        <Check className="h-3 w-3" />
                        {t("full")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-600">
                        {t("available", { count: availableSeats })}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setLinkContractOpen(false)}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              {tc("cancel")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Café Contract Dialog */}
      <Dialog open={linkCafeOpen} onOpenChange={setLinkCafeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Attribuer un forfait café</DialogTitle>
            <DialogDescription>
              {selectedUser && (
                <>
                  Choisissez un forfait café pour{" "}
                  <span className="font-medium">
                    {getUserName(selectedUser)}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {cafeContracts.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center py-4">
                Aucun forfait café actif
              </p>
            ) : (
              cafeContracts.map((contract) => {
                const isFull = contract.assigned_seats >= contract.total_seats
                const availableSeats = contract.total_seats - contract.assigned_seats

                return (
                  <button
                    key={contract.id}
                    type="button"
                    onClick={() => handleLinkCafeContract(contract.id)}
                    disabled={isFull || updatingUserId === selectedUser?.id}
                    className="flex w-full items-center justify-between rounded-[12px] bg-foreground/5 p-4 text-left transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <div className="flex items-center gap-2">
                      <Coffee className="h-4 w-4 text-foreground/40" />
                      <div>
                        <p className="font-medium text-sm">{contract.plan_name}</p>
                        <p className="text-xs text-foreground/50">
                          {contract.assigned_seats} / {contract.total_seats} {t("seatsUsed").toLowerCase()}
                        </p>
                      </div>
                    </div>
                    {isFull ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-600">
                        <Check className="h-3 w-3" />
                        {t("full")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-600">
                        {t("available", { count: availableSeats })}
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setLinkCafeOpen(false)}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              {tc("cancel")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addUserOpen} onOpenChange={setAddUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("addUser.title")}</DialogTitle>
            <DialogDescription>
              {t("addUser.description")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">{tc("firstName")}</Label>
                <Input
                  id="firstName"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  placeholder={tc("firstName")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">{tc("lastName")}</Label>
                <Input
                  id="lastName"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  placeholder={tc("lastName")}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{tc("email")}</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder={tc("email")}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setAddUserOpen(false)}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              {tc("cancel")}
            </button>
            <button
              type="button"
              onClick={handleAddUser}
              disabled={addingUser}
              className="flex items-center gap-2 rounded-full bg-[#1B1918] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90 disabled:opacity-50"
            >
              {addingUser ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {tc("creating")}
                </>
              ) : (
                tc("create")
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contract Detail Modal */}
      <ContractDetailModal
        contract={selectedContract}
        open={!!selectedContract}
        onOpenChange={(open) => !open && setSelectedContract(null)}
      />

      {/* No Seats Dialog */}
      <Dialog open={noSeatsDialogOpen} onOpenChange={setNoSeatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("seatsQuota.title")}</DialogTitle>
            <DialogDescription>
              {t("seatsQuota.message")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setNoSeatsDialogOpen(false)}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              {tc("close")}
            </button>
            <button
              type="button"
              onClick={() => {
                const currentUserEmail = users.find((u) => u.id === currentUserId)?.email || ""
                const url = `https://hopper-coworking.com/?email_user=${encodeURIComponent(currentUserEmail)}`
                window.open(url, "_blank")
              }}
              className="flex items-center gap-2 rounded-full bg-[#1B1918] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90"
            >
              {tc("subscribePass")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  )
}
