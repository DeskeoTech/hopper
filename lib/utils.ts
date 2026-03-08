import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Build a public Supabase storage URL */
export function getStorageUrl(bucket: string, path: string): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
}

/** Format a fractional hour to "Xh00" or "Xh30" */
export function formatTime(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.round((h % 1) * 60)
  return `${hours}h${minutes.toString().padStart(2, "0")}`
}

/** Format a duration in hours to human-readable text */
export function formatDuration(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}min`
  const h = Math.floor(hours)
  const m = Math.round((hours % 1) * 60)
  return m > 0 ? `${h}h${m.toString().padStart(2, "0")}` : `${h}h`
}
