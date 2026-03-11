import { createClient, getUser } from "@/lib/supabase/server"
import { generateICalendar, type ICalEvent } from "@/lib/utils/ical"
import { toParisDate } from "@/lib/timezone"
import { subMonths, addMonths } from "date-fns"
import type { ResourceType } from "@/lib/types/database"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: siteId } = await params

  // Auth check
  const authUser = await getUser()
  if (!authUser?.email) {
    return new Response("Non authentifié", { status: 401 })
  }

  const supabase = await createClient()

  const { data: adminUser } = await supabase
    .from("users")
    .select("is_hopper_admin")
    .eq("email", authUser.email)
    .single()

  if (!adminUser?.is_hopper_admin) {
    return new Response("Accès non autorisé", { status: 403 })
  }

  // Fetch site
  const { data: site } = await supabase
    .from("sites")
    .select("id, name")
    .eq("id", siteId)
    .single()

  if (!site) {
    return new Response("Site introuvable", { status: 404 })
  }

  // Date range: 1 month past → 2 months future
  const now = new Date()
  const rangeStart = subMonths(now, 1)
  const rangeEnd = addMonths(now, 2)

  // Fetch bookings (SDR) for this site
  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      id,
      start_date,
      end_date,
      status,
      credits_used,
      created_at,
      resources!inner (
        id,
        name,
        type,
        site_id
      ),
      users!left (
        first_name,
        last_name,
        email,
        companies!left (name)
      )
    `
    )
    .eq("resources.site_id", siteId)
    .neq("status", "cancelled")
    .gte("start_date", rangeStart.toISOString())
    .lte("start_date", rangeEnd.toISOString())
    .order("start_date")

  // Fetch active contracts (passes) for companies on this site
  const { data: contracts } = await supabase
    .from("contracts")
    .select(
      `
      id,
      status,
      start_date,
      end_date,
      Number_of_seats,
      created_at,
      plans!left (name, recurrence),
      companies!inner (name, main_site_id)
    `
    )
    .eq("companies.main_site_id", siteId)
    .in("status", ["active", "suspended"])

  // Build iCal events
  const events: ICalEvent[] = []

  // Transform bookings into events
  if (bookings) {
    for (const b of bookings) {
      const resource = b.resources as unknown as {
        id: string
        name: string
        type: ResourceType
        site_id: string
      }
      const user = b.users as unknown as {
        first_name: string | null
        last_name: string | null
        email: string | null
        companies: { name: string | null } | null
      } | null

      const userName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "—"
      const companyName = user?.companies?.name || "—"

      const descriptionParts = [
        `Salle: ${resource.name}`,
        `Utilisateur: ${userName}`,
      ]
      if (user?.email) descriptionParts.push(`Email: ${user.email}`)
      if (companyName !== "—") descriptionParts.push(`Entreprise: ${companyName}`)
      if (b.credits_used) descriptionParts.push(`Crédits: ${b.credits_used}`)

      const startDate = toParisDate(b.start_date)
      const endDate = toParisDate(b.end_date)

      events.push({
        uid: `${b.id}@hopper.deskeo.com`,
        summary: `SDR - ${resource.name}`,
        description: descriptionParts.join("\n"),
        location: site.name,
        dtStart: startDate,
        dtEnd: endDate,
        created: new Date(b.created_at),
      })
    }
  }

  // Transform contracts into all-day events
  if (contracts) {
    for (const c of contracts) {
      const plan = c.plans as unknown as { name: string; recurrence: string | null } | null
      const company = c.companies as unknown as { name: string | null; main_site_id: string }

      const planName = plan?.name || "Inconnu"
      const companyName = company?.name || "—"
      const seats = c.Number_of_seats ? Number(c.Number_of_seats) : null

      const descriptionParts = [
        `Forfait: ${planName}`,
        `Entreprise: ${companyName}`,
      ]
      if (seats) descriptionParts.push(`Postes: ${seats}`)
      descriptionParts.push(`Statut: ${c.status}`)

      const startDate = c.start_date ? new Date(c.start_date) : new Date()
      // For all-day events, DTEND is exclusive (the day after the last day)
      const endDate = c.end_date ? new Date(new Date(c.end_date).getTime() + 86400000) : rangeEnd

      events.push({
        uid: `pass-${c.id}@hopper.deskeo.com`,
        summary: `Pass - ${planName} (${companyName})`,
        description: descriptionParts.join("\n"),
        location: site.name,
        dtStart: startDate,
        dtEnd: endDate,
        created: new Date(c.created_at),
        allDay: true,
      })
    }
  }

  const calendarName = `${site.name} - Réservations`
  const icsContent = generateICalendar(calendarName, events)

  // Sanitize filename
  const filename = site.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase()

  return new Response(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}-reservations.ics"`,
    },
  })
}
