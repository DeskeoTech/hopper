-- Add identity document and RIB storage paths to companies table
ALTER TABLE companies ADD COLUMN IF NOT EXISTS identity_document_storage_path TEXT DEFAULT NULL;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS rib_storage_path TEXT DEFAULT NULL;
