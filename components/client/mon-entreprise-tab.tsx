"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, Shield, UserCircle, Plus } from "lucide-react"
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
  updateUserRoleByAdmin,
  deactivateUserByAdmin,
  createUserByAdmin,
} from "@/lib/actions/users"
import { useClientLayout } from "./client-layout-provider"
import type { User, UserRole } from "@/lib/types/database"

export function MonEntrepriseTab() {
  const { user: currentUser } = useClientLayout()
  const companyId = currentUser.company_id
  const companyName = currentUser.companies?.name

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [seatsInfo, setSeatsInfo] = useState<{ activeUsers: number; maxSeats: number } | null>(null)

  // Add user form state
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [addingUser, setAddingUser] = useState(false)
  const [newUserFirstName, setNewUserFirstName] = useState("")
  const [newUserLastName, setNewUserLastName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPhone, setNewUserPhone] = useState("")
  const [newUserRole, setNewUserRole] = useState<UserRole>("user")

  const fetchData = async () => {
    if (!companyId) return

    setLoading(true)
    setError(null)

    const [usersResult, seatsResult] = await Promise.all([
      getCompanyUsers(companyId),
      getCompanySeatsInfo(companyId),
    ])

    if (usersResult.error) {
      setError(usersResult.error)
    } else {
      setUsers(usersResult.data || [])
    }

    if (seatsResult.data) {
      setSeatsInfo(seatsResult.data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [companyId])

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
    if (!companyId) return
    setUpdatingUserId(userId)
    const result = await updateUserRoleByAdmin(userId, companyId, newRole)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      )
    }
    setUpdatingUserId(null)
  }

  const handleDeactivate = async (userId: string) => {
    if (!companyId) return
    setUpdatingUserId(userId)
    const result = await deactivateUserByAdmin(userId, companyId)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "inactive" } : u))
      )
      if (seatsInfo) {
        setSeatsInfo({
          ...seatsInfo,
          activeUsers: seatsInfo.activeUsers - 1,
        })
      }
    }
    setUpdatingUserId(null)
  }

  const handleAddUser = async () => {
    if (!companyId) return
    setAddingUser(true)
    setError(null)

    const result = await createUserByAdmin(companyId, {
      first_name: newUserFirstName || null,
      last_name: newUserLastName || null,
      email: newUserEmail || null,
      phone: newUserPhone || null,
      role: newUserRole,
    })

    if (result.error) {
      setError(result.error)
    } else {
      await fetchData()
      setNewUserFirstName("")
      setNewUserLastName("")
      setNewUserEmail("")
      setNewUserPhone("")
      setNewUserRole("user")
      setAddUserOpen(false)
    }

    setAddingUser(false)
  }

  const canAddUser = seatsInfo && seatsInfo.activeUsers < seatsInfo.maxSeats
  const progressValue = seatsInfo && seatsInfo.maxSeats > 0
    ? (seatsInfo.activeUsers / seatsInfo.maxSeats) * 100
    : 0

  if (!companyId) {
    return (
      <div className="rounded-[16px] bg-card p-6 ">
        <p className="text-muted-foreground">Aucune entreprise associée</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with company name and seats */}
        <div className="rounded-[16px] bg-card p-4 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
              <Users className="h-5 w-5 text-foreground/70" />
            </div>
            <h2 className="font-header text-lg font-bold uppercase tracking-tight">
              {companyName || "Entreprise"}
            </h2>
          </div>

          {/* Seats progress bar and add user button */}
          {seatsInfo && seatsInfo.maxSeats > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-foreground/50">Sièges utilisés</span>
                  <span className="font-medium text-foreground/70">{seatsInfo.activeUsers} / {seatsInfo.maxSeats}</span>
                </div>
                <Progress value={progressValue} className="h-1.5" />
              </div>
              <button
                type="button"
                disabled={!canAddUser}
                onClick={() => setAddUserOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-full bg-[#1B1918] px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3.5 w-3.5" />
                Ajouter
              </button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-[12px] bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Users list */}
        <div className="rounded-[16px] bg-card p-4 sm:p-6">
          <h3 className="mb-4 font-header text-sm font-bold uppercase tracking-tight text-foreground/70">Utilisateurs</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-foreground/30" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-sm text-foreground/50">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {users.map((user) => {
                const isCurrentUser = user.id === currentUser.id
                const isDisabled = user.status === "inactive"
                const isUpdating = updatingUserId === user.id
                const userName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "—"

                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 rounded-[12px] bg-background/50 p-3"
                  >
                    {/* Avatar/Icon */}
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
                        {user.role === "admin" && (
                          <span className="inline-flex items-center rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-medium text-foreground/70">
                            Administrateur de l'entreprise
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-foreground/50">
                        {user.email || "—"}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 items-center gap-2">
                      {/* Role selector - only on larger screens or if editable */}
                      {!isCurrentUser && !isDisabled ? (
                        <Select
                          value={user.role || "user"}
                          onValueChange={(value: "admin" | "user") =>
                            handleRoleChange(user.id, value)
                          }
                          disabled={isUpdating}
                        >
                          <SelectTrigger className="h-7 w-auto gap-1 border-0 bg-foreground/5 px-2 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Utilisateur</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : null}

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
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={newUserPhone}
                onChange={(e) => setNewUserPhone(e.target.value)}
                placeholder="Téléphone"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Rôle</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Utilisateur</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
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
    </>
  )
}
