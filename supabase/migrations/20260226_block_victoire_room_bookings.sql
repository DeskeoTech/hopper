-- Temporary: block Victoire room bookings for Feb 26-27 (Thu-Fri)
-- Bookings will be available again Monday March 2, 2026
INSERT INTO site_closures (id, site_id, date, reason)
SELECT
  gen_random_uuid(),
  id,
  d::date,
  'Réservation de salles indisponible - sera disponible lundi 2 mars. Merci de passer par Spacebring.'
FROM sites, unnest(ARRAY['2026-02-26'::date, '2026-02-27'::date]) AS d
WHERE name ILIKE '%victoire%'
ON CONFLICT (site_id, date) DO NOTHING;
