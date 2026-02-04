"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Building2,
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
  deactivateUserByAdmin,
  createUserByAdmin,
} from "@/lib/actions/users"
import { assignUserToContract } from "@/lib/actions/user-contracts"
import type { Company } from "@/lib/types/database"
import type { ContractWithSeats, UserWithContract } from "@/app/(client)/entreprise/page"

interface EntreprisePageProps {
  company: Company
  contracts: ContractWithSeats[]
  users: UserWithContract[]
  currentUserId: string
}

export function EntreprisePage({
  company,
  contracts: initialContracts,
  users: initialUsers,
  currentUserId,
}: EntreprisePageProps) {
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

  // Calculate seats info from contracts
  const totalSeats = contracts.reduce((sum, c) => sum + c.total_seats, 0)
  const activeUsers = users.filter((u) => u.status === "active").length

  const handleDeactivate = async (userId: string) => {
    if (!company.id) return
    setUpdatingUserId(userId)
    setError(null)
    const result = await deactivateUserByAdmin(userId, company.id)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "disabled" } : u))
      )
    }
    setUpdatingUserId(null)
  }

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

  const getRoleLabel = (role: string | null) => {
    switch (role) {
      case "admin":
        return "Administrateur"
      case "user":
      default:
        return "Utilisateur"
    }
  }

  const getStatusBadge = (status: string | null) => {
    if (status === "disabled") {
      return (
        <span className="inline-flex items-center rounded-full bg-foreground/5 px-2 py-0.5 text-[10px] text-foreground/50">
          Désactivé
        </span>
      )
    }
    return null
  }

  const progressValue = totalSeats > 0 ? (activeUsers / totalSeats) * 100 : 0

  const getCompanyTypeLabel = (type: string | null) => {
    switch (type) {
      case "self_employed":
        return "Auto-entrepreneur"
      case "multi_employee":
        return "Entreprise"
      default:
        return "—"
    }
  }

  const formatDateRange = (start: string | null, end: string | null) => {
    const formatDate = (date: string) => {
      return new Date(date).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    }

    if (start && end) {
      return `${formatDate(start)} → ${formatDate(end)}`
    }
    if (start) {
      return `Depuis le ${formatDate(start)}`
    }
    if (end) {
      return `Jusqu'au ${formatDate(end)}`
    }
    return null
  }

  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      {/* Back link */}
      <Link
        href="/compte"
        className="mb-6 inline-flex items-center gap-2 text-sm text-foreground/50 transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
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
                {company.name || "Mon entreprise"}
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
              Contrats
            </h2>
          </div>

          {contracts.length === 0 ? (
            <p className="text-sm text-foreground/50">Aucun contrat actif</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {contracts.map((contract) => {
                const isFull = contract.assigned_seats >= contract.total_seats
                const progressPercent =
                  contract.total_seats > 0
                    ? (contract.assigned_seats / contract.total_seats) * 100
                    : 0

                return (
                  <div
                    key={contract.id}
                    className="rounded-[12px] bg-background/50 p-4"
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
                        <span className="text-foreground/50">Postes utilisés</span>
                        <span className="font-medium text-foreground/70">
                          {contract.assigned_seats} / {contract.total_seats}
                        </span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Section 3: Users */}
        <div className="rounded-[16px] bg-card p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                <Users className="h-5 w-5 text-foreground/70" />
              </div>
              <h2 className="font-header text-lg font-bold uppercase tracking-tight">
                Utilisateurs
              </h2>
            </div>

            {/* Seats progress bar and add user button */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              {totalSeats > 0 && (
                <div className="flex-1 min-w-[150px] max-w-[200px]">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-foreground/50">Sièges utilisés</span>
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
                Ajouter
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-[12px] bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {users.length === 0 ? (
            <p className="text-sm text-foreground/50">Aucun utilisateur</p>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUserId
                const isDisabled = user.status === "disabled"
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
                            <span className="text-[10px] text-foreground/40">(vous)</span>
                          )}
                          {getStatusBadge(user.status)}
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
                            <SelectItem value="none">Retirer du contrat</SelectItem>
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
                                  {!hasSpace && " (complet)"}
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
                              Lier à un contrat
                            </>
                          )}
                        </button>
                      ) : null}

                      {/* Role display (read-only) */}
                      {!isDisabled && (
                        <span className="text-xs text-foreground/40">
                          {getRoleLabel(user.role)}
                        </span>
                      )}

                      {/* Deactivate button */}
                      {!isCurrentUser && !isDisabled && (
                        <button
                          type="button"
                          onClick={() => handleDeactivate(user.id)}
                          disabled={isUpdating}
                          className="rounded-full bg-foreground/5 px-2 py-1 text-[10px] text-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                        >
                          {isUpdating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            "Désactiver"
                          )}
                        </button>
                      )}
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
            <DialogTitle>Ajouter un utilisateur</DialogTitle>
            <DialogDescription>
              Ajoutez un nouvel utilisateur à votre entreprise.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={newUserFirstName}
                  onChange={(e) => setNewUserFirstName(e.target.value)}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={newUserLastName}
                  onChange={(e) => setNewUserLastName(e.target.value)}
                  placeholder="Nom"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="Email"
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setAddUserOpen(false)}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              Annuler
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
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Contract Dialog */}
      <Dialog open={linkContractOpen} onOpenChange={setLinkContractOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lier à un contrat</DialogTitle>
            <DialogDescription>
              {userToLink && (
                <>
                  Sélectionnez un contrat pour{" "}
                  <span className="font-medium">
                    {[userToLink.first_name, userToLink.last_name].filter(Boolean).join(" ") ||
                      userToLink.email ||
                      "cet utilisateur"}
                  </span>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            {contracts.length === 0 ? (
              <p className="text-sm text-foreground/50 text-center py-4">
                Aucun contrat disponible
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
                        {contract.assigned_seats} / {contract.total_seats} postes utilisés
                      </p>
                    </div>
                    {isFull ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs text-amber-600">
                        <Check className="h-3 w-3" />
                        Complet
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs text-green-600">
                        {availableSeats} dispo
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
              Annuler
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Seats Dialog */}
      <Dialog open={noSeatsDialogOpen} onOpenChange={setNoSeatsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quota de sièges atteint</DialogTitle>
            <DialogDescription>
              Vous avez atteint le nombre maximum d&apos;utilisateurs pour vos contrats actuels.
              Pour ajouter plus d&apos;utilisateurs, veuillez souscrire à un nouveau contrat.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setNoSeatsDialogOpen(false)}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              Fermer
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
              Souscrire un contrat
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
