-- Migration: Create airports table for flight logbook autocomplete
-- Description: Comprehensive airports database with cities, countries, and IATA codes
-- Date: 2025-01-04
-- Priority: HIGH for flight logbook autocomplete functionality

-- =====================================================
-- AIRPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.airports (
    -- Primary identification
    id BIGSERIAL PRIMARY KEY,
    
    -- Airport information
    iata_code VARCHAR(3) UNIQUE,
    icao_code VARCHAR(4) UNIQUE,
    airport_name TEXT NOT NULL,
    
    -- Location information
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    
    -- Geographic coordinates
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Additional information
    timezone VARCHAR(50),
    elevation_ft INTEGER,
    
    -- Search optimization
    search_text TEXT GENERATED ALWAYS AS (
        LOWER(
            COALESCE(iata_code, '') || ' ' ||
            COALESCE(icao_code, '') || ' ' ||
            COALESCE(airport_name, '') || ' ' ||
            COALESCE(city, '') || ' ' ||
            COALESCE(country, '')
        )
    ) STORED,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- =====================================================
-- ADD COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.airports IS 'World airports database for flight logbook autocomplete';
COMMENT ON COLUMN public.airports.id IS 'Primary key, auto-incremental';
COMMENT ON COLUMN public.airports.iata_code IS 'IATA airport code (3 letters)';
COMMENT ON COLUMN public.airports.icao_code IS 'ICAO airport code (4 letters)';
COMMENT ON COLUMN public.airports.airport_name IS 'Full name of the airport';
COMMENT ON COLUMN public.airports.city IS 'City where airport is located';
COMMENT ON COLUMN public.airports.country IS 'Country where airport is located';
COMMENT ON COLUMN public.airports.country_code IS 'ISO 3166-1 alpha-2 country code';
COMMENT ON COLUMN public.airports.latitude IS 'Airport latitude coordinate';
COMMENT ON COLUMN public.airports.longitude IS 'Airport longitude coordinate';
COMMENT ON COLUMN public.airports.timezone IS 'Airport timezone';
COMMENT ON COLUMN public.airports.elevation_ft IS 'Airport elevation in feet';
COMMENT ON COLUMN public.airports.search_text IS 'Generated search text for optimization';

-- =====================================================
-- CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_airports_city ON public.airports(city);
CREATE INDEX IF NOT EXISTS idx_airports_country ON public.airports(country);
CREATE INDEX IF NOT EXISTS idx_airports_iata ON public.airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_icao ON public.airports(icao_code);

-- Search optimization indexes
CREATE INDEX IF NOT EXISTS idx_airports_search_text ON public.airports USING gin(to_tsvector('english', search_text));
CREATE INDEX IF NOT EXISTS idx_airports_city_country ON public.airports(city, country);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_airports_country_city ON public.airports(country, city);
CREATE INDEX IF NOT EXISTS idx_airports_city_lower ON public.airports(LOWER(city));

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.airports ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CREATE RLS POLICIES
-- =====================================================

-- Airports are read-only for all authenticated users
CREATE POLICY "Users can view airports"
ON public.airports FOR SELECT
USING (auth.role() = 'authenticated');

-- =====================================================
-- CREATE TRIGGER FOR UPDATED_AT TIMESTAMP
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_airports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_airports_updated_at 
    BEFORE UPDATE ON public.airports 
    FOR EACH ROW EXECUTE FUNCTION update_airports_updated_at();

-- =====================================================
-- POPULATE INITIAL AIRPORTS DATA
-- =====================================================

-- Insert major world airports (sample data - in production, this would be a larger dataset)
INSERT INTO public.airports (iata_code, icao_code, airport_name, city, country, country_code, latitude, longitude, timezone) VALUES
-- Spain
('BCN', 'LEBL', 'Barcelona-El Prat Airport', 'Barcelona', 'Spain', 'ES', 41.2974, 2.0833, 'Europe/Madrid'),
('MAD', 'LEMD', 'Madrid-Barajas Airport', 'Madrid', 'Spain', 'ES', 40.4983, -3.5676, 'Europe/Madrid'),
('VLC', 'LEVC', 'Valencia Airport', 'Valencia', 'Spain', 'ES', 39.4893, -0.4816, 'Europe/Madrid'),
('SVQ', 'LEZL', 'Seville Airport', 'Seville', 'Spain', 'ES', 37.4180, -5.8931, 'Europe/Madrid'),
('BIO', 'LEBB', 'Bilbao Airport', 'Bilbao', 'Spain', 'ES', 43.3011, -2.9106, 'Europe/Madrid'),
('AGP', 'LEMG', 'Malaga Airport', 'Malaga', 'Spain', 'ES', 36.6749, -4.4991, 'Europe/Madrid'),
('ALC', 'LEAL', 'Alicante Airport', 'Alicante', 'Spain', 'ES', 38.2822, -0.5582, 'Europe/Madrid'),
('PMI', 'LEPA', 'Palma de Mallorca Airport', 'Palma', 'Spain', 'ES', 39.5517, 2.7388, 'Europe/Madrid'),
('LPA', 'GCLP', 'Gran Canaria Airport', 'Las Palmas', 'Spain', 'ES', 27.9319, -15.3866, 'Atlantic/Canary'),
('TFS', 'GCTS', 'Tenerife South Airport', 'Tenerife', 'Spain', 'ES', 28.0444, -16.5725, 'Atlantic/Canary'),

-- Europe
('LHR', 'EGLL', 'London Heathrow Airport', 'London', 'United Kingdom', 'GB', 51.4700, -0.4543, 'Europe/London'),
('CDG', 'LFPG', 'Charles de Gaulle Airport', 'Paris', 'France', 'FR', 49.0097, 2.5479, 'Europe/Paris'),
('FRA', 'EDDF', 'Frankfurt Airport', 'Frankfurt', 'Germany', 'DE', 50.0379, 8.5622, 'Europe/Berlin'),
('AMS', 'EHAM', 'Amsterdam Airport Schiphol', 'Amsterdam', 'Netherlands', 'NL', 52.3105, 4.7683, 'Europe/Amsterdam'),
('FCO', 'LIRF', 'Rome Fiumicino Airport', 'Rome', 'Italy', 'IT', 41.8003, 12.2389, 'Europe/Rome'),
('MXP', 'LIMC', 'Milan Malpensa Airport', 'Milan', 'Italy', 'IT', 45.6306, 8.7281, 'Europe/Rome'),
('ZUR', 'LSZH', 'Zurich Airport', 'Zurich', 'Switzerland', 'CH', 47.4647, 8.5492, 'Europe/Zurich'),
('VIE', 'LOWW', 'Vienna Airport', 'Vienna', 'Austria', 'AT', 48.1103, 16.5697, 'Europe/Vienna'),
('BRU', 'EBBR', 'Brussels Airport', 'Brussels', 'Belgium', 'BE', 50.9014, 4.4844, 'Europe/Brussels'),
('CPH', 'EKCH', 'Copenhagen Airport', 'Copenhagen', 'Denmark', 'DK', 55.6180, 12.6500, 'Europe/Copenhagen'),

-- North America
('JFK', 'KJFK', 'John F. Kennedy International Airport', 'New York', 'United States', 'US', 40.6413, -73.7781, 'America/New_York'),
('LAX', 'KLAX', 'Los Angeles International Airport', 'Los Angeles', 'United States', 'US', 33.9416, -118.4085, 'America/Los_Angeles'),
('ORD', 'KORD', 'Chicago O''Hare International Airport', 'Chicago', 'United States', 'US', 41.9786, -87.9048, 'America/Chicago'),
('MIA', 'KMIA', 'Miami International Airport', 'Miami', 'United States', 'US', 25.7959, -80.2870, 'America/New_York'),
('YYZ', 'CYYZ', 'Toronto Pearson International Airport', 'Toronto', 'Canada', 'CA', 43.6777, -79.6248, 'America/Toronto'),
('YVR', 'CYVR', 'Vancouver International Airport', 'Vancouver', 'Canada', 'CA', 49.1967, -123.1815, 'America/Vancouver'),

-- Asia
('NRT', 'RJAA', 'Narita International Airport', 'Tokyo', 'Japan', 'JP', 35.7720, 140.3928, 'Asia/Tokyo'),
('ICN', 'RKSI', 'Incheon International Airport', 'Seoul', 'South Korea', 'KR', 37.4602, 126.4407, 'Asia/Seoul'),
('SIN', 'WSSS', 'Singapore Changi Airport', 'Singapore', 'Singapore', 'SG', 1.3644, 103.9915, 'Asia/Singapore'),
('HKG', 'VHHH', 'Hong Kong International Airport', 'Hong Kong', 'Hong Kong', 'HK', 22.3080, 113.9185, 'Asia/Hong_Kong'),
('BKK', 'VTBS', 'Suvarnabhumi Airport', 'Bangkok', 'Thailand', 'TH', 13.6900, 100.7501, 'Asia/Bangkok'),

-- Middle East
('DXB', 'OMDB', 'Dubai International Airport', 'Dubai', 'United Arab Emirates', 'AE', 25.2532, 55.3657, 'Asia/Dubai'),
('DOH', 'OTHH', 'Hamad International Airport', 'Doha', 'Qatar', 'QA', 25.2611, 51.5651, 'Asia/Qatar'),
('TLV', 'LLBG', 'Ben Gurion Airport', 'Tel Aviv', 'Israel', 'IL', 32.0114, 34.8867, 'Asia/Jerusalem'),

-- Africa
('JNB', 'FAOR', 'O.R. Tambo International Airport', 'Johannesburg', 'South Africa', 'ZA', -26.1367, 28.2411, 'Africa/Johannesburg'),
('CAI', 'HECA', 'Cairo International Airport', 'Cairo', 'Egypt', 'EG', 30.1127, 31.4000, 'Africa/Cairo'),
('CMN', 'GMMN', 'Mohammed V International Airport', 'Casablanca', 'Morocco', 'MA', 33.3675, -7.5898, 'Africa/Casablanca'),

-- South America
('GRU', 'SBGR', 'São Paulo-Guarulhos International Airport', 'São Paulo', 'Brazil', 'BR', -23.4356, -46.4731, 'America/Sao_Paulo'),
('EZE', 'SAEZ', 'Ezeiza International Airport', 'Buenos Aires', 'Argentina', 'AR', -34.8222, -58.5358, 'America/Argentina/Buenos_Aires'),
('SCL', 'SCEL', 'Arturo Merino Benítez International Airport', 'Santiago', 'Chile', 'CL', -33.3928, -70.7858, 'America/Santiago'),

-- Oceania
('SYD', 'YSSY', 'Sydney Kingsford Smith Airport', 'Sydney', 'Australia', 'AU', -33.9399, 151.1753, 'Australia/Sydney'),
('MEL', 'YMML', 'Melbourne Airport', 'Melbourne', 'Australia', 'AU', -37.6733, 144.8433, 'Australia/Melbourne'),
('AKL', 'NZAA', 'Auckland Airport', 'Auckland', 'New Zealand', 'NZ', -37.0082, 174.7850, 'Pacific/Auckland')

ON CONFLICT (iata_code) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE 'Airports table created successfully';
    RAISE NOTICE 'Table created: airports with % initial records', (SELECT COUNT(*) FROM public.airports);
    RAISE NOTICE 'RLS policies implemented for read-only access';
    RAISE NOTICE 'Indexes created for search optimization';
    RAISE NOTICE 'Trigger created for automatic timestamp updates';
END $$;
