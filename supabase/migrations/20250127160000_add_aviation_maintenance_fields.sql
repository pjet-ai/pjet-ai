-- Migration: Add Missing Aviation Maintenance Fields
-- Description: Add all critical aviation maintenance fields for regulatory compliance
-- Date: 2025-01-27
-- Priority: CRITICAL for aviation compliance

-- Add technical information fields
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS work_order_number TEXT,
ADD COLUMN IF NOT EXISTS technician_name TEXT,
ADD COLUMN IF NOT EXISTS technician_license TEXT,
ADD COLUMN IF NOT EXISTS aircraft_registration TEXT,
ADD COLUMN IF NOT EXISTS aircraft_hours_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS aircraft_cycles_total INTEGER,
ADD COLUMN IF NOT EXISTS aircraft_hours_since_overhaul DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS aircraft_cycles_since_overhaul INTEGER;

-- Add labor and parts information
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS labor_hours DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS labor_rate_per_hour DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS labor_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS parts_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS shop_supplies_total DECIMAL(10,2);

-- Add regulatory compliance fields
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS compliance_reference TEXT,
ADD COLUMN IF NOT EXISTS airworthiness_directive TEXT,
ADD COLUMN IF NOT EXISTS service_bulletin_reference TEXT,
ADD COLUMN IF NOT EXISTS inspection_type TEXT,
ADD COLUMN IF NOT EXISTS next_inspection_hours DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS next_inspection_cycles INTEGER,
ADD COLUMN IF NOT EXISTS return_to_service_date DATE,
ADD COLUMN IF NOT EXISTS mechanic_signature TEXT,
ADD COLUMN IF NOT EXISTS inspector_signature TEXT;

-- Add vendor and commercial information
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS vendor_address TEXT,
ADD COLUMN IF NOT EXISTS vendor_phone TEXT,
ADD COLUMN IF NOT EXISTS vendor_faa_certificate TEXT,
ADD COLUMN IF NOT EXISTS payment_terms TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS warranty_period_days INTEGER,
ADD COLUMN IF NOT EXISTS warranty_description TEXT;

-- Add audit and tracking fields
ALTER TABLE public.maintenance_records 
ADD COLUMN IF NOT EXISTS document_hash TEXT,
ADD COLUMN IF NOT EXISTS extracted_by_ocr BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS manual_review_required BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Create additional indexes for performance
CREATE INDEX IF NOT EXISTS idx_maintenance_records_work_order ON public.maintenance_records(work_order_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_aircraft_reg ON public.maintenance_records(aircraft_registration);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_technician ON public.maintenance_records(technician_name);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_inspection_type ON public.maintenance_records(inspection_type);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_return_to_service ON public.maintenance_records(return_to_service_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_next_inspection_hours ON public.maintenance_records(next_inspection_hours);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_compliance_ref ON public.maintenance_records(compliance_reference);

-- Add comments for documentation
COMMENT ON COLUMN public.maintenance_records.work_order_number IS 'Work order number from maintenance facility';
COMMENT ON COLUMN public.maintenance_records.technician_license IS 'FAA A&P license number or equivalent';
COMMENT ON COLUMN public.maintenance_records.aircraft_registration IS 'Aircraft N-number or registration';
COMMENT ON COLUMN public.maintenance_records.compliance_reference IS 'FAR reference (e.g., FAR 43.9, FAR 91.409)';
COMMENT ON COLUMN public.maintenance_records.airworthiness_directive IS 'AD number if applicable';
COMMENT ON COLUMN public.maintenance_records.inspection_type IS 'Type: Annual, 100hr, Progressive, etc.';
COMMENT ON COLUMN public.maintenance_records.return_to_service_date IS 'Date aircraft returned to service';
COMMENT ON COLUMN public.maintenance_records.vendor_faa_certificate IS 'FAA repair station certificate number';
COMMENT ON COLUMN public.maintenance_records.document_hash IS 'SHA256 hash of original document for integrity';

-- Create maintenance_parts table for detailed parts tracking
CREATE TABLE IF NOT EXISTS public.maintenance_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_record_id UUID NOT NULL REFERENCES public.maintenance_records(id) ON DELETE CASCADE,
  part_number TEXT NOT NULL,
  part_description TEXT NOT NULL,
  manufacturer TEXT,
  serial_number TEXT,
  lot_batch_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2),
  total_price DECIMAL(10,2),
  part_condition TEXT CHECK (part_condition IN ('NEW', 'OVERHAULED', 'REPAIRED', 'USED')),
  tso_authorization TEXT, -- TSO authorization if applicable
  pma_approval TEXT, -- PMA approval if applicable
  certificate_number TEXT, -- 8130 form number
  expiry_date DATE, -- For life-limited parts
  installation_date DATE,
  removal_date DATE,
  removal_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on maintenance_parts
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;

-- RLS policies for maintenance_parts
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

-- Create indexes for maintenance_parts
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_record_id ON public.maintenance_parts(maintenance_record_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_part_number ON public.maintenance_parts(part_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_serial_number ON public.maintenance_parts(serial_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_parts_expiry_date ON public.maintenance_parts(expiry_date);

-- Add comments for maintenance_parts
COMMENT ON TABLE public.maintenance_parts IS 'Individual parts used in maintenance operations with full traceability';
COMMENT ON COLUMN public.maintenance_parts.tso_authorization IS 'TSO (Technical Standard Order) authorization number';
COMMENT ON COLUMN public.maintenance_parts.pma_approval IS 'PMA (Parts Manufacturer Approval) number';
COMMENT ON COLUMN public.maintenance_parts.certificate_number IS 'FAA Form 8130-3 certificate number for new parts';