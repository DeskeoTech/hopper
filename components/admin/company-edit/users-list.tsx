"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Users, ArrowUpDown, ArrowUp, ArrowDown, MoreHorizontal, Shield, Pencil, UserCheck, UserX } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Pagination, PaginationInfo } from "@/components/ui/pagination"
import { AddUserModal } from "./add-user-modal"
import { EditUserModal } from "./edit-user-modal"
import { toggleUserStatus } from "@/lib/actions/users"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types/database"

type SortField = "name" | "email" | "phone" | "role" | "status"
type SortOrder = "asc" | "desc"

const PAGE_SIZE = 5

interface UsersListProps {
  companyId: string
  initialUsers: User[]
}

export function UsersList({ companyId, initialUsers }: UsersListProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "disabled">("all")
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "user" | "deskeo">("all")
  const [sortField, setSortField] = useState<SortField>("name")
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [confirmUser, setConfirmUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortOrder("asc")
    }
    setCurrentPage(1)
  }

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

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => {
      let aValue: string
      let bValue: string

      switch (sortField) {
        case "name":
          aValue = `${a.first_name || ""} ${a.last_name || ""}`.toLowerCase()
          bValue = `${b.first_name || ""} ${b.last_name || ""}`.toLowerCase()
          break
        case "email":
          aValue = (a.email || "").toLowerCase()
          bValue = (b.email || "").toLowerCase()
          break
        case "phone":
          aValue = a.phone || ""
          bValue = b.phone || ""
          break
        case "role":
          aValue = a.role || ""
          bValue = b.role || ""
          break
        case "status":
          aValue = a.status || ""
          bValue = b.status || ""
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1
      return 0
    })
  }, [filteredUsers, sortField, sortOrder])

  // Pagination
  const totalPages = Math.ceil(sortedUsers.length / PAGE_SIZE)
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedUsers.slice(start, start + PAGE_SIZE)
  }, [sortedUsers, currentPage])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [search, statusFilter, roleFilter])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground/50" />
    }
    return sortOrder === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  const getFullName = (user: User) => {
    const name = [user.first_name, user.last_name].filter(Boolean).join(" ")
    return name || "Sans nom"
  }

  const getRoleBadge = (role: string | null) => {
    if (role === "admin") {
      return (
        <span className="inline-flex items-center gap-1 rounded-sm bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
          <Shield className="h-3 w-3" />
          Admin
        </span>
      )
    }
    if (role === "deskeo") {
      return (
        <span className="inline-flex items-center gap-1 rounded-sm bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
          <Shield className="h-3 w-3" />
          Deskeo
        </span>
      )
    }
    return <span className="text-sm text-muted-foreground">Utilisateur</span>
  }

  const getStatusBadge = (status: string | null) => {
    const isActive = status === "active"
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <span className={cn("text-base", isActive ? "text-success" : "text-muted-foreground")}>●</span>
        {isActive ? "Actif" : "Désactivé"}
      </span>
    )
  }

  const handleToggleStatus = async () => {
    if (!confirmUser) return
    setLoading(true)
    const isActive = confirmUser.status === "active"
    await toggleUserStatus(confirmUser.id, companyId, isActive ? "disabled" : "active")
    setLoading(false)
    setConfirmUser(null)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 type-h3 text-foreground">
          <Users className="h-5 w-5" />
          Utilisateurs ({initialUsers.length})
        </h2>
        <AddUserModal companyId={companyId} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
        <p className="text-sm text-muted-foreground">
          {filteredUsers.length} utilisateur{filteredUsers.length !== 1 ? "s" : ""} trouvé{filteredUsers.length !== 1 ? "s" : ""}
        </p>
      ) : null}

      {/* Users table */}
      {sortedUsers.length > 0 ? (
        <>
          <div className="overflow-x-auto rounded-[20px] bg-card">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/50 hover:bg-transparent">
                  <TableHead
                    className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Nom
                      <SortIcon field="name" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                    onClick={() => handleSort("email")}
                  >
                    <div className="flex items-center">
                      Email
                      <SortIcon field="email" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="hidden cursor-pointer select-none text-xs font-bold uppercase tracking-wide md:table-cell"
                    onClick={() => handleSort("phone")}
                  >
                    <div className="flex items-center">
                      Téléphone
                      <SortIcon field="phone" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                    onClick={() => handleSort("role")}
                  >
                    <div className="flex items-center">
                      Rôle
                      <SortIcon field="role" />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none text-xs font-bold uppercase tracking-wide"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center">
                      Statut
                      <SortIcon field="status" />
                    </div>
                  </TableHead>
                  <TableHead className="w-[50px]">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map((user) => {
                  const isActive = user.status === "active"
                  return (
                    <TableRow key={user.id} className="border-b border-border/30 hover:bg-muted/30">
                      <TableCell className="font-semibold uppercase">
                        {getFullName(user)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">
                        {user.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <EditUserModal
                              user={user}
                              companyId={companyId}
                              trigger={
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Modifier
                                </DropdownMenuItem>
                              }
                            />
                            <DropdownMenuItem
                              onClick={() => setConfirmUser(user)}
                              className={cn(
                                isActive
                                  ? "text-orange-600 focus:text-orange-600"
                                  : "text-green-600 focus:text-green-600"
                              )}
                            >
                              {isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
              <PaginationInfo
                currentPage={currentPage}
                pageSize={PAGE_SIZE}
                totalItems={sortedUsers.length}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[20px] bg-card py-12">
          <Users className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-muted-foreground text-sm">
            {search || statusFilter !== "all" || roleFilter !== "all"
              ? "Aucun utilisateur ne correspond à vos critères"
              : "Aucun utilisateur dans cette entreprise"}
          </p>
        </div>
      )}

      {/* Confirm dialog */}
      <AlertDialog open={!!confirmUser} onOpenChange={(open) => !open && setConfirmUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmUser?.status === "active" ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmUser?.status === "active"
                ? `Voulez-vous vraiment désactiver ${getFullName(confirmUser!)} ? L'utilisateur ne pourra plus accéder aux services.`
                : `Voulez-vous vraiment réactiver ${confirmUser ? getFullName(confirmUser) : ""} ? L'utilisateur pourra à nouveau accéder aux services.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggleStatus} disabled={loading}>
              {loading ? "En cours..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
