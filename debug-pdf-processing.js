// Test de procesamiento de PDFs para diagnosticar problemas de extracción
// Este script ayuda a entender cómo el document-orchestrator procesa los PDFs

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

async function testPDFProcessing() {
  console.log('🔍 INICIO: Test de procesamiento de PDFs');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  try {
    // 1. Verificar sesión
    console.log('\n1. Verificando sesión...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Error de sesión:', sessionError?.message || 'No hay sesión');
      return;
    }
    
    console.log('✅ Sesión verificada para usuario:', session.user.email);
    
    // 2. Buscar archivos PDF en el directorio actual
    console.log('\n2. Buscando archivos PDF de prueba...');
    const testDir = path.join(__dirname, '_archive', 'pdf-samples');
    let pdfFiles = [];
    
    try {
      if (fs.existsSync(testDir)) {
        pdfFiles = fs.readdirSync(testDir).filter(file => file.endsWith('.pdf'));
      }
    } catch (error) {
      console.log('⚠️  No se pudo leer el directorio de PDFs de prueba');
    }
    
    if (pdfFiles.length === 0) {
      console.log('ℹ️  No se encontraron PDFs de prueba. Creando uno de muestra...');
      
      // Crear un PDF de texto simple para prueba
      const samplePDFContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 <<
      /Type /Font
      /Subtype /Type1
      /BaseFont /Helvetica
    >>
  >>
>>
>>
endobj

4 0 obj
<<
/Length 200
>>
stream
BT
/F1 18 Tf
100 700 Td
(Test Invoice) Tj
/F1 12 Tf
100 650 Td
(Vendor: Aviation Maintenance Services) Tj
100 630 Td
(Invoice #: INV-2024-001) Tj
100 610 Td
(Date: 2024-01-15) Tj
100 590 Td
(Total: $1,250.00) Tj
100 570 Td
(Work Description: Engine Inspection) Tj
100 550 Td
(Aircraft: N12345) Tj
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000364 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
586
%%EOF`;
      
      fs.writeFileSync(path.join(__dirname, 'test-invoice.pdf'), samplePDFContent);
      pdfFiles = ['test-invoice.pdf'];
      console.log('✅ PDF de prueba creado: test-invoice.pdf');
    }
    
    // 3. Probar con cada PDF encontrado
    for (const pdfFile of pdfFiles) {
      console.log(`\n3. Probando con archivo: ${pdfFile}`);
      
      let pdfBuffer;
      let filePath;
      
      if (pdfFile === 'test-invoice.pdf') {
        filePath = path.join(__dirname, pdfFile);
        pdfBuffer = fs.readFileSync(filePath);
      } else {
        filePath = path.join(testDir, pdfFile);
        pdfBuffer = fs.readFileSync(filePath);
      }
      
      console.log(`   Tamaño: ${pdfBuffer.length} bytes`);
      
      // Crear Blob para FormData
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
      const formData = new FormData();
      formData.append('file', blob, pdfFile);
      formData.append('uploadSource', 'maintenance');
      
      // 4. Llamar al document-orchestrator
      console.log('   Enviando a document-orchestrator...');
      
      try {
        const { data: result, error: functionError } = await supabase.functions.invoke(
          'document-orchestrator',
          {
            body: formData,
          }
        );
        
        if (functionError) {
          console.error('❌ Error en document-orchestrator:', functionError.message);
          
          if (functionError.message.includes('Unauthorized')) {
            console.log('   🔍 DIAGNÓSTICO: Error de autenticación');
            console.log('   - Verifica que el token de autenticación se envíe correctamente');
            console.log('   - Revisa los headers CORS en la función');
          } else if (functionError.message.includes('Upload failed')) {
            console.log('   🔍 DIAGNÓSTICO: Error de upload a storage');
            console.log('   - Verifica el bucket "receipts" y permisos');
          } else if (functionError.message.includes('Database error')) {
            console.log('   🔍 DIAGNÓSTICO: Error de base de datos');
            console.log('   - Verifica políticas RLS y estructura de tablas');
          }
          
          continue;
        }
        
        console.log('✅ Respuesta recibida:');
        console.log('   Estructura:', Object.keys(result));
        
        if (result.success) {
          console.log('   ✅ Procesamiento exitoso');
          console.log(`   Record ID: ${result.recordId}`);
          console.log(`   Record Type: ${result.recordType}`);
          
          if (result.extractedData) {
            console.log('   Datos extraídos:');
            console.log(`   - Vendor: ${result.extractedData.vendor}`);
            console.log(`   - Total: ${result.extractedData.total}`);
            console.log(`   - Date: ${result.extractedData.date}`);
            console.log(`   - Description: ${result.extractedData.work_description}`);
            console.log(`   - Aircraft: ${result.extractedData.aircraft_registration}`);
            console.log(`   - Labor Total: ${result.extractedData.labor_total}`);
            console.log(`   - Parts Total: ${result.extractedData.parts_total}`);
            console.log(`   - Confidence: ${result.extractedData.confidence}`);
          }
          
          if (result.fromCache) {
            console.log('   📋 Resultado desde caché');
          }
        } else {
          console.log('   ❌ Procesamiento fallido:', result.error);
        }
        
        // 5. Analizar el formato de respuesta vs lo que espera el frontend
        console.log('\n   🔍 ANÁLISIS DE FORMATO:');
        console.log('   Lo que devuelve el orquestador:');
        console.log('   - result.extractedData.vendor');
        console.log('   - result.extractedData.total');
        console.log('   - result.extractedData.date');
        console.log('   ');
        console.log('   Lo que espera el frontend:');
        console.log('   - result.data.vendor (LÍNEA 434 - ERROR)');
        console.log('   - result.data.total');
        console.log('   - result.data.date');
        console.log('   ');
        console.log('   🚨 PROBLEMA IDENTIFICADO: Estructura de datos incompatible');
        
      } catch (invokeError) {
        console.error('❌ Error invocando función:', invokeError.message);
        console.log('   Esto podría indicar problemas de red o configuración');
      }
      
      // Limpiar archivo de prueba si se creó
      if (pdfFile === 'test-invoice.pdf' && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('   🧹 Archivo de prueba eliminado');
      }
    }
    
    // 6. Verificar el estado actual de la base de datos
    console.log('\n4. Verificando registros recientes...');
    const { data: recentRecords, error: recordsError } = await supabase
      .from('maintenance_records')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (recordsError) {
      console.error('❌ Error consultando registros:', recordsError.message);
    } else {
      console.log('✅ Registros recientes:');
      recentRecords.forEach((record, index) => {
        console.log(`   ${index + 1}. ID: ${record.id}`);
        console.log(`      Vendor: ${record.vendor}`);
        console.log(`      Total: ${record.total}`);
        console.log(`      Status: ${record.status}`);
        console.log(`      Created: ${record.created_at}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
  
  console.log('\n🔍 FIN: Test de procesamiento de PDFs');
}

// Ejecutar el test
testPDFProcessing().catch(console.error);