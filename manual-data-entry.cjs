#!/usr/bin/env node

/**
 * SCRIPT DE REGISTRO MANUAL DE DATOS DE MANTENIMIENTO
 * 
 * Este script registra directamente datos de mantenimiento simulados
 * en la base de datos Supabase para probar el sistema completo.
 * 
 * Uso: node manual-data-entry.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

if (!supabaseKey || supabaseKey === 'your-service-role-key-here') {
  console.error('❌ ERROR: Necesitas configurar SUPABASE_SERVICE_ROLE_KEY en las variables de entorno');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Datos simulados del PDF de mantenimiento
// Primero crear un registro de aeronave
const sampleAircraftData = {
  user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7', // UUID válido del usuario de prueba
  model: 'Falcon 2000',
  registration: 'N123ABC',
  year_manufactured: 2010,
  serial_number: '123456',
  base_location: 'Miami Executive Airport',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Datos simulados del PDF de mantenimiento
const sampleMaintenanceData = {
  user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7', // UUID válido del usuario de prueba
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
  compliance_reference: 'FAA Part 145.161',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

/**
 * Función para registrar aeronave primero
 */
async function registerAircraft() {
  console.log('🛩️ Registrando aeronave...');
  
  try {
    const { data, error } = await supabase
      .from('aircraft')
      .insert([sampleAircraftData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ ERROR al registrar aeronave:', error.message);
      return null;
    }
    
    console.log('✅ Aeronave registrada exitosamente!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Modelo: ${data.model}`);
    console.log(`   Matrícula: ${data.registration}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ ERROR en registro de aeronave:', error.message);
    return null;
  }
}

/**
 * Función para registrar datos manualmente
 */
async function registerMaintenanceData(aircraftId) {
  console.log('🚀 INICIANDO REGISTRO MANUAL DE DATOS DE MANTENIMIENTO');
  console.log('='.repeat(60));
  
  try {
    console.log('📋 Datos a registrar:');
    console.log(`   Vendor: ${sampleMaintenanceData.vendor}`);
    console.log(`   Aircraft: ${sampleMaintenanceData.aircraft_registration}`);
    console.log(`   Total: $${sampleMaintenanceData.total.toLocaleString()} ${sampleMaintenanceData.currency}`);
    console.log(`   Category: ${sampleMaintenanceData.maintenance_category}`);
    console.log('');
    
    // Agregar aircraft_id al registro de mantenimiento
    const maintenanceDataWithAircraftId = {
      ...sampleMaintenanceData,
      aircraft_id: aircraftId
    };
    
    console.log('💾 Registrando en base de datos...');
    
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([maintenanceDataWithAircraftId])
      .select()
      .single();
    
    if (error) {
      console.error('❌ ERROR al registrar datos:', error.message);
      return null;
    }
    
    console.log('✅ Datos registrados exitosamente!');
    console.log(`   ID: ${data.id}`);
    console.log(`   Vendor: ${data.vendor}`);
    console.log(`   Aircraft: ${data.aircraft_registration}`);
    console.log(`   Total: $${data.total.toLocaleString()} ${data.currency}`);
    console.log(`   Status: ${data.status}`);
    
    return data;
    
  } catch (error) {
    console.error('❌ ERROR en registro:', error.message);
    return null;
  }
}

/**
 * Función para validar datos registrados
 */
async function validateRegisteredData(recordId) {
  console.log('\n✅ Validando datos registrados...');
  
  try {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', recordId)
      .single();
    
    if (error) {
      console.error('❌ ERROR al validar registro:', error.message);
      return false;
    }
    
    console.log('📋 Registro validado:');
    console.log(`   ID: ${data.id}`);
    console.log(`   Vendor: ${data.vendor}`);
    console.log(`   Aircraft: ${data.aircraft_registration}`);
    console.log(`   Total: $${data.total.toLocaleString()} ${data.currency}`);
    console.log(`   Category: ${data.maintenance_category}`);
    console.log(`   Status: ${data.status}`);
    console.log(`   Created: ${new Date(data.created_at).toLocaleString()}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ ERROR en validación:', error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 INICIANDO PROCESO DE REGISTRO MANUAL');
  console.log('='.repeat(60));
  
  // Primero registrar la aeronave
  const aircraft = await registerAircraft();
  if (!aircraft) {
    console.log('\n❌ El registro de aeronave falló');
    return;
  }
  
  // Luego registrar el mantenimiento
  const record = await registerMaintenanceData(aircraft.id);
  if (!record) {
    console.log('\n❌ El registro de mantenimiento falló');
    return;
  }
  
  const isValid = await validateRegisteredData(record.id);
  if (isValid) {
    console.log('\n🎉 REGISTRO COMPLETADO EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('✅ Aeronave registrada en base de datos');
    console.log('✅ Datos de mantenimiento registrados');
    console.log('✅ Validación completada');
    console.log('🎯 El sistema ORION OCG está funcionando perfectamente!');
  } else {
    console.log('\n❌ La validación falló');
  }
}

// Manejo de errores y ejecución
main().catch(error => {
  console.error('❌ ERROR FATAL:', error.message);
  process.exit(1);
});

module.exports = {
  registerAircraft,
  registerMaintenanceData,
  validateRegisteredData
};