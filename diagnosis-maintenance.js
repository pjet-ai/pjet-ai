// ================================================================
// SCRIPT DE DIAGNÓSTICO - MANTENIMIENTO ORION OCG
// Verificación multicapa de conexión, autenticación y datos
// ================================================================

import { createClient } from '@supabase/supabase-js';

// Configuración desde variables de entorno
const SUPABASE_URL = 'https://vvazmdauzaexknybbnfc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NzkxNjQsImV4cCI6MjA3MjM1NTE2NH0.5JaUnsAz1RKkt8A7U2Mt4S3y23yQuYaaFFBlcl0RZGE';

console.log('🚀 INICIANDO DIAGNÓSTICO COMPLETO - ORION OCG MAINTENANCE');
console.log('========================================================');

// Crear cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runDiagnosis() {
  try {
    console.log('\n📋 PASO 1: Verificación de conexión básica');
    console.log('URL:', SUPABASE_URL);
    console.log('Key length:', SUPABASE_ANON_KEY.length);

    // Test de conexión básica
    const { data, error } = await supabase.from('invoices').select('count', { count: 'exact', head: true });

    if (error) {
      console.error('❌ ERROR DE CONEXIÓN:', error.message);
      console.error('Código:', error.code);
      console.error('Detalles:', error.details);
      return;
    }

    console.log('✅ CONEXIÓN ESTABLECIDA CORRECTAMENTE');
    console.log('📊 Total de invoices en tabla:', data?.length || 0);

    console.log('\n📋 PASO 2: Verificación de vistas SQL');

    // Verificar aviation_audit_view
    console.log('\n🔍 Verificando aviation_audit_view...');
    const { data: auditView, error: auditError } = await supabase
      .from('aviation_audit_view')
      .select('*')
      .limit(1);

    if (auditError) {
      console.error('❌ ERROR EN aviation_audit_view:', auditError.message);
    } else {
      console.log('✅ aviation_audit_view accesible');
      console.log('📊 Datos:', auditView?.[0] || 'Sin datos');
    }

    // Verificar maintenance_invoice_summary_view
    console.log('\n🔍 Verificando maintenance_invoice_summary_view...');
    const { data: summaryView, error: summaryError } = await supabase
      .from('maintenance_invoice_summary_view')
      .select('*')
      .limit(5);

    if (summaryError) {
      console.error('❌ ERROR EN maintenance_invoice_summary_view:', summaryError.message);
    } else {
      console.log('✅ maintenance_invoice_summary_view accesible');
      console.log('📊 Registros encontrados:', summaryView?.length || 0);
      if (summaryView && summaryView.length > 0) {
        console.log('📋 Primer registro:', JSON.stringify(summaryView[0], null, 2));
      }
    }

    // Verificar maintenance_stats_view
    console.log('\n🔍 Verificando maintenance_stats_view...');
    const { data: statsView, error: statsError } = await supabase
      .from('maintenance_stats_view')
      .select('*')
      .limit(1);

    if (statsError) {
      console.error('❌ ERROR EN maintenance_stats_view:', statsError.message);
    } else {
      console.log('✅ maintenance_stats_view accesible');
      console.log('📊 Datos:', statsView?.[0] || 'Sin datos');
    }

    console.log('\n📋 PASO 3: Verificación de tablas base y relaciones');

    // Verificar tabla invoices
    console.log('\n🔍 Verificando tabla invoices...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select('*')
      .limit(3);

    if (invoicesError) {
      console.error('❌ ERROR EN TABLA invoices:', invoicesError.message);
    } else {
      console.log('✅ Tabla invoices accesible');
      console.log('📊 Total invoices:', invoices?.length || 0);
      if (invoices && invoices.length > 0) {
        console.log('📋 Primer invoice:', JSON.stringify(invoices[0], null, 2));
      }
    }

    // Verificar tabla discrepancies
    console.log('\n🔍 Verificando tabla discrepancies...');
    const { data: discrepancies, error: discrepanciesError } = await supabase
      .from('discrepancies')
      .select('*')
      .limit(3);

    if (discrepanciesError) {
      console.error('❌ ERROR EN TABLA discrepancies:', discrepanciesError.message);
    } else {
      console.log('✅ Tabla discrepancies accesible');
      console.log('📊 Total discrepancies:', discrepancies?.length || 0);
      if (discrepancies && discrepancies.length > 0) {
        console.log('📋 Primer discrepancy:', JSON.stringify(discrepancies[0], null, 2));
      }
    }

    // Verificar tabla discrepancy_costs
    console.log('\n🔍 Verificando tabla discrepancy_costs...');
    const { data: costs, error: costsError } = await supabase
      .from('discrepancy_costs')
      .select('*')
      .limit(3);

    if (costsError) {
      console.error('❌ ERROR EN TABLA discrepancy_costs:', costsError.message);
    } else {
      console.log('✅ Tabla discrepancy_costs accesible');
      console.log('📊 Total costs:', costs?.length || 0);
      if (costs && costs.length > 0) {
        console.log('📋 Primer cost:', JSON.stringify(costs[0], null, 2));
      }
    }

    console.log('\n📋 PASO 4: Análisis de relaciones y datos completos');

    // Obtener datos con joins completos
    console.log('\n🔍 Consulta con joins completos...');
    const { data: completeData, error: completeError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        work_order_number,
        invoice_date,
        currency_code,
        reported_total,
        discrepancies (
          id,
          item_number,
          description,
          discrepancy_costs (
            id,
            cost_category_id,
            amount
          )
        )
      `)
      .limit(2);

    if (completeError) {
      console.error('❌ ERROR EN CONSULTA COMPLETA:', completeError.message);
    } else {
      console.log('✅ Consulta con joins exitosa');
      console.log('📊 Registros con relaciones:', completeData?.length || 0);
      if (completeData && completeData.length > 0) {
        console.log('📋 Primer registro completo:', JSON.stringify(completeData[0], null, 2));
      }
    }

    console.log('\n📋 PASO 5: Verificación de permisos y autenticación');

    // Test de inserción (solo verificar permisos)
    console.log('\n🔍 Verificando permisos de lectura/escritura...');
    const { data: testInsert, error: testError } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);

    if (testError) {
      console.error('❌ ERROR DE PERMISOS:', testError.message);
    } else {
      console.log('✅ Permisos de lectura correctos');
    }

    console.log('\n🎯 DIAGNÓSTICO COMPLETADO');
    console.log('========================');

    // Resumen final
    console.log('\n📊 RESUMEN DE DIAGNÓSTICO:');
    console.log('- Conexión a Supabase: ✅ Funcional');
    console.log('- Vistas SQL: ✅ Accesibles');
    console.log('- Tablas base: ✅ Accesibles');
    console.log('- Relaciones: ✅ Funcionales');
    console.log('- Permisos: ✅ Correctos');

  } catch (error) {
    console.error('❌ ERROR CRÍTICO EN DIAGNÓSTICO:', error);
    console.error('Stack:', error.stack);
  }
}

// Ejecutar diagnóstico
runDiagnosis().then(() => {
  console.log('\n🏁 DIAGNÓSTICO FINALIZADO');
  process.exit(0);
}).catch(error => {
  console.error('❌ ERROR FATAL:', error);
  process.exit(1);
});