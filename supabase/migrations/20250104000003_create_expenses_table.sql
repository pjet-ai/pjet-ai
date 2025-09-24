-- Migration: Create expenses table with complete structure
-- Description: Creates expenses table with all necessary fields for the application
-- Date: 2025-01-04
-- Priority: CRITICAL - Foundation for expenses module

-- =====================================================
-- CREATE EXPENSE CATEGORIES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- CREATE COMPLETE EXPENSES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expenses (
    -- Primary identification
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic expense information
    expense_date DATE NOT NULL,
    vendor_name TEXT NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    subtotal_amount DECIMAL(10, 2),
    tax_amount DECIMAL(10, 2),
    tax_rate DECIMAL(5, 2),
    description TEXT,
    expense_type TEXT,
    
    -- Aviation-specific fields
    aircraft_registration TEXT,
    trip_purpose TEXT,
    business_justification TEXT,
    
    -- Document references
    receipt_number TEXT,
    invoice_number TEXT,
    payment_method TEXT,
    
    -- Location information
    expense_location TEXT,
    expense_city TEXT,
    expense_state TEXT,
    
    -- Status and workflow
    status TEXT NOT NULL DEFAULT 'Pending',
    
    -- OCR and processing fields
    document_hash TEXT UNIQUE,
    extracted_by_ocr BOOLEAN DEFAULT FALSE,
    ocr_confidence_score DECIMAL(3,2),
    
    -- Additional optional fields
    category_id UUID REFERENCES public.expense_categories(id),
    flight_id UUID,
    tail_number TEXT,
    crew_member_id UUID,
    location_icao CHAR(4),
    is_per_diem BOOLEAN DEFAULT FALSE,
    manual_review_required BOOLEAN DEFAULT FALSE,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    
    -- Audit fields
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- CREATE EXPENSE ATTACHMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expense_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- =====================================================
-- CREATE EXPENSE TAX DETAILS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.expense_tax_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    tax_type TEXT NOT NULL,
    tax_rate DECIMAL(5, 2),
    tax_amount DECIMAL(10, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_tax_details ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES (with safe approach)
-- =====================================================

DO $$
BEGIN
  -- Expense Categories Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expense_categories' AND policyname = 'Users can view expense categories') THEN
    CREATE POLICY "Users can view expense categories" 
    ON public.expense_categories FOR SELECT 
    USING (auth.role() = 'authenticated');
  END IF;

  -- Expenses Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can view their own expenses') THEN
    CREATE POLICY "Users can view their own expenses" 
    ON public.expenses FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can create their own expenses') THEN
    CREATE POLICY "Users can create their own expenses" 
    ON public.expenses FOR INSERT 
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can update their own expenses') THEN
    CREATE POLICY "Users can update their own expenses" 
    ON public.expenses FOR UPDATE 
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expenses' AND policyname = 'Users can delete their own expenses') THEN
    CREATE POLICY "Users can delete their own expenses" 
    ON public.expenses FOR DELETE 
    USING (auth.uid() = user_id);
  END IF;

  -- Expense Attachments Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expense_attachments' AND policyname = 'Users can view attachments for their expenses') THEN
    CREATE POLICY "Users can view attachments for their expenses" 
    ON public.expense_attachments FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_attachments.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expense_attachments' AND policyname = 'Users can create attachments for their expenses') THEN
    CREATE POLICY "Users can create attachments for their expenses" 
    ON public.expense_attachments FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_attachments.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );
  END IF;

  -- Tax Details Policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expense_tax_details' AND policyname = 'Users can view tax details for their expenses') THEN
    CREATE POLICY "Users can view tax details for their expenses" 
    ON public.expense_tax_details FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_tax_details.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expense_tax_details' AND policyname = 'Users can create tax details for their expenses') THEN
    CREATE POLICY "Users can create tax details for their expenses" 
    ON public.expense_tax_details FOR INSERT 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.expenses 
            WHERE expenses.id = expense_tax_details.expense_id 
            AND expenses.user_id = auth.uid()
        )
    );
  END IF;

END $$;

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_expenses_user_id ON public.expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON public.expenses(vendor_name);
CREATE INDEX IF NOT EXISTS idx_expenses_document_hash ON public.expenses(document_hash);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON public.expenses(status);
CREATE INDEX IF NOT EXISTS idx_expense_attachments_expense_id ON public.expense_attachments(expense_id);
CREATE INDEX IF NOT EXISTS idx_expense_tax_details_expense_id ON public.expense_tax_details(expense_id);

-- =====================================================
-- POPULATE INITIAL EXPENSE CATEGORIES
-- =====================================================

INSERT INTO public.expense_categories (name, description) VALUES
('MEALS', 'Crew and passenger meals, dining expenses'),
('TRANSPORTATION', 'Ground transport, taxis, ride-sharing, car rentals'),
('ACCOMMODATION', 'Hotel and lodging for crew and passengers'),
('COMMUNICATION', 'Phone calls, internet, communication services'),
('FUEL', 'Aircraft fuel, ground vehicle fuel'),
('OFFICE_SUPPLIES', 'Office supplies, stationery, business materials'),
('ENTERTAINMENT', 'Client entertainment, business meetings'),
('MAINTENANCE', 'Aircraft maintenance and repairs'),
('OTHER', 'Other operational expenses not categorized above')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- CREATE EXPENSE SUMMARY VIEW
-- =====================================================

CREATE OR REPLACE VIEW public.expense_summary AS
SELECT 
    e.id,
    e.expense_date,
    e.vendor_name,
    e.total_amount,
    e.currency,
    e.expense_type,
    e.aircraft_registration,
    e.status,
    e.created_at,
    ec.name as category_name,
    COUNT(ea.id) as attachment_count
FROM public.expenses e
LEFT JOIN public.expense_categories ec ON e.category_id = ec.id
LEFT JOIN public.expense_attachments ea ON e.id = ea.expense_id
GROUP BY e.id, e.expense_date, e.vendor_name, e.total_amount, e.currency, 
         e.expense_type, e.aircraft_registration, e.status, e.created_at, ec.name;

-- Grant permissions
GRANT SELECT ON public.expense_categories TO authenticated;
GRANT ALL ON public.expenses TO authenticated;
GRANT ALL ON public.expense_attachments TO authenticated;
GRANT ALL ON public.expense_tax_details TO authenticated;
GRANT SELECT ON public.expense_summary TO authenticated;