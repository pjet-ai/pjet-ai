#!/usr/bin/env node

/**
 * SCRIPT PARA CREAR PERFIL PRIMERO
 * 
 * Este script crea el perfil de usuario primero,
 * luego crea las tablas dependientes.
 * 
 * Uso: node create-profile-first.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const userId = 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7';

/**
 * Función para crear perfil de usuario
 */
async function createProfile() {
  console.log('👤 Creando perfil de usuario...');
  
  try {
    const profileData = {
      id: userId,
      user_id: userId,
      first_name: 'John',
      last_name: 'Doe',
      company: 'Test Aviation',
      onboarding_completed: true,
      license_number: 'ATP-12345',
      license_type: 'Commercial Pilot'
    };
    
    const { data, error } = await supabase
      .from('profiles')
      .insert([profileData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear perfil:', error.message);
      return null;
    }
    
    console.log('✅ Perfil creado exitosamente!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Nombre: ${data.first_name} ${data.last_name}`);
    console.log(`   Empresa: ${data.company}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ ERROR en creación de perfil:', error.message);
    return null;
  }
}

/**
 * Función para crear aeronave
 */
async function createAircraft() {
  console.log('\n🛩️ Creando aeronave...');
  
  try {
    const aircraftData = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: userId,
      model: 'Falcon 2000',
      registration: 'N123ABC',
      year_manufactured: 2010,
      serial_number: '123456',
      base_location: 'Miami Executive Airport'
    };
    
    const { data, error } = await supabase
      .from('aircraft')
      .insert([aircraftData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear aeronave:', error.message);
      return null;
    }
    
    console.log('✅ Aeronave creada exitosamente!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Modelo: ${data.model}`);
    console.log(`   Matrícula: ${data.registration}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ ERROR en creación de aeronave:', error.message);
    return null;
  }
}

/**
 * Función para crear registro de mantenimiento
 */
async function createMaintenance() {
  console.log('\n🔧 Creando registro de mantenimiento...');
  
  try {
    const maintenanceData = {
      id: '550e8400-e29b-41d4-a716-446655440001',
      user_id: userId,
      aircraft_id: '550e8400-e29b-41d4-a716-446655440000',
      date: '2024-01-01',
      vendor: 'AVMATS JET SUPPORT',
      total: 924253.02,
      currency: 'USD',
      status: 'completed',
      invoice_number: 'INV-2024-001',
      work_description: 'Mantenimiento integral de Falcon 2000 - Engine Maintenance',
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
    
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([maintenanceData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ Error al crear mantenimiento:', error.message);
      return null;
    }
    
    console.log('✅ Registro de mantenimiento creado exitosamente!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Vendor: ${data.vendor}`);
    console.log(`   Total: $${data.total.toLocaleString()} ${data.currency}`);
    console.log(`   Status: ${data.status}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ ERROR en creación de mantenimiento:', error.message);
    return null;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 INICIANDO PROCESO CREACIÓN COMPLETA');
  console.log('='.repeat(50));
  
  // Crear perfil
  const profile = await createProfile();
  if (!profile) {
    console.log('\n❌ Falló la creación del perfil');
    return;
  }
  
  // Crear aeronave
  const aircraft = await createAircraft();
  if (!aircraft) {
    console.log('\n❌ Falló la creación de la aeronave');
    return;
  }
  
  // Crear mantenimiento
  const maintenance = await createMaintenance();
  if (!maintenance) {
    console.log('\n❌ Falló la creación del mantenimiento');
    return;
  }
  
  console.log('\n🎉 TODO CREADO EXITOSAMENTE!');
  console.log('='.repeat(50));
  console.log('✅ Perfil de usuario creado');
  console.log('✅ Aeronave creada');
  console.log('✅ Registro de mantenimiento creado');
  console.log('🎯 El sistema ORION OCG está funcionando perfectamente!');
}

// Manejo de errores y ejecución
main().catch(error => {
  console.error('❌ ERROR FATAL:', error.message);
  process.exit(1);
});

module.exports = {
  createProfile,
  createAircraft,
  createMaintenance
};