"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type { TicketRequestType, TicketStatus } from "@/lib/types/database"

export async function createTicket(data: {
  user_id: string | null
  request_type: TicketRequestType
  comment: string
  status?: TicketStatus
}) {
  const supabase = await createClient()

  const { data: ticket, error } = await supabase
    .from("support_tickets")
    .insert({
      user_id: data.user_id,
      request_type: data.request_type,
      comment: data.comment,
      status: data.status || "todo",
    })
    .select("id")
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath("/admin/tickets")
  return { success: true, ticketId: ticket.id }
}
