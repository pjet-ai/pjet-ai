-- ===================================================================
-- COMPLETE MAINTENANCE SYSTEM FOR AVIATION AUDITING - MANUAL APPLICATION
-- ===================================================================
-- Execute this script in your Supabase SQL editor to apply all changes
-- Date: 2025-01-04
-- Version: Production Ready v1.0

-- Step 1: Add maintenance classification to main table
DO $$
BEGIN
  -- Add classification column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'maintenance_records' 
    AND column_name = 'maintenance_category'
  ) THEN
    ALTER TABLE public.maintenance_records 
    ADD COLUMN maintenance_category TEXT CHECK (
      maintenance_category IN (
        'Scheduled Inspection',
        'Unscheduled Discrepancy', 
        'Component Failure',
        'Corrosion',
        'Preventive Maintenance',
        'Emergency Repair'
      )
    );
    
    CREATE INDEX idx_maintenance_records_category ON public.maintenance_records(maintenance_category);
    COMMENT ON COLUMN public.maintenance_records.maintenance_category IS 'Classification of maintenance type for auditing';
  END IF;
END
$$;

-- Step 2: Create financial breakdown table for detailed cost tracking
CREATE TABLE IF NOT EXISTS public.maintenance_financial_breakdown (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  
  -- Financial category breakdown
  category TEXT NOT NULL CHECK (category IN (
    'Squawks',
    'Labor', 
    'Parts',
    'Services',
    'Freight',
    'Taxes',
    'Other'
  )),
  
  -- Financial details
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  rate_per_hour DECIMAL(8,2), -- For labor categories
  hours_worked DECIMAL(8,2),  -- For labor categories
  
  -- Audit fields
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 3: Enable RLS on financial breakdown
ALTER TABLE public.maintenance_financial_breakdown ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS policies for financial breakdown
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'maintenance_financial_breakdown' 
    AND policyname = 'Users can view financial breakdown for their maintenance records'
  ) THEN
    CREATE POLICY "Users can view financial breakdown for their maintenance records" 
    ON public.maintenance_financial_breakdown FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM public.maintenance_records 
        WHERE maintenance_records.id = maintenance_financial_breakdown.maintenance_record_id 
        AND maintenance_records.user_id = auth.uid()
      )
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'maintenance_financial_breakdown' 
    AND policyname = 'Users can create financial breakdown for their maintenance records'
  ) THEN
    CREATE POLICY "Users can create financial breakdown for their maintenance records" 
    ON public.maintenance_financial_breakdown FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.maintenance_records 
        WHERE maintenance_records.id = maintenance_financial_breakdown.maintenance_record_id 
        AND maintenance_records.user_id = auth.uid()
      )
    );
  END IF;
END
$$;

-- Step 5: Create indexes for financial breakdown
CREATE INDEX IF NOT EXISTS idx_maintenance_financial_breakdown_record_id ON public.maintenance_financial_breakdown(maintenance_record_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_financial_breakdown_category ON public.maintenance_financial_breakdown(category);

-- Step 6: Recreate maintenance_parts table (simplified for practical use)
-- First drop if exists, then recreate with simplified schema
DROP TABLE IF EXISTS public.maintenance_parts CASCADE;

CREATE TABLE public.maintenance_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  
  -- Basic part information (simplified for practical use)
  part_number TEXT NOT NULL,
  part_description TEXT NOT NULL,
  manufacturer TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  
  -- Part category for filtering
  part_category TEXT CHECK (part_category IN (
    'Engine',
    'Avionics', 
    'Hydraulic',
    'Electrical',
    'Structural',
    'Landing Gear',
    'Fuel System',
    'Other'
  )),
  
  -- Simple condition tracking
  part_condition TEXT CHECK (part_condition IN ('NEW', 'OVERHAULED', 'REPAIRED', 'USED')) DEFAULT 'NEW',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Step 7: Enable RLS on maintenance_parts
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;

-- Step 8: RLS policies for maintenance_parts
CREATE POLICY "Users can view parts for their maintenance records" 
ON public.maintenance_parts FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.maintenance_records 
    WHERE maintenance_records.id = maintenance_parts.maintenance_record_id 
    AND maintenance_records.user_id = auth.uid()
  )
);

CREATE POLICY "Users can create parts for their maintenance records" 
ON public.maintenance_parts FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.maintenance_records 
    WHERE maintenance_records.id = maintenance_parts.maintenance_record_id 
    AND maintenance_records.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update parts for their maintenance records" 
