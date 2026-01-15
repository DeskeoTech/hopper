"use client"

import { useState } from "react"
import { Archive, ArchiveRestore } from "lucide-react"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { togglePlanArchived } from "@/lib/actions/plans"
import type { Plan } from "@/lib/types/database"

interface ArchivePlanModalProps {
  plan: Plan
}

export function ArchivePlanModal({ plan }: ArchivePlanModalProps) {
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const isArchived = plan.archived

  const handleConfirm = async () => {
    setLoading(true)
    const result = await togglePlanArchived(plan.id, !isArchived)
    setLoading(false)
    if (result.success) {
      setOpen(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" title={isArchived ? "Restaurer" : "Archiver"}>
          {isArchived ? (
            <ArchiveRestore className="h-4 w-4" />
          ) : (
            <Archive className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isArchived ? "Restaurer le forfait" : "Archiver le forfait"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isArchived
              ? `Voulez-vous vraiment restaurer le forfait "${plan.name}" ? Il sera de nouveau visible et utilisable.`
              : `Voulez-vous vraiment archiver le forfait "${plan.name}" ? Il ne sera plus visible ni utilisable, mais pourra être restauré ultérieurement.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={loading}>
            {loading
              ? isArchived
                ? "Restauration..."
                : "Archivage..."
              : isArchived
              ? "Restaurer"
              : "Archiver"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
