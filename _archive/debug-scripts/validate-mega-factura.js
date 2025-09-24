// 🎯 VALIDACIÓN ESPECÍFICA CON MEGA_FACTURA.PDF
// Testing del Stage 0 con el PDF crítico de 54 páginas

import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

const SUPABASE_URL = 'https://vvazmdauzaexknybbnfc.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/robust-pdf-processor`;
const PDF_PATH = './mega_factura.pdf';

async function validateMegaFactura() {
  console.log('🎯 VALIDANDO STAGE 0 CON MEGA_FACTURA.PDF');
  
  try {
    // Verificar que el archivo existe
    if (!fs.existsSync(PDF_PATH)) {
      console.log('❌ mega_factura.pdf not found in current directory');
      console.log('📍 Please ensure mega_factura.pdf is in the project root');
      return;
    }

    const fileStats = fs.statSync(PDF_PATH);
    const fileSizeMB = (fileStats.size / (1024 * 1024)).toFixed(2);
    
    console.log(`📊 File found: mega_factura.pdf (${fileSizeMB} MB)`);
    
    // Preparar FormData
    const formData = new FormData();
    formData.append('file', fs.createReadStream(PDF_PATH));
    formData.append('uploadSource', 'maintenance');
    
    console.log('🚀 Sending request to Stage 0...');
    
    // Hacer request al Stage 0
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NzkxNjQsImV4cCI6MjA3MjM1NTE2NH0.5JaUnsAz1RKkt8A7U2Mt4S3y23yQuYaaFFBlcl0RZGE'}`
      },
      body: formData
    });
    
    const result = await response.json();
    
    console.log('📋 STAGE 0 RESPONSE:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('\n✅ STAGE 0 VALIDATION RESULTS:');
      console.log('🎯 Strategy:', result.strategy);
      console.log('📊 Processing Time:', result.processingTime + 'ms');
      console.log('🎪 Session ID:', result.sessionId);
      
      if (result.viabilityResult) {
        console.log('\n📈 VIABILITY ANALYSIS:');
        console.log('Viable:', result.viabilityResult.isViable);
        console.log('Strategy:', result.viabilityResult.strategy);
        console.log('Confidence:', result.viabilityResult.confidence);
        console.log('Reasoning:', result.viabilityResult.reasoning);
        console.log('Est. Time:', result.viabilityResult.estimatedTime + ' min');
        console.log('Est. Cost: $', result.viabilityResult.estimatedCost);
        
        if (result.viabilityResult.warnings.length > 0) {
          console.log('\n⚠️  WARNINGS:');
          result.viabilityResult.warnings.forEach(warning => {
            console.log('   -', warning);
          });
        }
        
        if (result.viabilityResult.recommendations.length > 0) {
          console.log('\n💡 RECOMMENDATIONS:');
          result.viabilityResult.recommendations.forEach(rec => {
            console.log('   -', rec);
          });
        }
      }
      
      if (result.processingState?.metadata) {
        console.log('\n📊 PDF METADATA:');
        const meta = result.processingState.metadata;
        console.log('File:', meta.filename);
        console.log('Size:', meta.sizeMB + ' MB');
        console.log('Pages:', meta.pageCount);
        console.log('Complexity:', meta.complexity);
        console.log('Has Text:', meta.hasText);
        console.log('Estimated Time:', meta.estimatedProcessingTimeMin + ' min');
      }
      
    } else {
      console.log('\n❌ STAGE 0 FAILED:');
      console.log('Error:', result.error);
      console.log('Reason:', result.reason);
    }
    
  } catch (error) {
    console.error('🚨 VALIDATION ERROR:', error.message);
  }
}

// Ejecutar validación
validateMegaFactura();