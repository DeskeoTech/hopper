-- Add stripe_account column to sites table
-- Maps to environment variable STRIPE_SECRET_KEY_{UPPER(stripe_account)}
-- Default is 'hopper-coworking' which maps to STRIPE_SECRET_KEY (the main key)
ALTER TABLE sites ADD COLUMN stripe_account text NOT NULL DEFAULT 'hopper-coworking';

-- Set icade account for NEXT LYON and JADIN sites
UPDATE sites SET stripe_account = 'icade' WHERE name IN ('NEXT LYON', 'JADIN');
