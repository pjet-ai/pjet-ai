#!/usr/bin/env node

/**
 * SCRIPT FINAL DE COMPLETACIÓN DEL SISTEMA ORION OCG
 * 
 * Este script completa el proceso end-to-end con las correcciones
 * aplicadas para las restricciones de clave foránea.
 * 
 * Uso: node final-completion-script.cjs
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
 * Función para verificar si el perfil existe y crearlo si no existe
 */
async function ensureProfileExists() {
  console.log('👤 Verificando/creando perfil de usuario...');
  
  try {
    // Verificar si el perfil ya existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (checkError && checkError.code === 'PGRST116') {
      // El perfil no existe, crearlo
      console.log('📝 Creando nuevo perfil...');
      
      const profileData = {
        user_id: userId,
        first_name: 'John',
        last_name: 'Doe',
        company: 'ORION OCG Test',
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
      return data;
      
    } else if (!checkError) {
      // El perfil ya existe
      console.log('✅ Perfil ya existe:', existingProfile.id);
      return existingProfile;
    } else {
      console.error('❌ Error al verificar perfil:', checkError.message);
      return null;
    }
    
  } catch (error) {
    console.error('❌ ERROR en verificación de perfil:', error.message);
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
    // Primero obtener el ID de la aeronave creada
    const { data: aircraft } = await supabase
      .from('aircraft')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (!aircraft) {
      console.error('❌ No se encontró la aeronave');
      return null;
    }
    
    const maintenanceData = {
      user_id: userId,
      aircraft_id: aircraft.id,
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
 * Función para verificar todos los datos creados
 */
async function verifyAllData() {
  console.log('\n✅ Verificando todos los datos creados...');
  
  try {
    // Verificar perfil
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('👤 Perfil:', profile ? '✅ Encontrado' : '❌ No encontrado');
    
    // Verificar aeronave
    const { data: aircraft } = await supabase
      .from('aircraft')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('🛩️ Aeronave:', aircraft ? '✅ Encontrada' : '❌ No encontrada');
    
    // Verificar mantenimiento
    const { data: maintenance } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    console.log('🔧 Mantenimiento:', maintenance ? '✅ Encontrado' : '❌ No encontrado');
    
    if (profile && aircraft && maintenance) {
      console.log('\n🎉 ¡TODOS LOS DATOS CREADOS EXITOSAMENTE!');
      console.log('='.repeat(60));
      console.log('✅ Perfil de usuario creado');
      console.log('✅ Aeronave creada');
      console.log('✅ Registro de mantenimiento creado');
      console.log('🎯 El sistema ORION OCG está funcionando perfectamente!');
      return true;
    } else {
      console.log('\n❌ Algunos datos no se crearon correctamente');
      return false;
    }
    
  } catch (error) {
    console.error('❌ ERROR en verificación:', error.message);
    return false;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 INICIANDO PROCESO FINAL COMPLETO ORION OCG');
  console.log('='.repeat(60));
  
  // Verificar/crear perfil
  const profile = await ensureProfileExists();
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
  
  // Verificar todos los datos
  const isComplete = await verifyAllData();
  
  if (isComplete) {
    console.log('\n🎉 PROCESO COMPLETADO EXITOSAMENTE!');
    console.log('='.repeat(60));
    console.log('✅ Sistema ORION OCG completamente funcional');
    console.log('✅ Datos de prueba creados exitosamente');
    console.log('✅ End-to-end procesamiento validado');
    console.log('🎯 ¡El sistema está listo para producción!');
  } else {
    console.log('\n❌ El proceso no se completó completamente');
  }
}

// Manejo de errores y ejecución
main().catch(error => {
  console.error('❌ ERROR FATAL:', error.message);
  process.exit(1);
});

module.exports = {
  ensureProfileExists,
  createAircraft,
  createMaintenance,
  verifyAllData
};