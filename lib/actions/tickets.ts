"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TicketStatus, SupportTicket } from "@/lib/types/database"

export async function createTicket(data: {
  user_id: string | null
  site_id?: string | null
  request_type: string
  request_subtype?: string | null
  subject?: string | null
  comment: string
  status?: TicketStatus
}) {
  const supabase = await createClient()

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: data.user_id,
      site_id: data.site_id || null,
      request_type: data.request_type,
      request_subtype: data.request_subtype || null,
      subject: data.subject || null,
      comment: data.comment,
      status: data.status || "todo",
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/tickets")
  revalidatePath("/mon-compte")
  return { success: true, ticketId: ticket.id }
}

export async function uploadTicketAttachment(ticketId: string, formData: FormData) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  const supabase = createAdminClient()

  // Resolve profile user ID from auth email
  const { data: userProfile } = await supabase
    .from("users")
    .select("id")
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    return { error: "Non autorisé" }
  }

  // Verify the user owns the ticket
  const { data: ticket } = await supabase
    .from("support_tickets")
    .select("user_id")
    .eq("id", ticketId)
    .single()

  if (!ticket || ticket.user_id !== userProfile.id) {
    return { error: "Non autorisé" }
  }

  const file = formData.get("file") as File
  if (!file) {
    return { error: "Aucun fichier fourni" }
  }

  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]
  if (!allowedTypes.includes(file.type)) {
    return { error: "Format non accepté. Utilisez PDF, JPG, PNG ou DOC." }
  }

  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return { error: "Le fichier est trop volumineux (max 10 Mo)" }
  }

  const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf"
  const fileName = `${ticketId}/${Date.now()}.${fileExt}`

  const { error: uploadError } = await supabase.storage
    .from("ticket-attachments")
    .upload(fileName, file, { cacheControl: "3600", upsert: false })

  if (uploadError) {
    return { error: "Erreur lors de l'upload du fichier" }
  }

  const { error: dbError } = await supabase.from("ticket_attachments").insert({
    ticket_id: ticketId,
    storage_path: fileName,
    filename: file.name,
    mime_type: file.type,
    size_bytes: file.size,
  })

  if (dbError) {
    await supabase.storage.from("ticket-attachments").remove([fileName])
    return { error: "Erreur lors de l'enregistrement de la pièce jointe" }
  }

  return { success: true }
}

export async function getUserTickets(userId: string): Promise<{ data: SupportTicket[] | null; error: string | null }> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("support_tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20)

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
