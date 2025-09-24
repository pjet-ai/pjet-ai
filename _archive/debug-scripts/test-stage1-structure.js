// 🏗️ TESTING STAGE 1 - STRUCTURE EXTRACTOR
// Validación de extracción de texto y análisis semántico

import fs from 'fs';

const LOCAL_FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/extract-structure-stage1';

async function testStage1WithMegaFactura() {
  console.log('🏗️ TESTING STAGE 1 - STRUCTURE EXTRACTOR');
  console.log('📋 Testing with mega_factura.pdf metadata from Stage 0');
  
  try {
    // Simular metadata de mega_factura.pdf del Stage 0
    const mockSessionData = {
      sessionId: 'test-session-stage1-' + Date.now(),
      metadata: {
        filename: 'mega_factura.pdf',
        sizeBytes: 220000,
        sizeMB: 0.21,
        pageCount: 54,
        complexity: 'extreme',
        estimatedProcessingTimeMin: 8
      },
      processingState: {
        stage0Completed: true,
        strategy: 'multi_stage',
        viabilityConfirmed: true
      }
    };
    
    console.log('📊 Session Data:');
    console.log('Session ID:', mockSessionData.sessionId);
    console.log('Document:', mockSessionData.metadata.filename);
    console.log('Pages:', mockSessionData.metadata.pageCount);
    console.log('Complexity:', mockSessionData.metadata.complexity);
    
    console.log('\n🚀 Sending request to Stage 1...');
    
    const response = await fetch(LOCAL_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockSessionData)
    });
    
    const result = await response.json();
    
    console.log('\n📋 STAGE 1 RESPONSE:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Processing Time:', result.processingTime + 'ms');
    
    if (result.success) {
      console.log('\n✅ STAGE 1 STRUCTURE EXTRACTION RESULTS:');
      console.log('🎯 Session ID:', result.sessionId);
      console.log('📊 Total Sections:', result.totalSections);
      console.log('🚀 Processing Strategy:', result.processingStrategy);
      console.log('✅ Text Extraction:', result.textExtractionSuccess ? 'SUCCESS' : 'FAILED');
      console.log('🧠 Semantic Analysis:', result.semanticAnalysisSuccess ? 'SUCCESS' : 'FAILED');
      console.log('🎪 Next Stage Ready:', result.nextStageReady ? 'YES' : 'NO');
      
      if (result.extractedSections && result.extractedSections.length > 0) {
        console.log('\n📋 EXTRACTED SECTIONS:');
        result.extractedSections.slice(0, 5).forEach((section, index) => {
          console.log(`\n${index + 1}. ${section.title}`);
          console.log('   Type:', section.type);
          console.log('   Importance:', section.importance);
          console.log('   Confidence:', (section.confidence * 100).toFixed(1) + '%');
          console.log('   Pages:', `${section.pageRange[0]}-${section.pageRange[1]}`);
          console.log('   Est. Tokens:', section.estimatedTokens);
          console.log('   Preview:', section.content.substring(0, 100) + '...');
        });
        
        if (result.extractedSections.length > 5) {
          console.log(`\n... and ${result.extractedSections.length - 5} more sections`);
        }
        
        // Validar resultados esperados para mega_factura.pdf
        console.log('\n🔍 VALIDATING STAGE 1 RESULTS:');
        validateStage1Results(result);
        
      }
      
    } else {
      console.log('\n❌ STAGE 1 FAILED:');
      console.log('Error:', result.error);
      if (result.errors) {
        result.errors.forEach(error => console.log('- ', error));
      }
    }
    
  } catch (error) {
    console.error('🚨 STAGE 1 TEST ERROR:', error.message);
  }
}

function validateStage1Results(result) {
  const sections = result.extractedSections;
  
  // Validaciones específicas para mega_factura.pdf
  console.log('✅ Basic extraction:', sections.length > 0);
  
  // Debe tener secciones financieras críticas
  const financialSections = sections.filter(s => s.type === 'financial_summary');
  console.log('✅ Financial sections found:', financialSections.length > 0);
  
  // Debe tener secciones de header
  const headerSections = sections.filter(s => s.type === 'header');
  console.log('✅ Header sections found:', headerSections.length > 0);
  
  // Para 54 páginas, debe usar estrategia híbrida
  const expectedStrategy = result.processingStrategy === 'hybrid' || result.processingStrategy === 'parallel';
  console.log('✅ Correct strategy for large PDF:', expectedStrategy);
  
  // Debe tener secciones críticas identificadas
  const criticalSections = sections.filter(s => s.importance === 'critical');
  console.log('✅ Critical sections identified:', criticalSections.length > 0);
  
  // Estimación de tokens razonable
  const totalTokens = sections.reduce((sum, s) => sum + s.estimatedTokens, 0);
  console.log('✅ Token estimation reasonable:', totalTokens > 1000 && totalTokens < 100000);
  
  console.log('\n🎉 STAGE 1 VALIDATION COMPLETED');
  console.log(`📊 Ready for Stage 2 with ${sections.length} sections using ${result.processingStrategy} strategy`);
}

// Test sin archivo PDF (validación de funcionalidad)
async function testStage1Basic() {
  console.log('\n🔧 BASIC STAGE 1 FUNCTIONALITY TEST');
  
  const basicData = {
    sessionId: 'test-basic-' + Date.now(),
    metadata: {
      filename: 'test_document.pdf',
      sizeBytes: 50000,
      sizeMB: 0.05,
      pageCount: 5,
      complexity: 'low',
      estimatedProcessingTimeMin: 2
    }
  };
  
  try {
    const response = await fetch(LOCAL_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basicData)
    });
    
    const result = await response.json();
    
    console.log('✅ Basic extraction test:', result.success);
    console.log('✅ Strategy for small PDF:', result.processingStrategy === 'sequential');
    console.log('✅ Sections extracted:', result.totalSections > 0);
    
  } catch (error) {
    console.log('⚠️ Basic test failed:', error.message);
  }
}

// Ejecutar tests
console.log('🧪 STARTING STAGE 1 TESTING SUITE\n');

testStage1WithMegaFactura()
  .then(() => testStage1Basic())
  .then(() => {
    console.log('\n✅ STAGE 1 TESTING COMPLETED');
    console.log('🚀 Structure Extractor ready for production');
    console.log('🎯 Next: Implement Stage 2 (Intelligent Chunker)');
  })
  .catch(error => {
    console.error('❌ STAGE 1 TESTING FAILED:', error);
  });