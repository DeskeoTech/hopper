"use client"

import { useState } from "react"
import { Mail, Phone, Shield, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { EditUserModal } from "./edit-user-modal"
import { toggleUserStatus } from "@/lib/actions/users"
import { cn } from "@/lib/utils"
import type { User } from "@/lib/types/database"

interface UserCardProps {
  user: User
  companyId: string
}

export function UserCard({ user, companyId }: UserCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ") || "Sans nom"
  const isActive = user.status === "active"
  const isAdmin = user.role === "admin"

  const handleToggleStatus = async () => {
    setLoading(true)
    await toggleUserStatus(user.id, companyId, isActive ? "disabled" : "active")
    setLoading(false)
    setConfirmOpen(false)
  }

  return (
    <div className="flex items-center justify-between rounded-sm border border-border p-3">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
          <UserIcon className="h-5 w-5 text-foreground/60" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-foreground">{fullName}</span>
            {isAdmin && (
              <span className="flex items-center gap-1 rounded-sm bg-blue-100 px-1.5 py-0.5 text-xs font-medium text-blue-700">
                <Shield className="h-3 w-3" />
                Admin
              </span>
            )}
            <span
              className={cn(
                "rounded-sm px-1.5 py-0.5 text-xs font-medium",
                isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
              )}
            >
              {isActive ? "Actif" : "Désactivé"}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
            {user.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </span>
            )}
            {user.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {user.phone}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <EditUserModal user={user} companyId={companyId} />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConfirmOpen(true)}
          className={cn(
            isActive
              ? "text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              : "text-green-600 hover:bg-green-50 hover:text-green-700"
          )}
        >
          {isActive ? "Désactiver" : "Activer"}
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isActive ? "Désactiver l'utilisateur" : "Activer l'utilisateur"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isActive
                ? `Voulez-vous vraiment désactiver ${fullName} ? L'utilisateur ne pourra plus accéder aux services.`
                : `Voulez-vous vraiment réactiver ${fullName} ? L'utilisateur pourra à nouveau accéder aux services.`}
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
