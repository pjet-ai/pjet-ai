import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase (remota)
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NzkxNjQsImV4cCI6MjA3MjM1NTE2NH0.5JaUnsAz1RKkt8A7U2Mt4S3y23yQuYaaFFBlcl0RZGE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugViews() {
  console.log('🔍 Depurando vistas SQL...\n');

  // 1. Verificar maintenance_invoice_summary_view
  console.log('1. 📋 maintenance_invoice_summary_view:');
  try {
    const { data, error } = await supabase
      .from('maintenance_invoice_summary_view')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log(`✅ Encontrados ${data?.length || 0} registros`);
      if (data && data.length > 0) {
        console.log('📊 Primer registro:');
        console.log(JSON.stringify(data[0], null, 2));
      } else {
        console.log('⚠️  Vista está vacía');
      }
    }
  } catch (err) {
    console.error('❌ Error crítico:', err.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 2. Verificar maintenance_stats_view
  console.log('2. 📈 maintenance_stats_view:');
  try {
    const { data, error } = await supabase
      .from('maintenance_stats_view')
      .select('*');

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Vista encontrada:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Error crítico:', err.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 3. Verificar aviation_audit_view
  console.log('3. 🔍 aviation_audit_view:');
  try {
    const { data, error } = await supabase
      .from('aviation_audit_view')
      .select('*');

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Vista encontrada:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Error crítico:', err.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 4. Verificar tablas base para comparación
  console.log('4. 🗂️  Tabla base invoices:');
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error:', error.message);
    } else {
      console.log('✅ Datos originales:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ Error crítico:', err.message);
  }
}

debugViews();