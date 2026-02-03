"use client"

import { Mail, UserRound } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { CompanyAdmin } from "./client-layout-provider"

interface AdminContactDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  admin: CompanyAdmin | null
  actionType: "credits" | "desk"
}

export function AdminContactDialog({
  open,
  onOpenChange,
  admin,
  actionType,
}: AdminContactDialogProps) {
  const actionLabel = actionType === "credits"
    ? "acheter des crédits"
    : "réserver un poste"

  const adminName = admin
    ? `${admin.first_name || ""} ${admin.last_name || ""}`.trim() || "l'administrateur"
    : "l'administrateur"

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="rounded-[20px]">
        <AlertDialogHeader>
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-foreground/5">
            <UserRound className="h-7 w-7 text-foreground/70" />
          </div>
          <AlertDialogTitle className="text-center">
            Contacter votre administrateur
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center">
            Pour {actionLabel}, veuillez contacter l'administrateur de votre entreprise.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {admin && (
          <div className="space-y-3 rounded-[16px] bg-foreground/5 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                <UserRound className="h-5 w-5 text-foreground/70" />
              </div>
              <p className="font-medium">{adminName}</p>
            </div>
            {admin.email && (
              <a
                href={`mailto:${admin.email}`}
                className="group flex items-center gap-3"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-background">
                  <Mail className="h-5 w-5 text-foreground/70" />
                </div>
                <p className="text-sm text-foreground/70 group-hover:underline">
                  {admin.email}
                </p>
              </a>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogAction className="w-full rounded-full">Compris</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
