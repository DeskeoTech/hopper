"use client"

import { useState, useEffect, useRef } from "react"
import {
  Loader2,
  MessageCircle,
  Check,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Paperclip,
  X,
  Mail,
  Send,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { useClientLayout } from "./client-layout-provider"
import { createTicket, getUserTickets } from "@/lib/actions/tickets"
import type { TicketRequestType, TicketStatus, SupportTicket } from "@/lib/types/database"
import { REQUEST_TYPE_LABELS, REQUEST_TYPE_OPTIONS, REQUEST_SUBTYPE_OPTIONS } from "@/lib/constants/ticket-options"
import { cn } from "@/lib/utils"

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

function parseTicketComment(ticket: SupportTicket) {
  // New format: subject is a dedicated field
  if (ticket.subject) {
    return { subject: ticket.subject, description: ticket.comment || "Pas de description" }
  }
  // Legacy format: subject was concatenated into comment
  if (!ticket.comment) return { subject: null, description: "Pas de description" }
  const match = ticket.comment.match(/^(?:\[Site\] .+?\n)?\[Sujet\] (.+?)\n\n([\s\S]*)$/)
  if (match) {
    return { subject: match[1], description: match[2] || "Pas de description" }
  }
  return { subject: null, description: ticket.comment }
}

export function SupportTab() {
  const { user, sites, selectedSiteId } = useClientLayout()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loadingTickets, setLoadingTickets] = useState(true)

  const [requestType, setRequestType] = useState<TicketRequestType | "">("")
  const [requestSubtype, setRequestSubtype] = useState("")
  const [siteId, setSiteId] = useState(selectedSiteId || "")
  const [subject, setSubject] = useState("")
  const [comment, setComment] = useState("")
  const [attachedFile, setAttachedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleReset = () => {
    setRequestType("")
    setRequestSubtype("")
    setSiteId(selectedSiteId || "")
    setSubject("")
    setComment("")
    setAttachedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    setError(null)
    setSuccess(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!requestType) {
      setError("Veuillez sélectionner un type de demande")
      return
    }
    const subtypeOptions = REQUEST_SUBTYPE_OPTIONS[requestType as TicketRequestType]
    if (subtypeOptions && subtypeOptions.length > 0 && !requestSubtype) {
      setError("Veuillez sélectionner un type de demande précis")
      return
    }
    if (!subject.trim()) {
      setError("Veuillez saisir un sujet")
      return
    }
    if (!comment.trim()) {
      setError("Veuillez saisir une description")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const result = await createTicket({
      user_id: user?.id || null,
      site_id: siteId || null,
      request_type: requestType as TicketRequestType,
      request_subtype: requestSubtype || null,
      subject: subject.trim(),
      comment: comment.trim(),
    })

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
      setRequestType("")
      setRequestSubtype("")
      setSiteId(selectedSiteId || "")
      setSubject("")
      setComment("")
      setAttachedFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
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
      {/* Ticket Form */}
      <div className="rounded-[16px] bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <MessageCircle className="h-5 w-5 text-foreground/70" />
          </div>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight">Envoyer un ticket</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Demandeur */}
          <div className="space-y-2">
            <Label>
              Demandeur <span className="text-destructive">*</span>
            </Label>
            <div className="flex items-center gap-2 rounded-[8px] border border-input bg-foreground/[0.03] px-3 py-2.5">
              <Mail className="h-4 w-4 shrink-0 text-foreground/40" />
              <span className="text-sm text-foreground/70">{user?.email || ""}</span>
            </div>
          </div>

          {/* Site */}
          <div className="space-y-2">
            <Label htmlFor="siteId">
              Vous êtes actuellement sur le site
            </Label>
            <Select
              value={siteId}
              onValueChange={setSiteId}
            >
              <SelectTrigger id="siteId">
                <SelectValue placeholder="Sélectionner un site..." />
              </SelectTrigger>
              <SelectContent>
                {sites.map((site) => (
                  <SelectItem key={site.id} value={site.id}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Votre demande concerne */}
          <div className="space-y-2">
            <Label htmlFor="requestType">
              Votre demande concerne <span className="text-destructive">*</span>
            </Label>
            <SearchableSelect
              options={REQUEST_TYPE_OPTIONS}
              value={requestType}
              onValueChange={(value) => {
                setRequestType(value as TicketRequestType)
                setRequestSubtype("")
              }}
              placeholder="Choisir..."
              searchPlaceholder="Rechercher..."
              triggerClassName="w-full"
            />
          </div>

          {/* Type de demande (sous-catégorie) */}
          {requestType && REQUEST_SUBTYPE_OPTIONS[requestType as TicketRequestType] && (
            <div className="space-y-2 overflow-hidden transition-all duration-200">
              <Label htmlFor="requestSubtype">
                Type de demande <span className="text-destructive">*</span>
              </Label>
              <SearchableSelect
                options={REQUEST_SUBTYPE_OPTIONS[requestType as TicketRequestType] || []}
                value={requestSubtype}
                onValueChange={setRequestSubtype}
                placeholder="Précisez votre demande..."
                searchPlaceholder="Rechercher..."
                triggerClassName="w-full"
              />
            </div>
          )}

          {/* Sujet */}
          <div className="space-y-2">
            <Label htmlFor="subject">
              Sujet <span className="text-destructive">*</span>
            </Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Résumez votre demande en quelques mots"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="description"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tapez quelque chose"
              rows={5}
              className="resize-none"
            />
          </div>

          {/* Pièce jointe */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) setAttachedFile(file)
              }}
              className="hidden"
              id="ticket-attachment"
            />
            {attachedFile ? (
              <div className="flex items-center gap-2 rounded-[8px] border border-input bg-foreground/[0.03] px-3 py-2.5">
                <Paperclip className="h-4 w-4 shrink-0 text-foreground/40" />
                <span className="flex-1 truncate text-sm text-foreground/70">
                  {attachedFile.name}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setAttachedFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                  className="shrink-0 rounded-full p-1 text-foreground/50 transition-colors hover:bg-foreground/10 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 text-sm text-foreground/60 transition-colors hover:text-foreground"
              >
                <Paperclip className="h-4 w-4" />
                Pièce jointe
              </button>
            )}
          </div>

          {/* Messages erreur / succès */}
          {error && (
            <div className="rounded-[12px] bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-[12px] bg-green-500/10 p-4 text-green-600">
              <Check className="h-4 w-4" />
              <p className="text-sm font-medium">Votre demande a été envoyée avec succès</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="rounded-full bg-foreground/5 px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/10"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-[#1B1918] px-6 py-2.5 text-sm font-semibold uppercase tracking-wide text-white transition-colors hover:bg-[#1B1918]/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi...
                </>
              ) : (
                "Envoyer"
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Tickets List */}
      <div className="rounded-[16px] bg-card p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-foreground/5">
            <Clock className="h-5 w-5 text-foreground/70" />
          </div>
          <h2 className="font-header text-lg font-bold uppercase tracking-tight">Mes demandes</h2>
        </div>

        {loadingTickets ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="rounded-[12px] bg-foreground/[0.03] p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <MessageCircle className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Vous n&apos;avez pas encore de demande
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const statusConfig = STATUS_CONFIG[ticket.status || "todo"]
              const StatusIcon = statusConfig.icon
              const parsed = parseTicketComment(ticket)
              return (
                <div
                  key={ticket.id}
                  className="rounded-[12px] bg-foreground/[0.03] p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {REQUEST_TYPE_LABELS[ticket.request_type || "autre"]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ticket.created_at)}
                        </span>
                      </div>
                      {parsed.subject && (
                        <p className="text-sm font-medium text-foreground mb-1">
                          {parsed.subject}
                        </p>
                      )}
                      <p className="text-sm text-foreground/70 line-clamp-2">
                        {parsed.description}
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
