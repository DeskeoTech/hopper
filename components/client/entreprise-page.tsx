"use client"

import { useState } from "react"
import Link from "next/link"
import { useTranslations, useLocale } from "next-intl"
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Building2,
  Coins,
  FileText,
  Users,
  Shield,
  UserCircle,
  Plus,
  Loader2,
  Check,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  getCompanyUsers,
  getCompanySeatsInfo,
  createUserByAdmin,
} from "@/lib/actions/users"
import { assignUserToContract } from "@/lib/actions/user-contracts"
import { ContractDetailModal } from "./contract-detail-modal"
import { cn } from "@/lib/utils"
import type { Company, ContractForDisplay } from "@/lib/types/database"
import type { ContractWithSeats, UserWithContract, CompanyCreditTransaction } from "@/app/(client)/entreprise/page"

const txTypeColors: Record<string, string> = {
  allocation: "bg-teal-100 text-teal-700",
  consumption: "bg-blue-100 text-blue-700",
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
  users: UserWithContract[]
  currentUserId: string
  spacebringSeats?: number
  creditTransactions?: CompanyCreditTransaction[]
}

export function EntreprisePage({
  company,
  contracts: initialContracts,
  users: initialUsers,
  currentUserId,
  spacebringSeats = 0,
  creditTransactions = [],
}: EntreprisePageProps) {
  const t = useTranslations("company")
  const tc = useTranslations("common")
  const locale = useLocale()

  const [users, setUsers] = useState(initialUsers)
  const [contracts, setContracts] = useState(initialContracts)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [seatsInfo, setSeatsInfo] = useState<{ activeUsers: number; maxSeats: number } | null>(null)

  // Add user form state
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [newUserFirstName, setNewUserFirstName] = useState("")
  const [newUserLastName, setNewUserLastName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")

  // Link contract modal state
  const [linkContractOpen, setLinkContractOpen] = useState(false)
  const [userToLink, setUserToLink] = useState<UserWithContract | null>(null)

  // No seats dialog state
  const [noSeatsDialogOpen, setNoSeatsDialogOpen] = useState(false)

  // Contract detail modal state
  const [selectedContract, setSelectedContract] = useState<ContractForDisplay | null>(null)

  // Calculate seats info from contracts + off-platform subscription
  const contractSeats = contracts.reduce((sum, c) => sum + c.total_seats, 0)
  const totalSeats = contractSeats > 0 ? contractSeats : spacebringSeats
  const activeUsers = users.filter((u) => u.status === "active").length

  const handleContractChange = async (userId: string, contractId: string | null) => {
    setUpdatingUserId(userId)
    setError(null)

    const result = await assignUserToContract(userId, contractId)
    if (result.error) {
      setError(result.error)
    } else {
      // Find the contract name
      const contract = contracts.find((c) => c.id === contractId)
      const contractName = contract?.plan_name || null

      // Update user's contract locally
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, contract_id: contractId, contract_name: contractName }
            : u
        )
      )

      // Update contract seat counts locally
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
    }
    setUpdatingUserId(null)
  }

  const openLinkContractModal = (user: UserWithContract) => {
    setUserToLink(user)
    setLinkContractOpen(true)
  }

  const handleLinkContract = async (contractId: string) => {
    if (!userToLink) return
    await handleContractChange(userToLink.id, contractId)
    setLinkContractOpen(false)
    setUserToLink(null)
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
      // Refresh users list
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

          {contracts.length === 0 ? (
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
            </div>
          )}
        </div>

        {/* Section 3: Credits History */}
        {creditTransactions.length > 0 && (
          <div className="rounded-[16px] bg-card p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <Coins className="h-5 w-5 text-foreground/70" />
              </div>
              <h2 className="font-header text-lg font-bold uppercase tracking-tight">
                Historique des crédits
              </h2>
            </div>

            <div className="max-h-[480px] space-y-2 overflow-y-auto">
              {creditTransactions.map((tx) => (
                <div key={tx.id} className="rounded-[12px] bg-background/50 p-3 sm:p-4">
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
                        {new Date(tx.date).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", {
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
              ))}
            </div>
          </div>
        )}

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

            {/* Seats progress bar and add user button */}
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

          {error && (
            <div className="mb-4 rounded-[12px] bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {users.length === 0 ? (
            <p className="text-sm text-foreground/50">{t("noUsers")}</p>
          ) : (
            <div className="max-h-[720px] space-y-2 overflow-y-auto">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const isDisabled = user.status === "inactive"
                const isUpdating = updatingUserId === user.id
                const userName =
                  [user.first_name, user.last_name].filter(Boolean).join(" ") || "—"

                return (
                  <div
                    key={user.id}
                    className="flex flex-col gap-3 rounded-[12px] bg-background/50 p-3 sm:flex-row sm:items-center"
                  >
                    {/* Avatar/Icon */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                        {user.role === "admin" ? (
                          <Shield className="h-4 w-4 text-foreground/40" />
                        ) : (
                          <UserCircle className="h-4 w-4 text-foreground/40" />
                        )}
                      </div>

                      {/* User info */}
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

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2 flex-wrap">
                      {/* Contract selector or link button */}
                      {!isDisabled && user.contract_id ? (
                        // User has a contract - show dropdown to change or remove
                        <Select
                          value={user.contract_id}
                          onValueChange={(value) =>
                            handleContractChange(user.id, value === "none" ? null : value)
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-7 w-auto min-w-[120px] gap-1 border-0 bg-foreground/5 px-2 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">{t("removeFromPass")}</SelectItem>
                            {contracts.map((contract) => {
                              const isAssignedToThis = user.contract_id === contract.id
                              const hasSpace =
                                contract.assigned_seats < contract.total_seats || isAssignedToThis

                              return (
                                <SelectItem
                                  key={contract.id}
                                  value={contract.id}
                                  disabled={!hasSpace}
                                >
                                  {contract.plan_name}
                                  {!hasSpace && " (" + t("full") + ")"}
                                </SelectItem>
                              )
                            })}
                          </SelectContent>
                        </Select>
                      ) : !isDisabled ? (
                        // User has no contract - show link button
                        <button
                          type="button"
                          onClick={() => openLinkContractModal(user)}
                          disabled={isUpdating || contracts.every((c) => c.assigned_seats >= c.total_seats)}
                          className="flex items-center gap-1.5 rounded-full bg-foreground/5 px-3 py-1.5 text-xs font-medium text-foreground/70 transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <>
                              <FileText className="h-3 w-3" />
                              {t("linkToPass")}
                            </>
                          )}
                        </button>
                      ) : null}

                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

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

      {/* Link Contract Dialog */}
      <Dialog open={linkContractOpen} onOpenChange={setLinkContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("linkPassDialog.title")}</DialogTitle>
            <DialogDescription>
              {userToLink && (
                <>
                  {t("linkPassDialog.selectPass")}{" "}
                  <span className="font-medium">
                    {[userToLink.first_name, userToLink.last_name].filter(Boolean).join(" ") ||
                      userToLink.email ||
                      t("linkPassDialog.thisUser")}
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
                    disabled={isFull || updatingUserId === userToLink?.id}
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
