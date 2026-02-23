import { createClient } from "@/lib/supabase/server"
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, addWeeks, addMonths, format } from "date-fns"
import { fr } from "date-fns/locale"
import { ForecastCard } from "@/components/admin/forecast-card"

interface DashboardForecastProps {
  selectedDate: string
}

export async function DashboardForecast({ selectedDate }: DashboardForecastProps) {
  const supabase = await createClient()
  const now = new Date(selectedDate + "T12:00:00")

  const nextWeekStart = startOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
  const nextWeekEnd = endOfWeek(addWeeks(now, 1), { weekStartsOn: 1 })
  const weekAfterNextStart = startOfWeek(addWeeks(now, 2), { weekStartsOn: 1 })
  const weekAfterNextEnd = endOfWeek(addWeeks(now, 2), { weekStartsOn: 1 })
  const nextMonthStart = startOfMonth(addMonths(now, 1))
  const nextMonthEnd = endOfMonth(addMonths(now, 1))

  const [
    resourcesResult,
    bookingsNextWeekResult,
    bookingsWeekAfterNextResult,
    bookingsNextMonthResult,
  ] = await Promise.all([
    supabase.from("resources").select("id, site_id, type, capacity, site:sites!inner(id, name, status)").eq("sites.status", "open"),
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", nextWeekStart.toISOString())
      .lte("start_date", nextWeekEnd.toISOString()),
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", weekAfterNextStart.toISOString())
      .lte("start_date", weekAfterNextEnd.toISOString()),
    supabase
      .from("bookings")
      .select("id, resource_id, seats_count")
      .eq("status", "confirmed")
      .gte("start_date", nextMonthStart.toISOString())
      .lte("start_date", nextMonthEnd.toISOString()),
  ])

  const resources = resourcesResult.data || []
  const flexDeskResources = resources.filter((r) => r.type === "flex_desk")

  const siteCapacities = new Map<string, { name: string; capacity: number }>()
  flexDeskResources.forEach((r) => {
    if (r.site_id && r.site) {
      const existing = siteCapacities.get(r.site_id)
      const siteData = r.site as { id: string; name: string; status: string }
      if (existing) {
        existing.capacity += r.capacity || 1
      } else {
        siteCapacities.set(r.site_id, { name: siteData.name, capacity: r.capacity || 1 })
      }
    }
  })

  const resourceToSite = new Map<string, string>()
  flexDeskResources.forEach((r) => {
    if (r.site_id) resourceToSite.set(r.id, r.site_id)
  })

  function calculateForecastBySite(bookings: { id: string; resource_id: string | null; seats_count: number | null }[], periodDays: number) {
    const siteBookings = new Map<string, number>()
    bookings.forEach((b) => {
      if (b.resource_id) {
        const siteId = resourceToSite.get(b.resource_id)
        if (siteId) siteBookings.set(siteId, (siteBookings.get(siteId) || 0) + (b.seats_count || 1))
      }
    })

    const forecasts: { siteId: string; siteName: string; occupancyRate: number; bookedCount: number; totalCapacity: number }[] = []
    siteCapacities.forEach((site, siteId) => {
      const bookingCount = siteBookings.get(siteId) || 0
      const maxPossible = site.capacity * periodDays
      const occupancyRate = maxPossible > 0 ? Math.round((bookingCount / maxPossible) * 100) : 0
      forecasts.push({ siteId, siteName: site.name, occupancyRate: Math.min(occupancyRate, 100), bookedCount: bookingCount, totalCapacity: maxPossible })
    })
    return forecasts.sort((a, b) => b.occupancyRate - a.occupancyRate)
  }

  function calculateGlobalOccupancy(forecasts: { bookedCount: number; totalCapacity: number }[]) {
    const totalBooked = forecasts.reduce((sum, f) => sum + f.bookedCount, 0)
    const totalCap = forecasts.reduce((sum, f) => sum + f.totalCapacity, 0)
    return totalCap > 0 ? Math.round((totalBooked / totalCap) * 100) : 0
  }

  const forecastNextWeek = calculateForecastBySite(bookingsNextWeekResult.data || [], 5)
  const forecastWeekAfterNext = calculateForecastBySite(bookingsWeekAfterNextResult.data || [], 5)
  const forecastNextMonth = calculateForecastBySite(bookingsNextMonthResult.data || [], 22)

  const forecastPeriods = [
    {
      label: `Semaine du ${format(nextWeekStart, "d MMM", { locale: fr })}`,
      shortLabel: "S+1",
      sites: forecastNextWeek,
      globalOccupancy: calculateGlobalOccupancy(forecastNextWeek),
    },
    {
      label: `Semaine du ${format(weekAfterNextStart, "d MMM", { locale: fr })}`,
      shortLabel: "S+2",
      sites: forecastWeekAfterNext,
      globalOccupancy: calculateGlobalOccupancy(forecastWeekAfterNext),
    },
    {
      label: format(nextMonthStart, "MMMM yyyy", { locale: fr }),
      shortLabel: "M+1",
      sites: forecastNextMonth,
      globalOccupancy: calculateGlobalOccupancy(forecastNextMonth),
    },
  ]

  return <ForecastCard periods={forecastPeriods} />
}
