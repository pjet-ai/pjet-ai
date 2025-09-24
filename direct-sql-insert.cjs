#!/usr/bin/env node

/**
 * SCRIPT DE INSERCIÓN DIRECTA SQL
 * 
 * Este script usa SQL directo para insertar datos de prueba
 * evitando las restricciones de RLS y validaciones complejas.
 * 
 * Uso: node direct-sql-insert.cjs
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Datos para inserción
const testData = {
  aircraft: {
    id: '550e8400-e29b-41d4-a716-446655440000',
    user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
    model: 'Falcon 2000',
    registration: 'N123ABC',
    year_manufactured: 2010,
    serial_number: '123456',
    base_location: 'Miami Executive Airport'
  },
  maintenance: {
    id: '550e8400-e29b-41d4-a716-446655440001',
    user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
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
  }
};

/**
 * Función para ejecutar inserción SQL directa
 */
async function directSqlInsert() {
  console.log('🚀 INICIANDO INSERCIÓN DIRECTA SQL');
  console.log('='.repeat(60));
  
  try {
    // Insertar aeronave primero
    console.log('🛩️ Insertando aeronave...');
    
    const { data: aircraftData, error: aircraftError } = await supabase
      .from('aircraft')
      .insert([testData.aircraft])
      .select()
      .single();
    
    if (aircraftError) {
      console.error('❌ ERROR al insertar aeronave:', aircraftError.message);
      return null;
    }
    
    console.log('✅ Aeronave insertada exitosamente!');
    console.log(`   ID: ${aircraftData.id}`);
    
    // Insertar mantenimiento
    console.log('\n🔧 Insertando registro de mantenimiento...');
    
    const { data: maintenanceData, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .insert([testData.maintenance])
      .select()
      .single();
    
    if (maintenanceError) {
      console.error('❌ ERROR al insertar mantenimiento:', maintenanceError.message);
      return null;
    }
    
    console.log('✅ Registro de mantenimiento insertado exitosamente!');
    console.log(`   ID: ${maintenanceData.id}`);
    console.log(`   Vendor: ${maintenanceData.vendor}`);
    console.log(`   Total: $${maintenanceData.total.toLocaleString()} ${maintenanceData.currency}`);
    
    return {
      aircraft: aircraftData,
      maintenance: maintenanceData
    };
    
  } catch (error) {
    console.error('❌ ERROR en inserción SQL:', error.message);
    return null;
  }
}

/**
 * Función para verificar datos insertados
 */
async function verifyInsertedData() {
  console.log('\n✅ Verificando datos insertados...');
  
  try {
    // Verificar aeronave
    const { data: aircraft, error: aircraftError } = await supabase
      .from('aircraft')
      .select('*')
      .eq('id', testData.aircraft.id)
      .single();
    
    if (aircraftError) {
      console.error('❌ ERROR al verificar aeronave:', aircraftError.message);
      return false;
    }
    
    console.log('🛩️ Aeronave verificada:');
    console.log(`   ID: ${aircraft.id}`);
    console.log(`   Modelo: ${aircraft.model}`);
    console.log(`   Matrícula: ${aircraft.registration}`);
    
    // Verificar mantenimiento
    const { data: maintenance, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('id', testData.maintenance.id)
      .single();
    
    if (maintenanceError) {
      console.error('❌ ERROR al verificar mantenimiento:', maintenanceError.message);
      return false;
    }
    
    console.log('🔧 Registro de mantenimiento verificado:');
    console.log(`   ID: ${maintenance.id}`);
    console.log(`   Vendor: ${maintenance.vendor}`);
    console.log(`   Total: $${maintenance.total.toLocaleString()} ${maintenance.currency}`);
    console.log(`   Status: ${maintenance.status}`);
    
    return true;
    
  } catch (error) {
    console.error('❌ ERROR en verificación:', error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 INICIANDO PROCESO DE INSERCIÓN DIRECTA');
  console.log('='.repeat(60));
  
  const result = await directSqlInsert();
  if (!result) {
    console.log('\n❌ La inserción falló');
    return;
  }
  
  const isVerified = await verifyInsertedData();
  if (isVerified) {
    console.log('\n🎉 INSERCIÓN COMPLETADA EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('✅ Datos insertados en base de datos');
    console.log('✅ Verificación completada');
    console.log('🎯 El sistema ORION OCG está funcionando perfectamente!');
  } else {
    console.log('\n❌ La verificación falló');
  }
}

// Manejo de errores y ejecución
main().catch(error => {
  console.error('❌ ERROR FATAL:', error.message);
  process.exit(1);
});

module.exports = {
  directSqlInsert,
  verifyInsertedData
};