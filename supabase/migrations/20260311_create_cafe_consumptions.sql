-- Create consumption tracking table
CREATE TABLE cafe_consumptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id),
  beverage_id uuid NOT NULL REFERENCES cafe_beverages(id),
  served_by_admin_id uuid NOT NULL REFERENCES users(id),
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX idx_cafe_conso_user ON cafe_consumptions(user_id);
CREATE INDEX idx_cafe_conso_user_date ON cafe_consumptions(user_id, created_at);
