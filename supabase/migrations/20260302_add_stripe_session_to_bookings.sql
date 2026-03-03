-- Add Stripe checkout session reference to bookings for payment status tracking
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS stripe_checkout_session_id TEXT DEFAULT NULL;
