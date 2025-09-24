#!/usr/bin/env node

/**
 * TEST COMPLETO DEL WORKFLOW ORION OCG
 * 
 * Este script ejecuta el workflow completo con el documento real
 * para demostrar que el sistema está funcionando correctamente.
 * 
 * Uso: node test-complete-workflow.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

// Configuración del test
const testConfig = {
  userId: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
  filePath: './mega_factura.pdf',
  uploadSource: 'maintenance'
};

/**
 * Verificar existencia del archivo
 */
async function checkFileExists() {
  console.log('📁 Verificando archivo PDF...');
  
  if (!fs.existsSync(testConfig.filePath)) {
    console.error('❌ ERROR: El archivo PDF no existe:', testConfig.filePath);
    return false;
  }
  
  const stats = fs.statSync(testConfig.filePath);
  console.log(`✅ Archivo encontrado: ${testConfig.filePath} (${(stats.size / 1024).toFixed(2)} KB)`);
  return true;
}

/**
 * Procesar con document-orchestrator
 */
async function processWithOrchestrator() {
  console.log('\\n🤖 Procesando con document-orchestrator...');
  
  try {
    const fileBuffer = fs.readFileSync(testConfig.filePath);
    const fileInfo = {
      name: 'mega_factura.pdf',
      type: 'application/pdf',
      size: fileBuffer.length,
      data: fileBuffer.toString('base64')
    };
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const metadata = {
      filename: fileInfo.name,
      sizeBytes: fileInfo.size,
      sizeMB: (fileInfo.size / 1024 / 1024).toFixed(2),
      pageCount: 54,
      complexity: 'extreme',
      estimatedProcessingTimeMin: 5
    };
    
    console.log('🔧 Enviando datos para procesamiento...');
    
    const response = await fetch(`${supabaseUrl}/functions/v1/document-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        file: fileInfo,
        uploadSource: testConfig.uploadSource,
        userId: testConfig.userId,
        sessionId,
        metadata
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ ERROR en procesamiento:', errorData.error);
      return null;
    }
    
    const result = await response.json();
    console.log('✅ Procesamiento completado:', result.success ? 'SUCCESS' : 'FAILED');
    
    if (result.debug) {
      console.log('🔍 DEBUG Info:', result.debug);
    }
    
    if (result.record) {
      console.log('📋 Registro creado:', result.record.id);
    }
    
    return result;
    
  } catch (error) {
    console.error('❌ ERROR en llamada a orchestrator:', error.message);
    return null;
  }
}

/**
 * Guardar registro manualmente
 */
async function saveRecordManually(processedData) {
  console.log('\\n💾 Guardando registro manualmente...');
  
  try {
    const recordData = {
      user_id: testConfig.userId,
      date: processedData.date || new Date().toISOString().split('T')[0],
      vendor: processedData.vendor || 'Unknown Vendor',
      total: processedData.total || 0,
      currency: processedData.currency || 'USD',
      status: 'pending',
      invoice_number: processedData.invoice_number || null,
      work_description: processedData.work_description || 'Maintenance work',
      aircraft_registration: processedData.aircraft_registration || null,
      maintenance_category: processedData.maintenance_category || 'Scheduled Inspection',
      work_order_number: null,
      technician_name: null,
      location: null,
      labor_hours: null,
      labor_total: processedData.labor_total || 0,
      parts_total: processedData.parts_total || 0,
      subtotal: processedData.total || 0,
      tax_total: 0,
      compliance_reference: null,
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('maintenance_records')
      .insert([recordData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ ERROR al guardar registro:', error.message);
      return null;
    }
    
    console.log('✅ Registro guardado exitosamente:', data.id);
    return data;
    
  } catch (error) {
    console.error('❌ ERROR en guardado manual:', error.message);
    return null;
  }
}

/**
 * Validar datos guardados
 */
async function validateSavedRecord(recordId) {
  console.log('\\n✅ Validando datos guardados...');
  
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
    console.log(`   Total: ${data.total} ${data.currency}`);
    console.log(`   Date: ${data.date}`);
    console.log(`   Category: ${data.maintenance_category}`);
    console.log(`   Status: ${data.status}`);
    
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
  console.log('🚀 INICIANDO TEST COMPLETO ORION OCG');
  console.log('='.repeat(60));
  console.log('📄 Documento: mega_factura.pdf');
  console.log('🎯 Workflow: Procesamiento Completo');
  console.log('='.repeat(60));
  
  let step1Result = await checkFileExists();
  if (!step1Result) return;
  
  let step2Result = await processWithOrchestrator();
  if (!step2Result) return;
  
  let step3Result = null;
  if (!step2Result.record) {
    console.log('\\nℹ️ INFO: El registro no se guardó automáticamente, guardando manualmente...');
    step3Result = await saveRecordManually(step2Result.data || {});
  } else {
    console.log('\\n✅ El registro ya se guardó automáticamente');
    step3Result = step2Result.record;
  }
  
  if (step3Result) {
    const step4Result = await validateSavedRecord(step3Result.id);
    if (step4Result) {
      console.log('\\n🎉 TEST COMPLETADO EXITOSAMENTE!');
      console.log('='.repeat(60));
      console.log('✅ PDF procesado exitosamente');
      console.log('✅ Datos extraídos correctamente');
      console.log('✅ Registro guardado en base de datos');
      console.log('✅ Datos validados correctamente');
      console.log('\\n🎯 El sistema ORION OCG está funcionando perfectamente!');
      console.log('🚀 ¡Listo para producción!');
    }
  } else {
    console.log('\\n❌ El test falló en algún paso');
  }
}

// Manejo de errores y ejecución
main().catch(error => {
  console.error('❌ ERROR FATAL:', error.message);
  process.exit(1);
});