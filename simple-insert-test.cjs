#!/usr/bin/env node

/**
 * SCRIPT DE INSERCIÓN SIMPLE PARA TESTING
 * 
 * Este script prueba insertar datos de forma muy simple
 * para entender las restricciones de la base de datos.
 * 
 * Uso: node simple-insert-test.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

/**
 * Función para probar inserciones simples
 */
async function testSimpleInserts() {
  console.log('🧪 INICIANDO TEST DE INSERCIONES SIMPLES');
  console.log('='.repeat(50));
  
  try {
    // Test 1: Insertar usuario profiles (debería funcionar)
    console.log('\n📝 Test 1: Insertando perfil de usuario...');
    
    const profileData = {
      id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
      user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
      first_name: 'John',
      last_name: 'Doe',
      company: 'Test Aviation',
      onboarding_completed: true
    };
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (profileError) {
      console.error('❌ Error en perfil:', profileError.message);
    } else {
      console.log('✅ Perfil insertado:', profile.id);
    }
    
    // Test 2: Insertar aeronave
    console.log('\n🛩️ Test 2: Insertando aeronave...');
    
    const aircraftData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
      model: 'Falcon 2000',
      registration: 'N123ABC',
      year_manufactured: 2010,
      serial_number: '123456',
      base_location: 'Miami Executive Airport'
    };
    
    const { data: aircraft, error: aircraftError } = await supabase
      .from('aircraft')
      .insert([aircraftData])
      .select()
      .single();
    
    if (aircraftError) {
      console.error('❌ Error en aeronave:', aircraftError.message);
    } else {
      console.log('✅ Aeronave insertada:', aircraft.id);
    }
    
    // Test 3: Insertar mantenimiento
    console.log('\n🔧 Test 3: Insertando mantenimiento...');
    
    const maintenanceData = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
      aircraft_id: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-01',
      vendor: 'AVMATS JET SUPPORT',
      total: 924253.02,
      currency: 'USD',
      status: 'completed',
      invoice_number: 'INV-2024-001',
      work_description: 'Mantenimiento integral de Falcon 2000',
      aircraft_registration: 'N123ABC',
      maintenance_category: 'Scheduled Inspection',
      work_order_number: 'WO-2024-001',
      technician_name: 'John Smith',
      location: 'Miami Executive Airport',
      labor_hours: 120.5,
      labor_total: 482698.96,
      parts_total: 307615.35,
      subtotal: 910000.00,
      tax_total: 838.16,
      compliance_reference: 'FAA Part 145.161'
    };
    
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .insert([maintenanceData])
      .select()
      .single();
    
    if (maintenanceError) {
      console.error('❌ Error en mantenimiento:', maintenanceError.message);
    } else {
      console.log('✅ Mantenimiento insertado:', maintenance.id);
    }
    
    // Test 4: Verificar todos los datos
    console.log('\n🔍 Test 4: Verificando datos...');
    
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7');
    
    console.log('Perfiles:', profilesError ? profilesError.message : allProfiles.length);
    
    const { data: allAircraft, error: aircraftError2 } = await supabase
      .from('aircraft')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440000');
    
    console.log('Aeronaves:', aircraftError2 ? aircraftError2.message : allAircraft.length);
    
    const { data: allMaintenance, error: maintenanceError2 } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', '550e8400-e29b-41d4-a716-446655440001');
    
    console.log('Mantenimientos:', maintenanceError2 ? maintenanceError2.message : allMaintenance.length);
    
  } catch (error) {
    console.error('❌ ERROR EN TEST:', error.message);
  }
}

// Ejecutar test
testSimpleInserts();