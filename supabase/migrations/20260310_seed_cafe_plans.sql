-- Seed Hopper Café subscription plans
INSERT INTO plans (name, price_per_seat_month, service_type, recurrence, archived)
VALUES
  ('JUICE BOOST 3 DAYS', 34.99, 'coffee_subscription', 'monthly', false),
  ('COLOR LATTE CLUB 3 DAYS', 34.99, 'coffee_subscription', 'monthly', false),
  ('INFINITY COFFEE CHOICE 3 DAYS', 39.99, 'coffee_subscription', 'monthly', false),
  ('UNLIMITED ESPRESSO 5 DAYS', 39.99, 'coffee_subscription', 'monthly', false),
  ('JUICE BOOST 5 DAYS', 49.99, 'coffee_subscription', 'monthly', false),
  ('COLOR LATTE CLUB 5 DAYS', 49.99, 'coffee_subscription', 'monthly', false),
  ('INFINITY COFFEE CHOICE 5 DAYS', 54.99, 'coffee_subscription', 'monthly', false);
