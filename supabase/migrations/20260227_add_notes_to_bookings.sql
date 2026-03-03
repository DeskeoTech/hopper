-- Add notes column to bookings table for client comments on reservations
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;
