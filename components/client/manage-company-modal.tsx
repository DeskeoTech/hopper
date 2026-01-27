"use client"

import { useState, useEffect } from "react"
import { Loader2, Users, Mail, Phone, Shield, UserCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
  updateUserRoleByAdmin,
  deactivateUserByAdmin,
} from "@/lib/actions/users"
import type { User } from "@/lib/types/database"

interface ManageCompanyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  companyId: string
  companyName: string | null
  currentUserId: string
}

export function ManageCompanyModal({
  open,
  onOpenChange,
  companyId,
  companyName,
  currentUserId,
}: ManageCompanyModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    const result = await getCompanyUsers(companyId)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers(result.data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open, companyId])

  const handleRoleChange = async (userId: string, newRole: "admin" | "user") => {
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
    setUpdatingUserId(userId)
    const result = await deactivateUserByAdmin(userId, companyId)
    if (result.error) {
      setError(result.error)
    } else {
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: "disabled" } : u))
      )
    }
    setUpdatingUserId(null)
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gérer mon entreprise
          </DialogTitle>
          <DialogDescription>
            {companyName
              ? `Gérez les utilisateurs de ${companyName}`
              : "Gérez les utilisateurs de votre entreprise"}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

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
                  <TableHead className="hidden sm:table-cell">Contact</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => {
                  const isCurrentUser = user.id === currentUserId
                  const isDisabled = user.status === "disabled"
                  const isUpdating = updatingUserId === user.id

                  return (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {user.role === "admin" ? (
                            <Shield className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <div className="font-medium">
                              {[user.first_name, user.last_name]
                                .filter(Boolean)
                                .join(" ") || "—"}
                              {isCurrentUser && (
                                <span className="ml-2 text-xs text-muted-foreground">
                                  (vous)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground sm:hidden">
                              <Mail className="h-3 w-3" />
                              {user.email || "—"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3.5 w-3.5" />
                            {user.email || "—"}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {user.phone || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isCurrentUser || isDisabled ? (
                          <span className="text-sm text-muted-foreground">
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
                            <SelectTrigger className="h-8 w-[140px]">
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
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
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
      </DialogContent>
    </Dialog>
  )
}
