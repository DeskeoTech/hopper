-- Create beverages table
CREATE TABLE cafe_beverages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create beverage-plan eligibility junction table
CREATE TABLE cafe_beverage_plan_eligibility (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  beverage_id uuid NOT NULL REFERENCES cafe_beverages(id) ON DELETE CASCADE,
  plan_name text NOT NULL,
  UNIQUE(beverage_id, plan_name)
);

CREATE INDEX idx_bev_plan_beverage ON cafe_beverage_plan_eligibility(beverage_id);
CREATE INDEX idx_bev_plan_name ON cafe_beverage_plan_eligibility(plan_name);

-- Seed beverages
INSERT INTO cafe_beverages (name) VALUES
  ('Allongé'),
  ('Americano'),
  ('Autre'),
  ('Cappuccino'),
  ('Chaï Latte'),
  ('Chocolat'),
  ('Détox Minute'),
  ('Double'),
  ('Espresso'),
  ('Flat white'),
  ('Golden Latte'),
  ('Infusion'),
  ('Jus de fruits'),
  ('Jus detox du jour'),
  ('Jus pressé minute'),
  ('Lait amande'),
  ('Lait avoine'),
  ('Lait coco'),
  ('Lait soja'),
  ('Latte'),
  ('Matcha Latte'),
  ('Sirop'),
  ('Thé'),
  ('Thé glacé du jour'),
  ('Ube Latte');

-- Seed eligibility: Allongé
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('UNLIMITED ESPRESSO 5 DAYS'), ('COFFEE GANG 5 DAYS'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Allongé';

-- Americano (same as Allongé)
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('UNLIMITED ESPRESSO 5 DAYS'), ('COFFEE GANG 5 DAYS'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Americano';

-- Cappuccino
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Cappuccino';

-- Chaï Latte
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('COLOR LATTE CLUB 5 DAYS'), ('COLOR LATTE CLUB 3 DAYS')) AS p(name)
WHERE b.name = 'Chaï Latte';

-- Chocolat
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Chocolat';

-- Détox Minute
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('JUICE BOOST 5 DAYS'), ('JUICE BOOST 3 DAYS')) AS p(name)
WHERE b.name = 'Détox Minute';

-- Double
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Double';

-- Espresso (same as Allongé)
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('UNLIMITED ESPRESSO 5 DAYS'), ('COFFEE GANG 5 DAYS'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Espresso';

-- Flat white
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Flat white';

-- Golden Latte
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('COLOR LATTE CLUB 5 DAYS'), ('COLOR LATTE CLUB 3 DAYS')) AS p(name)
WHERE b.name = 'Golden Latte';

-- Infusion
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Infusion';

-- Jus de fruits
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('JUICE BOOST 5 DAYS'), ('JUICE BOOST 3 DAYS')) AS p(name)
WHERE b.name = 'Jus de fruits';

-- Jus detox du jour
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('JUICE BOOST 5 DAYS'), ('JUICE BOOST 3 DAYS')) AS p(name)
WHERE b.name = 'Jus detox du jour';

-- Jus pressé minute
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('JUICE BOOST 5 DAYS'), ('JUICE BOOST 3 DAYS')) AS p(name)
WHERE b.name = 'Jus pressé minute';

-- Lait amande
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Lait amande';

-- Lait avoine
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Lait avoine';

-- Lait coco
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Lait coco';

-- Lait soja
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Lait soja';

-- Latte
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS'), ('COLOR LATTE CLUB 3 DAYS')) AS p(name)
WHERE b.name = 'Latte';

-- Matcha Latte
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('COLOR LATTE CLUB 5 DAYS'), ('COLOR LATTE CLUB 3 DAYS')) AS p(name)
WHERE b.name = 'Matcha Latte';

-- Sirop
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Sirop';

-- Thé
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('Formule Essential'), ('Formule Corporate'), ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Thé';

-- Thé glacé du jour
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('INFINITY COFFEE CHOICE 3 DAYS'), ('INFINITY COFFEE CHOICE 5 DAYS')) AS p(name)
WHERE b.name = 'Thé glacé du jour';

-- Ube Latte
INSERT INTO cafe_beverage_plan_eligibility (beverage_id, plan_name)
SELECT b.id, p.name FROM cafe_beverages b,
  (VALUES ('COLOR LATTE CLUB 5 DAYS'), ('COLOR LATTE CLUB 3 DAYS')) AS p(name)
WHERE b.name = 'Ube Latte';

-- Autre: no eligible plans (just the beverage, no eligibility rows)
