"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { TicketRequestType, TicketStatus, SupportTicket } from "@/lib/types/database"

export async function createTicket(data: {
  user_id: string | null
  site_id?: string | null
  request_type: TicketRequestType
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
