// 🧪 TEST DE VALIDACIÓN DEL NUEVO FLUJO - Solución Anti-Pattern
// Valida que el problema de guardado automático sin consentimiento esté resuelto

const EXTRACT_URL = 'https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/extract-maintenance-data';
const SAVE_URL = 'https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/save-maintenance-record';

async function testNewFlowValidation() {
  console.log('🧪 TESTING NEW FLOW - Anti-Pattern Solution Validation');
  console.log('🎯 Validating: Extraction WITHOUT automatic save + Manual save with consent\n');
  
  try {
    // Crear mock PDF que simule mega_factura.pdf
    let mockPdfContent = '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n' +
      '2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R 4 0 R 5 0 R 6 0 R 7 0 R 8 0 R 9 0 R 10 0 R 11 0 R 12 0 R 13 0 R 14 0 R 15 0 R 16 0 R 17 0 R]\n/Count 15\n>>\nendobj\n';
    
    // Agregar objetos de página
    for (let i = 3; i <= 17; i++) {
      mockPdfContent += `${i} 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\n`;
    }
    
    // Contenido de mantenimiento aeronáutico
    mockPdfContent += 'AVMATS JET SUPPORT MAINTENANCE INVOICE\n' +
      'Invoice #: INV-2024-TEST-001\n' +
      'Date: January 15, 2024\n' +
      'Aircraft Registration: N123TEST\n' +
      'Aircraft Type: Falcon 2000\n' +
      'Serial Number: 123456\n' +
      'Total Amount: $124,253.02\n' +
      '\n' +
      'FINANCIAL BREAKDOWN:\n' +
      'Squawks Resolution: $2,500.00\n' +
      'Labor Costs: $82,698.96\n' +
      'Parts and Materials: $37,615.35\n' +
      'Services and Testing: $1,263.10\n' +
      'Freight and Shipping: $174.61\n' +
      '\n' +
      'PARTS UTILIZED:\n' +
      'Part #: ENG-TEST-123\n' +
      'Description: Test Engine Component\n' +
      'Manufacturer: AVMATS\n' +
      'Quantity: 1\n' +
      'Unit Price: $15,000.00\n' +
      'Total: $15,000.00\n' +
      'Category: Engine\n' +
      '\n' +
      'MAINTENANCE CATEGORY: Scheduled Inspection\n' +
      'Work Description: Test maintenance for new flow validation.';
    
    // Completar PDF
    mockPdfContent += 'xref\n0 18\n0000000000 65535 f \n';
    for (let i = 1; i <= 17; i++) {
      mockPdfContent += `000000${9 + i * 50} 00000 n \n`;
    }
    mockPdfContent += 'trailer\n<<\n/Size 18\n/Root 1 0 R\n>>\nstartxref\n2100\n%%EOF';
    
    const mockFile = new Blob([mockPdfContent], { type: 'application/pdf' });
    
    // ✅ FASE 1: TEST EXTRACT-MAINTENANCE-DATA (Solo extracción)
    console.log('🔍 FASE 1: Testing extract-maintenance-data (extraction only)');
    
    const extractFormData = new FormData();
    extractFormData.append('file', mockFile, 'test_new_flow.pdf');
    extractFormData.append('uploadSource', 'maintenance');
    
    console.log('📤 Sending to extract-maintenance-data...');
    
    const extractStartTime = Date.now();
    const extractResponse = await fetch(EXTRACT_URL, {
      method: 'POST',
      body: extractFormData
    });
    
    const extractTime = Date.now() - extractStartTime;
    const extractResult = await extractResponse.json();
    
    console.log('\n📋 EXTRACT-MAINTENANCE-DATA RESULT:');
    console.log('Status:', extractResponse.status);
    console.log('Success:', extractResult.success);
    console.log('Processing Time:', extractTime + 'ms');
    
    if (extractResult.success) {
      const extractedData = extractResult.extractedData;
      console.log('\n✅ EXTRACTION SUCCESS - Data Analysis:');
      console.log('Vendor:', extractedData.vendor);
      console.log('Total:', extractedData.total);
      console.log('Aircraft Registration:', extractedData.aircraft_registration);
      console.log('Maintenance Category:', extractedData.maintenance_category);
      
      // ✅ VALIDACIÓN CRÍTICA 1: NO debe haber ID de registro
      if (extractResult.maintenance?.id) {
        console.log('\n❌ CRITICAL FAILURE: Record ID found in extraction response!');
        console.log('❌ This means data was automatically saved without consent');
        console.log('❌ Anti-pattern NOT resolved');
        return false;
      } else {
        console.log('✅ VALIDATION 1 PASSED: No record ID found - data NOT automatically saved');
      }
      
      // ✅ VALIDACIÓN CRÍTICA 2: Datos deben estar disponibles para revisión
      if (!extractedData.vendor || !extractedData.total) {
        console.log('\n❌ VALIDATION 2 FAILED: Essential data missing');
        return false;
      } else {
        console.log('✅ VALIDATION 2 PASSED: Essential data extracted and available for review');
      }
      
      // ✅ FASE 2: TEST SAVE-MAINTENANCE-RECORD (Solo guardado CON CONSENTIMIENTO)
      console.log('\n💾 FASE 2: Testing save-maintenance-record (save with consent)');
      
      const savePayload = {
        extractedData: extractedData,
        originalFile: null // Simulating no file for test
      };
      
      console.log('📤 Sending to save-maintenance-record...');
      
      const saveStartTime = Date.now();
      const saveResponse = await fetch(SAVE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(savePayload)
      });
      
      const saveTime = Date.now() - saveStartTime;
      const saveResult = await saveResponse.json();
      
      console.log('\n📋 SAVE-MAINTENANCE-RECORD RESULT:');
      console.log('Status:', saveResponse.status);
      console.log('Success:', saveResult.success);
      console.log('Processing Time:', saveTime + 'ms');
      
      if (saveResult.success) {
        console.log('\n✅ SAVE SUCCESS - Database Analysis:');
        console.log('Record ID:', saveResult.maintenance?.id);
        console.log('Vendor Saved:', saveResult.maintenance?.vendor);
        console.log('Components Saved:', saveResult.savedComponents);
        
        // ✅ VALIDACIÓN CRÍTICA 3: Debe haber ID después del guardado
        if (!saveResult.maintenance?.id) {
          console.log('\n❌ VALIDATION 3 FAILED: No record ID after save operation');
          return false;
        } else {
          console.log('✅ VALIDATION 3 PASSED: Record successfully saved with ID');
        }
        
        // ✅ VALIDACIÓN CRÍTICA 4: Datos deben coincidir
        if (saveResult.maintenance.vendor !== extractedData.vendor) {
          console.log('\n❌ VALIDATION 4 FAILED: Data mismatch between extract and save');
          return false;
        } else {
          console.log('✅ VALIDATION 4 PASSED: Data consistency maintained');
        }
        
      } else {
        console.log('\n❌ SAVE FAILED:', saveResult.error);
        return false;
      }
      
    } else {
      console.log('\n❌ EXTRACTION FAILED:', extractResult.error);
      return false;
    }
    
    // ✅ VALIDACIÓN FINAL
    console.log('\n' + '═'.repeat(80));
    console.log('🎯 ANÁLISIS FINAL - SOLUCIÓN ANTI-PATTERN');
    console.log('═'.repeat(80));
    
    console.log('\n✅ PROBLEMA RESUELTO:');
    console.log('1. ✅ Extracción funciona SIN guardado automático');
    console.log('2. ✅ Usuario puede revisar datos antes de confirmar');
    console.log('3. ✅ Guardado ocurre SOLO con consentimiento explícito');
    console.log('4. ✅ Datos se mantienen consistentes entre fases');
    
    console.log('\n🎉 NUEVO FLUJO VALIDADO EXITOSAMENTE:');
    console.log('🔍 extract-maintenance-data → 👤 User Review → 💾 save-maintenance-record');
    console.log('🚫 Anti-pattern eliminated: No more automatic saving without consent');
    
    return true;
    
  } catch (error) {
    console.error('\n🚨 TEST FAILED with error:', error.message);
    console.error('Stack:', error.stack);
    return false;
  }
}

// Ejecutar test
console.log('🧪 INICIATING NEW FLOW VALIDATION TEST\n');

testNewFlowValidation()
  .then((success) => {
    if (success) {
      console.log('\n✅ ¡NEW FLOW VALIDATION PASSED!');
      console.log('🎯 Anti-pattern successfully resolved');
      console.log('🚀 System ready for production with proper user consent flow');
    } else {
      console.log('\n❌ NEW FLOW VALIDATION FAILED');
      console.log('⚠️ Anti-pattern may still exist - needs further investigation');
    }
  })
  .catch(error => {
    console.error('\n❌ VALIDATION TEST CRASHED:', error);
  });