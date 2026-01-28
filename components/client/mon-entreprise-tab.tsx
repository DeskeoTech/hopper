"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, Mail, Phone, Shield, UserCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
        prev.map((u) => (u.id === userId ? { ...u, status: "disabled" } : u))
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
        <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-1 text-xs font-medium text-destructive">
          Désactivé
        </span>
      )
    }
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        Actif
      </span>
    )
  }

  const canAddUser = seatsInfo && seatsInfo.activeUsers < seatsInfo.maxSeats
  const progressValue = seatsInfo && seatsInfo.maxSeats > 0
    ? (seatsInfo.activeUsers / seatsInfo.maxSeats) * 100
    : 0

  if (!companyId) {
    return (
      <div className="rounded-[16px] bg-card p-6 shadow-sm">
        <p className="text-muted-foreground">Aucune entreprise associée</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with company name and seats */}
        <div className="rounded-[16px] bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-foreground/50" />
            <h2 className="text-lg font-semibold">
              {companyName ? `Gérer ${companyName}` : "Gérer mon entreprise"}
            </h2>
          </div>

          {/* Seats progress bar and add user button */}
          {seatsInfo && seatsInfo.maxSeats > 0 && (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex-1 max-w-md">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Sièges utilisés</span>
                  <span className="font-medium">{seatsInfo.activeUsers} / {seatsInfo.maxSeats}</span>
                </div>
                <Progress value={progressValue} className="h-2" />
              </div>
              <Button
                disabled={!canAddUser}
                onClick={() => setAddUserOpen(true)}
                className="shrink-0"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Users table */}
        <div className="rounded-[16px] bg-card p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Utilisateurs</h3>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user, index) => {
                    const isCurrentUser = user.id === currentUser.id
                    const isDisabled = user.status === "disabled"
                    const isUpdating = updatingUserId === user.id

                    return (
                      <TableRow
                        key={user.id}
                        className={index % 2 === 1 ? "bg-[#D9D0C3]" : ""}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {user.role === "admin" ? (
                              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                            ) : (
                              <UserCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                            )}
                            <span className="font-medium whitespace-nowrap">
                              {[user.first_name, user.last_name]
                                .filter(Boolean)
                                .join(" ") || "—"}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (vous)
                                </span>
                              )}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{user.email || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{user.phone || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {isCurrentUser || isDisabled ? (
                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                              {getRoleLabel(user.role)}
                            </span>
                          ) : (
                            <Select
                              value={user.role || "user"}
                              onValueChange={(value: "admin" | "user") =>
                                handleRoleChange(user.id, value)
                              }
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="h-8 w-[130px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Utilisateur</SelectItem>
                                <SelectItem value="admin">Administrateur</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(user.status)}</TableCell>
                        <TableCell className="text-right">
                          {!isCurrentUser && !isDisabled && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeactivate(user.id)}
                              disabled={isUpdating}
                              className="text-destructive hover:bg-destructive hover:text-destructive-foreground whitespace-nowrap"
                            >
                              {isUpdating ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                "Désactiver"
                              )}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddUserOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleAddUser} disabled={addingUser}>
              {addingUser ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Création...
                </>
              ) : (
                "Créer"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
