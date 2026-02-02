"use server"

import { createClient } from "@/lib/supabase/server"
import type { MeetingRoomResource } from "@/lib/types/database"

/**
 * Get meeting rooms that are currently available (not booked for the current hour)
 */
export async function getCurrentlyAvailableMeetingRooms(
  siteId: string
): Promise<{ rooms: MeetingRoomResource[]; error?: string }> {
  const supabase = await createClient()

  // Get all meeting rooms for the site
  const { data: rooms, error } = await supabase
    .from("resources")
    .select("id, name, capacity, floor, hourly_credit_rate, equipments, status")
    .eq("site_id", siteId)
    .eq("type", "meeting_room")
    .eq("status", "available")
    .order("name")

  if (error) {
    return { rooms: [], error: error.message }
  }

  if (!rooms || rooms.length === 0) {
    return { rooms: [] }
  }

  // Get current hour boundaries
  const now = new Date()
  const currentHourStart = new Date(now)
  currentHourStart.setMinutes(0, 0, 0)
  const currentHourEnd = new Date(currentHourStart)
  currentHourEnd.setHours(currentHourEnd.getHours() + 1)

  // Get all confirmed bookings that overlap with the current hour
  const roomIds = rooms.map((r) => r.id)
  const { data: currentBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("resource_id")
    .in("resource_id", roomIds)
    .eq("status", "confirmed")
    .lt("start_date", currentHourEnd.toISOString())
    .gt("end_date", currentHourStart.toISOString())

  if (bookingsError) {
    return { rooms: [], error: bookingsError.message }
  }

  // Filter out rooms that are currently booked
  const bookedRoomIds = new Set(currentBookings?.map((b) => b.resource_id) || [])
  const availableRooms = rooms.filter((room) => !bookedRoomIds.has(room.id))

  if (availableRooms.length === 0) {
    return { rooms: [] }
  }

  // Fetch photos for available rooms
  const availableRoomIds = availableRooms.map((r) => r.id)
  const { data: photos } = await supabase
    .from("resource_photos")
    .select("resource_id, storage_path")
    .in("resource_id", availableRoomIds)
    .order("created_at", { ascending: true })

  // Build photo URLs map
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const photosByRoom: Record<string, string[]> = {}
  photos?.forEach((photo) => {
    const url = `${supabaseUrl}/storage/v1/object/public/resource-photos/${photo.storage_path}`
    if (!photosByRoom[photo.resource_id]) {
      photosByRoom[photo.resource_id] = [url]
    } else {
      photosByRoom[photo.resource_id].push(url)
    }
  })

  // Add photos to rooms
  const roomsWithPhotos = availableRooms.map((room) => ({
    ...room,
    photoUrls: photosByRoom[room.id] || [],
  }))

  return { rooms: roomsWithPhotos as MeetingRoomResource[] }
}
