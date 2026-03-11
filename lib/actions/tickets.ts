"use server"

import { revalidatePath } from "next/cache"
import { createClient, getUser } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import type { TicketStatus, SupportTicket } from "@/lib/types/database"

export async function createTicket(formData: FormData) {
  const authUser = await getUser()
  if (!authUser) {
    return { error: "Non autorisé" }
  }

  const supabase = createAdminClient()

  // Resolve profile user ID from auth email
  const { data: userProfile } = await supabase
    .from("users")
    .select("id, is_hopper_admin")
    .eq("email", authUser.email)
    .single()

  if (!userProfile) {
    return { error: "Utilisateur introuvable" }
  }

  // Extract ticket fields from FormData
  const explicitUserId = formData.get("user_id") as string | null
  const siteId = formData.get("site_id") as string | null
  const requestType = formData.get("request_type") as string
  const requestSubtype = formData.get("request_subtype") as string | null
  const subject = formData.get("subject") as string | null
  const comment = formData.get("comment") as string
  const status = (formData.get("status") as TicketStatus) || "todo"
  const file = formData.get("file") as File | null

  // Admin can create tickets on behalf of other users
  const ticketUserId = (explicitUserId && userProfile.is_hopper_admin) ? explicitUserId : userProfile.id

  // Create the ticket using admin client to avoid RLS SELECT issues
  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: ticketUserId,
      site_id: siteId || null,
      request_type: requestType,
      request_subtype: requestSubtype || null,
      subject: subject || null,
      comment: comment,
      status: status,
    })
    .select("id")
    .single()

  if (error) {
    console.error("[createTicket] Insert error:", error)
    return { error: error.message }
  }

  // Upload attachment if file is present and valid
  if (file && file.size > 0) {
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ]
    if (!allowedTypes.includes(file.type)) {
      // Ticket created but attachment rejected
      revalidatePath("/admin/tickets")
      revalidatePath("/mon-compte")
      return { success: true, ticketId: ticket.id, attachmentError: "Format non accepté. Utilisez PDF, JPG, PNG ou DOC." }
    }

    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      revalidatePath("/admin/tickets")
      revalidatePath("/mon-compte")
      return { success: true, ticketId: ticket.id, attachmentError: "Le fichier est trop volumineux (max 10 Mo)" }
    }

    const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf"
    const fileName = `${ticket.id}/${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from("ticket-attachments")
      .upload(fileName, file, { cacheControl: "3600", upsert: false })

    if (uploadError) {
      console.error("[createTicket] Storage upload error:", uploadError)
      revalidatePath("/admin/tickets")
      revalidatePath("/mon-compte")
      return { success: true, ticketId: ticket.id, attachmentError: "Erreur lors de l'upload du fichier" }
    }

    const { error: dbError } = await supabase.from("ticket_attachments").insert({
      ticket_id: ticket.id,
      storage_path: fileName,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
    })

    if (dbError) {
      console.error("[createTicket] DB insert attachment error:", dbError)
      await supabase.storage.from("ticket-attachments").remove([fileName])
      revalidatePath("/admin/tickets")
      revalidatePath("/mon-compte")
      return { success: true, ticketId: ticket.id, attachmentError: "Erreur lors de l'enregistrement de la pièce jointe" }
    }
  }

  revalidatePath("/admin/tickets")
  revalidatePath("/mon-compte")
  return { success: true, ticketId: ticket.id }
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
