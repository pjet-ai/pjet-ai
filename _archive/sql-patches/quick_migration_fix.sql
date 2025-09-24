-- Quick migration to add basic columns for testing
-- Execute this in Supabase SQL Editor

-- Add maintenance_category column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maintenance_records' 
    AND column_name = 'maintenance_category'
  ) THEN
    ALTER TABLE public.maintenance_records 
    ADD COLUMN maintenance_category TEXT;
  END IF;
END
$$;

-- Check current table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name IN ('maintenance_records', 'maintenance_attachments')
ORDER BY table_name, ordinal_position;
