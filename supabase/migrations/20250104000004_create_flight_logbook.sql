-- Migration: Create flight logbook table
-- Description: Table for storing pilot flight records with guided capture
-- Date: 2025-01-04
-- Priority: CRITICAL for flight logbook module functionality

-- =====================================================
-- FLIGHT LOGBOOK TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.flights (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    reference_id VARCHAR(255) NOT NULL UNIQUE,
    
    -- Flight basic information
    departure_location VARCHAR(255) NOT NULL,
    destination_location VARCHAR(255) NOT NULL,
    flight_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    
    -- Flight classification
    flight_type VARCHAR(50) NOT NULL CHECK (flight_type IN ('Practice', 'Recreational', 'Transfer', 'Commercial')),
    flight_purpose TEXT NOT NULL,
    
    -- Additional information
    observations TEXT,
    
    -- User and audit information
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    -- Constraints
    CONSTRAINT flights_future_date_check CHECK (flight_date <= CURRENT_DATE),
    CONSTRAINT flights_purpose_length_check CHECK (LENGTH(flight_purpose) >= 10)
);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.flights IS 'Flight logbook records for pilots';
COMMENT ON COLUMN public.flights.id IS 'Primary key, auto-incremental';
COMMENT ON COLUMN public.flights.reference_id IS 'Human-readable flight reference ID';
COMMENT ON COLUMN public.flights.departure_location IS 'Departure location/airport';
COMMENT ON COLUMN public.flights.destination_location IS 'Destination location/airport';
COMMENT ON COLUMN public.flights.flight_date IS 'Date of the flight';
COMMENT ON COLUMN public.flights.departure_time IS 'Departure time';
COMMENT ON COLUMN public.flights.flight_type IS 'Type of flight (Practice, Recreational, Transfer, Commercial)';
COMMENT ON COLUMN public.flights.flight_purpose IS 'Purpose/reason for the flight';
COMMENT ON COLUMN public.flights.observations IS 'Additional notes or observations';
COMMENT ON COLUMN public.flights.user_id IS 'Pilot who logged this flight';

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Basic indexes
CREATE INDEX IF NOT EXISTS idx_flights_user_id ON public.flights(user_id);
CREATE INDEX IF NOT EXISTS idx_flights_flight_date ON public.flights(flight_date);
CREATE INDEX IF NOT EXISTS idx_flights_flight_type ON public.flights(flight_type);
CREATE INDEX IF NOT EXISTS idx_flights_reference_id ON public.flights(reference_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_flights_user_date ON public.flights(user_id, flight_date);

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.flights ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Flight Policies
CREATE POLICY "Users can view their own flights" 
ON public.flights FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own flights" 
ON public.flights FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own flights" 
ON public.flights FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own flights" 
ON public.flights FOR DELETE 
USING (auth.uid() = user_id);

-- =====================================================
-- CREATE TRIGGER FOR UPDATED_AT TIMESTAMP
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_flights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_flights_updated_at 
    BEFORE UPDATE ON public.flights 
    FOR EACH ROW EXECUTE FUNCTION update_flights_updated_at();

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Flight logbook table created successfully';
    RAISE NOTICE 'Table created: flights';
    RAISE NOTICE 'RLS policies implemented for user data isolation';
    RAISE NOTICE 'Indexes created for performance optimization';
    RAISE NOTICE 'Trigger created for automatic timestamp updates';
END $$;
