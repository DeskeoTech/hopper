const CRLF = "\r\n"

export interface ICalEvent {
  uid: string
  summary: string
  description: string
  location: string
  dtStart: Date
  dtEnd: Date
  created: Date
  allDay?: boolean
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
}

function formatICalDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  const h = String(date.getHours()).padStart(2, "0")
  const min = String(date.getMinutes()).padStart(2, "0")
  const s = String(date.getSeconds()).padStart(2, "0")
  return `${y}${m}${d}T${h}${min}${s}`
}

function formatICalDateOnly(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}${m}${d}`
}

function formatUtcDate(date: Date): string {
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, "0")
  const d = String(date.getUTCDate()).padStart(2, "0")
  const h = String(date.getUTCHours()).padStart(2, "0")
  const min = String(date.getUTCMinutes()).padStart(2, "0")
  const s = String(date.getUTCSeconds()).padStart(2, "0")
  return `${y}${m}${d}T${h}${min}${s}Z`
}

// Fold long lines at 75 octets per RFC 5545
function foldLine(line: string): string {
  if (line.length <= 75) return line
  const parts: string[] = []
  parts.push(line.substring(0, 75))
  let i = 75
  while (i < line.length) {
    parts.push(" " + line.substring(i, i + 74))
    i += 74
  }
  return parts.join(CRLF)
}

function formatEvent(event: ICalEvent): string {
  const lines: string[] = ["BEGIN:VEVENT"]

  lines.push(`UID:${event.uid}`)
  lines.push(`DTSTAMP:${formatUtcDate(new Date())}`)

  if (event.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICalDateOnly(event.dtStart)}`)
    lines.push(`DTEND;VALUE=DATE:${formatICalDateOnly(event.dtEnd)}`)
  } else {
    lines.push(`DTSTART;TZID=Europe/Paris:${formatICalDate(event.dtStart)}`)
    lines.push(`DTEND;TZID=Europe/Paris:${formatICalDate(event.dtEnd)}`)
  }

  lines.push(`SUMMARY:${escapeICalText(event.summary)}`)
  lines.push(`DESCRIPTION:${escapeICalText(event.description)}`)
  lines.push(`LOCATION:${escapeICalText(event.location)}`)
  lines.push(`CREATED:${formatUtcDate(event.created)}`)
  lines.push("END:VEVENT")

  return lines.map(foldLine).join(CRLF)
}

const VTIMEZONE = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "BEGIN:STANDARD",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=10",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "END:STANDARD",
  "BEGIN:DAYLIGHT",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYDAY=-1SU;BYMONTH=3",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "END:DAYLIGHT",
  "END:VTIMEZONE",
].join(CRLF)

export function generateICalendar(calendarName: string, events: ICalEvent[]): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Deskeo//Hopper//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeICalText(calendarName)}`,
    "X-WR-TIMEZONE:Europe/Paris",
  ]

  const header = lines.map(foldLine).join(CRLF)
  const eventBlocks = events.map(formatEvent).join(CRLF)
  const footer = "END:VCALENDAR"

  return [header, VTIMEZONE, eventBlocks, footer].filter(Boolean).join(CRLF) + CRLF
}
