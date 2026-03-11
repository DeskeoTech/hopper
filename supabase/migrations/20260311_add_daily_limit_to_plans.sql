-- Add daily_drink_limit to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS daily_drink_limit integer;

-- Update existing café plans with their daily limits
UPDATE plans SET daily_drink_limit = 2 WHERE name = 'JUICE BOOST 3 DAYS';
UPDATE plans SET daily_drink_limit = 2 WHERE name = 'JUICE BOOST 5 DAYS';
UPDATE plans SET daily_drink_limit = 2 WHERE name = 'COLOR LATTE CLUB 3 DAYS';
UPDATE plans SET daily_drink_limit = 2 WHERE name = 'COLOR LATTE CLUB 5 DAYS';
UPDATE plans SET daily_drink_limit = 2 WHERE name = 'INFINITY COFFEE CHOICE 3 DAYS';
UPDATE plans SET daily_drink_limit = 2 WHERE name = 'INFINITY COFFEE CHOICE 5 DAYS';
UPDATE plans SET daily_drink_limit = 7 WHERE name = 'UNLIMITED ESPRESSO 5 DAYS';

-- Seed missing café plans referenced in beverage eligibility
INSERT INTO plans (name, price_per_seat_month, service_type, recurrence, archived, daily_drink_limit)
VALUES
  ('Formule Essential', 0, 'coffee_subscription', 'monthly', false, 2),
  ('Formule Corporate', 0, 'coffee_subscription', 'monthly', false, 2),
  ('COFFEE GANG 5 DAYS', 39.99, 'coffee_subscription', 'monthly', false, 2)
ON CONFLICT DO NOTHING;
