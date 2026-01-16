"use client"

import { useState, useMemo } from "react"
import { Search, Users, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { UserCard } from "./user-card"
import { AddUserModal } from "./add-user-modal"
import type { User } from "@/lib/types/database"

interface UsersListProps {
  companyId: string
  initialUsers: User[]
}

export function UsersList({ companyId, initialUsers }: UsersListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user" | "deskeo">("all")

  const filteredUsers = useMemo(() => {
    return initialUsers.filter((user) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const fullName = `${user.first_name || ""} ${user.last_name || ""}`.toLowerCase()
        const email = (user.email || "").toLowerCase()
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false
        }
      }

      // Status filter
      if (statusFilter !== "all" && user.status !== statusFilter) {
        return false
      }

      // Role filter
      if (roleFilter !== "all" && user.role !== roleFilter) {
        return false
      }

      return true
    })
  }, [initialUsers, search, statusFilter, roleFilter])

  return (
    <div className="rounded-lg bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 type-h3 text-foreground">
          <Users className="h-5 w-5" />
          Utilisateurs ({initialUsers.length})
        </h2>
        <AddUserModal companyId={companyId} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | "active" | "disabled")}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="disabled">Désactivés</SelectItem>
          </SelectContent>
        </Select>

        <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as "all" | "admin" | "user" | "deskeo")}>
          <SelectTrigger className="w-full sm:w-[140px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="deskeo">Deskeo</SelectItem>
            <SelectItem value="user">Utilisateur</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      {search || statusFilter !== "all" || roleFilter !== "all" ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? "s" : ""} trouvé{filteredUsers.length !== 1 ? "s" : ""}
        </p>
      ) : null}

      {/* Users list */}
      {filteredUsers.length > 0 ? (
        <div className="space-y-2">
          {filteredUsers.map((user) => (
            <UserCard key={user.id} user={user} companyId={companyId} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-8">
          <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">
            {search || statusFilter !== "all" || roleFilter !== "all"
              ? "Aucun utilisateur ne correspond à vos critères"
              : "Aucun utilisateur dans cette entreprise"}
          </p>
        </div>
      )}
    </div>
  )
}
