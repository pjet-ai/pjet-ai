-- Script para crear usuario de prueba y verificar inserción completa de datos
-- Este script debe ejecutarse con un rol que tenga permisos de superusuario o service role

-- Primero, creamos un usuario de prueba en auth.users
-- NOTA: En un entorno real, esto se haría a través de la API de Supabase Auth
DO $$
DECLARE
  test_user_id UUID;
  test_profile_id UUID;
  test_aircraft_id UUID;
  test_maintenance_id UUID;
BEGIN
  -- Crear un usuario de prueba (esto es una simulación para el ejemplo)
  -- En producción, usarías: auth.sign_up() o la API de Supabase
  test_user_id := '550e8400-e29b-41d4-a716-446655440000'::UUID;
  
  -- 1. Asegurarnos de que el usuario tenga un perfil
  INSERT INTO public.profiles (user_id, first_name, last_name, company, license_number, license_type)
  VALUES (
    test_user_id,
    'Juan',
    'Pérez',
    'ORION OCG Test',
    'FAA-1234567',
    'Commercial Pilot'
  )
  ON CONFLICT (user_id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    company = EXCLUDED.company,
    license_number = EXCLUDED.license_number,
    license_type = EXCLUDED.license_type,
    updated_at = now();
  
  RAISE NOTICE 'Perfil de usuario creado/actualizado correctamente';
  
  -- 2. Crear una aeronave de prueba
  INSERT INTO public.aircraft (user_id, model, registration, year_manufactured, serial_number, base_location)
  VALUES (
    test_user_id,
    'Cessna 172S',
    'N12345',
    2018,
    '172S12345',
    'MMMX'
  )
  ON CONFLICT (user_id, registration) DO UPDATE SET
    model = EXCLUDED.model,
    year_manufactured = EXCLUDED.year_manufactured,
    serial_number = EXCLUDED.serial_number,
    base_location = EXCLUDED.base_location,
    updated_at = now()
  RETURNING id INTO test_aircraft_id;
  
  RAISE NOTICE 'Aeronave de prueba creada/actualizada con ID: %', test_aircraft_id;
  
  -- 3. Crear un registro de mantenimiento de prueba
  INSERT INTO public.maintenance_records (
    user_id,
    aircraft_id,
    date,
    vendor,
    total,
    currency,
    maintenance_type,
    work_description,
    location,
    status,
    aircraft_registration,
    technician_name,
    technician_license,
    invoice_number,
    maintenance_category,
    audit_category
  )
  VALUES (
    test_user_id,
    test_aircraft_id,
    CURRENT_DATE - INTERVAL '30 days',
    'Aviation Maintenance Services',
    2500.00,
    'USD',
    '100 Hour Inspection',
    'Complete 100 hour inspection including oil change, filter replacement, and comprehensive airframe check.',
    'MMMX',
    'Completed',
    'N12345',
    'Carlos Rodríguez',
    'FAA-A&P-987654',
    'INV-2025-001',
    'Scheduled Inspection',
    'REGULATORY_COMPLIANCE'
  )
  RETURNING id INTO test_maintenance_id;
  
  RAISE NOTICE 'Registro de mantenimiento creado con ID: %', test_maintenance_id;
  
  -- 4. Crear desglose financiero del mantenimiento
  INSERT INTO public.maintenance_financial_breakdown (
    maintenance_record_id,
    category,
    amount,
    description,
    hours_worked,
    rate_per_hour
  )
  VALUES 
    (test_maintenance_id, 'Labor', 1200.00, 'Inspection labor', 8.0, 150.00),
    (test_maintenance_id, 'Parts', 800.00, 'Oil filter and spark plugs', NULL, NULL),
    (test_maintenance_id, 'Services', 300.00, 'Specialized tools and equipment', NULL, NULL),
    (test_maintenance_id, 'Taxes', 200.00, 'IVA 16%', NULL, NULL);
  
  RAISE NOTICE 'Desglose financiero creado con 4 categorías';
  
  -- 5. Crear partes utilizadas
  INSERT INTO public.maintenance_parts (
    maintenance_record_id,
    part_number,
    part_description,
    manufacturer,
    quantity,
    unit_price,
    total_price,
    part_category,
    part_condition
  )
  VALUES 
    (test_maintenance_id, 'CH48110-9', 'Oil Filter', 'Champion', 1, 25.00, 25.00, 'Engine', 'NEW'),
    (test_maintenance_id, 'REM38E', 'Spark Plug', 'Remington', 4, 15.00, 60.00, 'Engine', 'NEW'),
    (test_maintenance_id, '8100', 'Engine Oil', 'Phillips 66', 1, 50.00, 50.00, 'Engine', 'NEW');
  
  RAISE NOTICE '3 partes creadas en el registro de mantenimiento';
  
  -- 6. Verificar que todo se creó correctamente
  RAISE NOTICE '=== RESUMEN DE DATOS CREADOS ===';
  RAISE NOTICE 'Usuario ID: %', test_user_id;
  RAISE NOTICE 'Aeronave ID: %', test_aircraft_id;
  RAISE NOTICE 'Mantenimiento ID: %', test_maintenance_id;
  
  -- 7. Mostrar totales
  SELECT 
    COUNT(*) as total_maintenance_records,
    COALESCE(SUM(total), 0) as total_amount
  FROM public.maintenance_records 
  WHERE user_id = test_user_id;
  
  RAISE NOTICE 'Inserción completa de datos de prueba finalizada exitosamente';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error durante la inserción de datos: %', SQLERRM;
END
$$;