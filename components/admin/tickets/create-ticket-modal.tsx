"use client"

import { useState, useEffect } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
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
import { SearchableSelect } from "@/components/ui/searchable-select"
import { createClient } from "@/lib/supabase/client"
import { createTicket } from "@/lib/actions/tickets"
import type { TicketRequestType } from "@/lib/types/database"

interface UserOption {
  value: string
  label: string
}

const requestTypeOptions = [
  { value: "account_billing", label: "Compte / Facturation" },
  { value: "issue", label: "Probleme" },
  { value: "callback", label: "Rappel" },
  { value: "other", label: "Autre" },
]

export function CreateTicketModal() {
  const [open, setOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [users, setUsers] = useState<UserOption[]>([])
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [requestType, setRequestType] = useState<TicketRequestType>("other")
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (open && users.length === 0) {
      loadUsers()
    }
  }, [open])

  const loadUsers = async () => {
    setLoadingUsers(true)
    const supabase = createClient()
    const { data } = await supabase
      .from("users")
      .select("id, first_name, last_name, email")
      .order("last_name", { ascending: true })

    if (data) {
      setUsers(
        data.map((user) => ({
          value: user.id,
          label: `${user.first_name || ""} ${user.last_name || ""} ${user.email ? `(${user.email})` : ""}`.trim(),
        }))
      )
    }
    setLoadingUsers(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return
    setConfirmOpen(true)
  }

  const handleConfirm = async () => {
    setLoading(true)
    const result = await createTicket({
      user_id: selectedUserId || null,
      request_type: requestType,
      comment: comment.trim(),
    })
    setLoading(false)
    if (result.success) {
      setSelectedUserId("")
      setRequestType("other")
      setComment("")
      setOpen(false)
      setConfirmOpen(false)
    }
  }

  const selectedUserLabel = users.find((u) => u.value === selectedUserId)?.label || "Utilisateur non selectionne"

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Nouveau ticket</span>
            <span className="sm:hidden">Ajouter</span>
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Creer un ticket</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="user">Utilisateur</Label>
              <SearchableSelect
                options={users}
                value={selectedUserId}
                onValueChange={setSelectedUserId}
                placeholder={loadingUsers ? "Chargement..." : "Selectionner un utilisateur"}
                searchPlaceholder="Rechercher un utilisateur..."
                triggerClassName="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="requestType">
                Type de demande <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={requestTypeOptions}
                value={requestType}
                onValueChange={(v) => setRequestType(v as TicketRequestType)}
                placeholder="Selectionner un type"
                searchPlaceholder="Rechercher un type..."
                triggerClassName="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Decrivez la demande..."
                rows={4}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading || !comment.trim()}>
                {loading ? "Creation..." : "Creer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la creation</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment creer ce ticket ?
              <br />
              <strong>Utilisateur :</strong> {selectedUserLabel}
              <br />
              <strong>Type :</strong> {requestTypeOptions.find((r) => r.value === requestType)?.label}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={loading}>
              {loading ? "Creation..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
