ALTER TABLE plans ADD COLUMN stripe_product_id_test text;
ALTER TABLE plans ADD COLUMN stripe_product_id_live text;

-- Renseigner les product IDs Stripe pour Hopper Pass Month
UPDATE plans
SET stripe_product_id_test = 'prod_TvHUcYIElP9blM',
    stripe_product_id_live = 'prod_TpMFu6fGkHfe5n'
WHERE name = 'Hopper Pass Month';
