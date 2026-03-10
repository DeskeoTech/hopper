-- Add cafe_contract_id to users table (separate from contract_id for regular passes)
ALTER TABLE users ADD COLUMN cafe_contract_id uuid REFERENCES contracts(id);
