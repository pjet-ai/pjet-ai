// Test de autenticación y función document-orchestrator
// Este script ayuda a diagnosticar problemas de autenticación y RLS

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

async function testAuthentication() {
  console.log('🔍 INICIO: Test de autenticación y funciones');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 1. Verificar si podemos obtener la sesión actual
    console.log('\n1. Verificando sesión actual...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Error obteniendo sesión:', sessionError.message);
      return;
    }
    
    if (!session) {
      console.log('⚠️  No hay sesión activa. Necesitas iniciar sesión primero.');
      console.log('💡 Para probar, inicia sesión en la aplicación y luego corre este test.');
      return;
    }
    
    console.log('✅ Sesión activa encontrada:');
    console.log(`   Usuario ID: ${session.user.id}`);
    console.log(`   Email: ${session.user.email}`);
    console.log(`   Access Token: ${session.access_token.substring(0, 20)}...`);
    
    // 2. Probar acceso a la tabla maintenance_records
    console.log('\n2. Verificando acceso a maintenance_records...');
    const { data: records, error: recordsError } = await supabase
      .from('maintenance_records')
      .select('*')
      .limit(1);
    
    if (recordsError) {
      console.error('❌ Error accediendo a maintenance_records:', recordsError.message);
      console.error('   Código:', recordsError.code);
      console.error('   Detalles:', recordsError.details);
    } else {
      console.log('✅ Acceso a maintenance_records exitoso');
      console.log(`   Registros encontrados: ${records.length}`);
    }
    
    // 3. Probar la función document-orchestrator con un test
    console.log('\n3. Probando función document-orchestrator...');
    
    // Crear un archivo de prueba simple
    const testFile = new Blob(['Test file content for orchestrator'], {
      type: 'text/plain'
    });
    
    const formData = new FormData();
    formData.append('file', testFile, 'test.txt');
    formData.append('uploadSource', 'maintenance');
    
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'document-orchestrator',
        {
          body: formData,
        }
      );
      
      if (functionError) {
        console.error('❌ Error en document-orchestrator:', functionError.message);
        console.error('   Context:', functionError.context);
        
        if (functionError.message.includes('Unauthorized')) {
          console.log('\n🔍 DIAGNÓSTICO: Problema de autenticación en la función');
          console.log('   - La función no está recibiendo correctamente el token de autenticación');
          console.log('   - Verifica que los headers se envíen correctamente');
          console.log('   - Revisa la configuración de CORS en la función');
        }
      } else {
        console.log('✅ Función document-orchestrator respondió:');
        console.log('   Estructura de respuesta:', JSON.stringify(functionData, null, 2));
      }
    } catch (invokeError) {
      console.error('❌ Error invocando función:', invokeError.message);
    }
    
    // 4. Verificar políticas RLS
    console.log('\n4. Verificando políticas RLS...');
    
    try {
      // Intentar insertar un registro de prueba
      const { data: insertData, error: insertError } = await supabase
        .from('maintenance_records')
        .insert({
          user_id: session.user.id,
          date: new Date().toISOString().split('T')[0],
          vendor: 'Test Vendor',
          total: 100.00,
          currency: 'USD',
          status: 'Test'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('❌ Error insertando registro de prueba:', insertError.message);
        console.error('   Código:', insertError.code);
        
        if (insertError.code === '42501') {
          console.log('\n🔍 DIAGNÓSTICO: Política RLS bloqueando inserción');
          console.log('   - La política INSERT no está permitiendo la operación');
          console.log('   - Verifica que la política "Users can create their own maintenance records" exista');
        }
      } else {
        console.log('✅ Inserción de prueba exitosa');
        console.log('   ID del registro:', insertData.id);
        
        // Limpiar el registro de prueba
        await supabase
          .from('maintenance_records')
          .delete()
          .eq('id', insertData.id);
          
        console.log('   Registro de prueba eliminado');
      }
    } catch (insertTestError) {
      console.error('❌ Error en test de inserción:', insertTestError.message);
    }
    
  } catch (error) {
    console.error('❌ Error general en el test:', error.message);
  }
  
  console.log('\n🔍 FIN: Test de autenticación y funciones');
}

// Ejecutar el test
testAuthentication().catch(console.error);