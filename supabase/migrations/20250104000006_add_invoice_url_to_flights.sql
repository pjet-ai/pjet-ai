-- Migration: Add invoice_url column to flights table
-- Description: Add column to store PDF invoice file path for flight records
-- Date: 2025-01-04

-- Add invoice_url column to flights table
ALTER TABLE public.flights 
ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.flights.invoice_url IS 'URL path to the PDF invoice file stored in Supabase Storage';

-- Create index for performance on invoice_url queries
CREATE INDEX IF NOT EXISTS idx_flights_invoice_url ON public.flights(invoice_url) WHERE invoice_url IS NOT NULL;
