-- Prevent double-booking race conditions for meeting rooms.
-- Uses a PostgreSQL exclusion constraint to make it impossible for two confirmed
-- meeting room bookings to overlap on the same resource at the database level.

-- Enable btree_gist extension (required for exclusion constraints with = and range operators)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Add denormalized resource_type to bookings for constraint filtering.
-- Bench/flex_desk resources intentionally allow overlapping bookings,
-- so the constraint must be scoped to meeting rooms only.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT NULL;

-- Backfill existing bookings with their resource type
UPDATE bookings b SET resource_type = r.type
FROM resources r WHERE b.resource_id = r.id AND b.resource_type IS NULL;

-- Auto-cancel duplicate bookings (keep the oldest, cancel the newer one)
UPDATE bookings SET status = 'cancelled', updated_at = NOW()
WHERE id IN (
  SELECT b.id
  FROM bookings a
  JOIN bookings b ON a.resource_id = b.resource_id
    AND a.id < b.id
    AND a.status = 'confirmed' AND b.status = 'confirmed'
    AND a.resource_id IS NOT NULL
    AND tstzrange(a.start_date, a.end_date) && tstzrange(b.start_date, b.end_date)
  JOIN resources r ON a.resource_id = r.id AND r.type = 'meeting_room'
);

-- Exclusion constraint: no two confirmed meeting room bookings can overlap on the same resource.
-- Uses tstzrange(start_date, end_date) which defaults to [closed, open) — a booking ending at 10:00
-- does NOT conflict with one starting at 10:00.
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_confirmed_meeting_room_bookings
  EXCLUDE USING gist (
    resource_id WITH =,
    tstzrange(start_date, end_date) WITH &&
  )
  WHERE (status = 'confirmed' AND resource_type = 'meeting_room');
