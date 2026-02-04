import type { TransportationStop } from "@/lib/types/database"

/**
 * Groups transportation stops by station name.
 * For example, if a station has multiple metro lines, they will be grouped together.
 */
export function groupTransportByStation(
  stops: TransportationStop[]
): { station: string; lines: string[] }[] {
  const grouped = stops.reduce(
    (acc, stop) => {
      if (!acc[stop.station]) {
        acc[stop.station] = []
      }
      acc[stop.station].push(stop.line)
      return acc
    },
    {} as Record<string, string[]>
  )

  return Object.entries(grouped).map(([station, lines]) => ({
    station,
    lines,
  }))
}
