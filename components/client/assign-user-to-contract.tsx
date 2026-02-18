"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, UserPlus, Plus, Loader2 } from "lucide-react"
import {
  getCompanyUsersNotInContract,
  assignUserToContract,
  type ContractUser,
} from "@/lib/actions/contracts"
import { CreateUserForContractModal } from "./create-user-for-contract-modal"

interface AssignUserToContractProps {
  contractId: string
  companyId: string
  numberOfSeats: number | null
  assignedUsersCount: number
  onUserAssigned: () => void
}

export function AssignUserToContract({
  contractId,
  companyId,
  numberOfSeats,
  assignedUsersCount,
  onUserAssigned,
}: AssignUserToContractProps) {
  const [search, setSearch] = useState("")
  const [availableUsers, setAvailableUsers] = useState<ContractUser[]>([])
  const [loading, setLoading] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const isFull = numberOfSeats !== null && assignedUsersCount >= numberOfSeats

  // Load available users
  useEffect(() => {
    setLoading(true)
    getCompanyUsersNotInContract(contractId, companyId).then((result) => {
      setAvailableUsers(result.data || [])
      setLoading(false)
    })
  }, [contractId, companyId])

  // Filter users by search
  const filteredUsers = useMemo(() => {
    if (!search.trim()) {
      return availableUsers
    }
    const searchLower = search.toLowerCase()
    return availableUsers.filter((user) => {
      const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase()
      const email = (user.email || "").toLowerCase()
      return fullName.includes(searchLower) || email.includes(searchLower)
    })
  }, [availableUsers, search])

  const handleAssign = async (userId: string) => {
    setAssigning(userId)
    const result = await assignUserToContract(userId, contractId)
    setAssigning(null)

    if (result.success) {
      // Remove from available list
      setAvailableUsers((prev) => prev.filter((u) => u.id !== userId))
      // Notify parent to refresh users list
      onUserAssigned()
    }
  }

  const handleUserCreated = () => {
    // Refresh available users and notify parent
    getCompanyUsersNotInContract(contractId, companyId).then((result) => {
      setAvailableUsers(result.data || [])
    })
    onUserAssigned()
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-header text-sm font-medium text-foreground/70 uppercase tracking-wide">
          Assigner un utilisateur
        </h3>
        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          disabled={isFull}
          className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 text-xs font-semibold uppercase text-background transition-colors hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Ajouter</span>
        </button>
      </div>

      {isFull ? (
        <div className="rounded-[12px] bg-orange-500/10 p-4">
          <p className="text-sm text-orange-700">
            Tous les postes sont occupés. Augmentez le nombre de postes sur Stripe pour ajouter un utilisateur.
          </p>
        </div>
      ) : (
        <>
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground/40" />
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-[12px] bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {/* Users list */}
          <div className="max-h-[200px] overflow-y-auto space-y-2">
            {loading ? (
              <div className="py-4 text-center">
                <Loader2 className="mx-auto h-5 w-5 animate-spin text-foreground/40" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="rounded-[12px] bg-card p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {search.trim()
                    ? "Aucun utilisateur trouvé"
                    : "Tous les utilisateurs sont déjà assignés"}
                </p>
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 rounded-[12px] bg-card p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5">
                    <UserPlus className="h-4 w-4 text-foreground/60" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.first_name} {user.last_name}
                    </p>
                    {user.email && (
                      <p className="text-xs text-foreground/50 truncate">{user.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAssign(user.id)}
                    disabled={assigning === user.id}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-foreground/5 hover:bg-foreground/10 transition-colors disabled:opacity-50"
                  >
                    {assigning === user.id ? (
                      <Loader2 className="h-4 w-4 animate-spin text-foreground/60" />
                    ) : (
                      <Plus className="h-4 w-4 text-foreground/60" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create user modal */}
      <CreateUserForContractModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        contractId={contractId}
        companyId={companyId}
        onUserCreated={handleUserCreated}
      />
    </div>
  )
}