ON public.maintenance_parts FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.maintenance_records 
    WHERE maintenance_records.id = maintenance_parts.maintenance_record_id 
    AND maintenance_records.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete parts for their maintenance records" 
ON public.maintenance_parts FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.maintenance_records 
    WHERE maintenance_records.id = maintenance_parts.maintenance_record_id 
    AND maintenance_records.user_id = auth.uid()
  )
);

-- Step 9: Create indexes for maintenance_parts
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_record_id ON public.maintenance_parts(maintenance_record_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_part_number ON public.maintenance_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_category ON public.maintenance_parts(part_category);

-- Step 10: Create audit summary view for comprehensive reporting
CREATE OR REPLACE VIEW public.maintenance_audit_summary AS
SELECT 
  mr.id,
  mr.date,
  mr.vendor,
  mr.aircraft_registration,
  mr.maintenance_category,
  mr.total,
  mr.currency,
  
  -- Financial breakdown totals
  COALESCE(fb_squawks.amount, 0) as squawks_total,
  COALESCE(fb_labor.amount, 0) as labor_total,
  COALESCE(fb_parts.amount, 0) as parts_total,
  COALESCE(fb_services.amount, 0) as services_total,
  COALESCE(fb_freight.amount, 0) as freight_total,
  
  -- Parts count
  COALESCE(parts_count.count, 0) as parts_used_count,
  
  mr.status,
  mr.created_at
FROM public.maintenance_records mr
LEFT JOIN (
  SELECT maintenance_record_id, SUM(amount) as amount 
  FROM public.maintenance_financial_breakdown 
  WHERE category = 'Squawks' GROUP BY maintenance_record_id
) fb_squawks ON mr.id = fb_squawks.maintenance_record_id
LEFT JOIN (
  SELECT maintenance_record_id, SUM(amount) as amount 
  FROM public.maintenance_financial_breakdown 
  WHERE category = 'Labor' GROUP BY maintenance_record_id
) fb_labor ON mr.id = fb_labor.maintenance_record_id
LEFT JOIN (
  SELECT maintenance_record_id, SUM(amount) as amount 
  FROM public.maintenance_financial_breakdown 
  WHERE category = 'Parts' GROUP BY maintenance_record_id
) fb_parts ON mr.id = fb_parts.maintenance_record_id
LEFT JOIN (
  SELECT maintenance_record_id, SUM(amount) as amount 
  FROM public.maintenance_financial_breakdown 
  WHERE category = 'Services' GROUP BY maintenance_record_id
) fb_services ON mr.id = fb_services.maintenance_record_id
LEFT JOIN (
  SELECT maintenance_record_id, SUM(amount) as amount 
  FROM public.maintenance_financial_breakdown 
  WHERE category = 'Freight' GROUP BY maintenance_record_id
) fb_freight ON mr.id = fb_freight.maintenance_record_id
LEFT JOIN (
  SELECT maintenance_record_id, COUNT(*) as count 
  FROM public.maintenance_parts 
  GROUP BY maintenance_record_id
) parts_count ON mr.id = parts_count.maintenance_record_id;

-- Step 11: Add documentation comments
COMMENT ON TABLE public.maintenance_financial_breakdown IS 'Detailed financial breakdown for aviation maintenance auditing';
COMMENT ON TABLE public.maintenance_parts IS 'Simplified parts tracking for maintenance operations';
COMMENT ON VIEW public.maintenance_audit_summary IS 'Complete maintenance audit view with financial breakdown';

COMMENT ON COLUMN public.maintenance_financial_breakdown.category IS 'Financial category: Squawks, Labor, Parts, Services, Freight';
COMMENT ON COLUMN public.maintenance_records.maintenance_category IS 'Maintenance type for client filtering and auditing';
COMMENT ON COLUMN public.maintenance_parts.part_category IS 'Part category for filtering and reporting';

-- ===================================================================
-- VERIFICATION QUERIES
-- ===================================================================

-- Check if all tables exist
SELECT 
  'maintenance_records' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_records') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'maintenance_financial_breakdown' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_financial_breakdown') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'maintenance_parts' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_parts') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'maintenance_attachments' as table_name,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_attachments') 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- Check if maintenance_category column exists
SELECT 
  'maintenance_category column' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'maintenance_records' 
    AND column_name = 'maintenance_category'
  ) THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- Final success message
SELECT '🎯 COMPLETE MAINTENANCE SYSTEM SUCCESSFULLY APPLIED!' as result;
