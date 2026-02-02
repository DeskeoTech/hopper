"use client"

import { useState, useEffect } from "react"
import {
  Loader2,
  MessageCircle,
  Check,
  Send,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useClientLayout } from "./client-layout-provider"
import { createTicket, getUserTickets } from "@/lib/actions/tickets"
import type { TicketRequestType, TicketStatus, SupportTicket } from "@/lib/types/database"
import { cn } from "@/lib/utils"

const REQUEST_TYPE_LABELS: Record<TicketRequestType, string> = {
  account_billing: "Compte & Facturation",
  issue: "Signaler un problème",
  callback: "Demande de rappel",
  other: "Autre",
}

const STATUS_CONFIG: Record<TicketStatus, { label: string; icon: typeof Circle; className: string }> = {
  todo: {
    label: "En attente",
    icon: Clock,
    className: "text-amber-600 bg-amber-100",
  },
  in_progress: {
    label: "En cours",
    icon: AlertCircle,
    className: "text-blue-600 bg-blue-100",
  },
  done: {
    label: "Résolu",
    icon: CheckCircle2,
    className: "text-green-600 bg-green-100",
  },
}

export function SupportTab() {
  const { user } = useClientLayout()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)

  const [requestType, setRequestType] = useState<TicketRequestType>("issue")
  const [comment, setComment] = useState("")

  // Fetch user tickets on mount
  useEffect(() => {
    async function fetchTickets() {
      if (!user?.id) return
      setLoadingTickets(true)
      const result = await getUserTickets(user.id)
      if (result.data) {
        setTickets(result.data)
      }
      setLoadingTickets(false)
    }
    fetchTickets()
  }, [user?.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) {
      setError("Veuillez saisir un message")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await createTicket({
      user_id: user?.id || null,
      request_type: requestType,
      comment: comment.trim(),
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setComment("")
      // Refresh tickets list
      if (user?.id) {
        const ticketsResult = await getUserTickets(user.id)
        if (ticketsResult.data) {
          setTickets(ticketsResult.data)
        }
      }
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* Contact Form */}
      <div className="rounded-[16px] bg-card p-6 ">
        <div className="mb-6 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-foreground/50" />
          <h2 className="text-lg font-semibold">Contacter le support</h2>
        </div>

        <p className="mb-6 text-sm text-muted-foreground">
          Une question ? Un problème ? Notre équipe est à votre disposition pour vous aider.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="requestType">Type de demande</Label>
            <Select
              value={requestType}
              onValueChange={(value) => setRequestType(value as TicketRequestType)}
            >
              <SelectTrigger id="requestType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REQUEST_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Votre message</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Décrivez votre demande en détail..."
              rows={4}
              className="resize-none"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-md bg-green-100 p-3 text-green-700">
              <Check className="h-4 w-4" />
              <p className="text-sm">Votre demande a été envoyée avec succès</p>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Envoyer ma demande
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Tickets List */}
      <div className="rounded-[16px] bg-card p-6 ">
        <div className="mb-6 flex items-center gap-2">
          <Clock className="h-5 w-5 text-foreground/50" />
          <h2 className="text-lg font-semibold">Mes demandes</h2>
        </div>

        {loadingTickets ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-8 text-center">
            <MessageCircle className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              Vous n&apos;avez pas encore de demande
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const statusConfig = STATUS_CONFIG[ticket.status || "todo"]
              const StatusIcon = statusConfig.icon
              return (
                <div
                  key={ticket.id}
                  className="rounded-[12px] border border-border bg-background p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {REQUEST_TYPE_LABELS[ticket.request_type || "other"]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-foreground line-clamp-2">
                        {ticket.comment || "Pas de description"}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium shrink-0",
                        statusConfig.className
                      )}
                    >
                      <StatusIcon className="h-3.5 w-3.5" />
                      {statusConfig.label}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
