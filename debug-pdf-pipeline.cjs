/**
 * 🔬 SCRIPT DEBUG COMPLETO - PDF PIPELINE ANALYZER
 * Autor: Claude Code - Ingeniero Senior
 * 
 * OBJETIVO: Identificar exactamente dónde se pierde la información
 * en el pipeline de procesamiento de PDFs
 */

const fs = require('fs');
const path = require('path');

class PDFPipelineDebugger {
  constructor(pdfPath) {
    this.pdfPath = pdfPath;
    this.steps = [];
    this.rawText = '';
    this.debugResults = {};
  }

  // ✅ PASO 1: Validación de archivo
  debugStep1_FileValidation() {
    console.log('🚀 PASO 1: VALIDACIÓN DE ARCHIVO');
    console.log('=================================\n');

    const fileExists = fs.existsSync(this.pdfPath);
    const stats = fileExists ? fs.statSync(this.pdfPath) : null;
    
    const validation = {
      exists: fileExists,
      size: stats ? stats.size : 0,
      sizeKB: stats ? Math.round(stats.size / 1024) : 0,
      extension: path.extname(this.pdfPath).toLowerCase(),
      isValidSize: stats ? (stats.size > 1000 && stats.size < 50000000) : false
    };

    console.log('📁 Archivo:', this.pdfPath);
    console.log('✅ Existe:', validation.exists);
    console.log('📊 Tamaño:', validation.size, 'bytes (', validation.sizeKB, 'KB)');
    console.log('📄 Extensión:', validation.extension);
    console.log('🎯 Tamaño válido:', validation.isValidSize);

    this.debugResults.fileValidation = validation;
    console.log('\n' + '='.repeat(50) + '\n');

    return validation.exists && validation.isValidSize;
  }

  // ✅ PASO 2: Simulación de extracción de texto (como lo hace tu función actual)
  debugStep2_SimulateCurrentExtraction() {
    console.log('🔍 PASO 2: SIMULACIÓN DE EXTRACCIÓN ACTUAL');
    console.log('==========================================\n');

    try {
      const fileBuffer = fs.readFileSync(this.pdfPath);
      const uint8Array = new Uint8Array(fileBuffer);
      
      console.log(`📄 Archivo leído: ${uint8Array.length} bytes`);

      let extractedText = '';
      const chunkSize = 8192; // 8KB chunks como en tu función
      const maxChunks = 10;
      
      console.log(`🔧 Configuración: chunks de ${chunkSize} bytes, máximo ${maxChunks} chunks`);

      for (let chunkIndex = 0; chunkIndex < Math.min(maxChunks, Math.ceil(uint8Array.length / chunkSize)); chunkIndex++) {
        const start = chunkIndex * chunkSize;
        const end = Math.min(start + chunkSize, uint8Array.length);
        const chunk = uint8Array.slice(start, end);
        
        console.log(`📦 Chunk ${chunkIndex + 1}: bytes ${start}-${end}`);
        
        let chunkText = '';
        for (let i = 0; i < chunk.length - 1; i++) {
          const char = chunk[i];
          
          // Misma lógica que tu función (líneas 479-494)
          if (
            (char >= 48 && char <= 57) ||   // 0-9
            (char >= 65 && char <= 90) ||   // A-Z  
            (char >= 97 && char <= 122) ||  // a-z
            char === 32 ||                  // space
            char === 46 ||                  // .
            char === 44 ||                  // ,
            char === 36 ||                  // $
            char === 45 ||                  // -
            char === 58 ||                  // :
            char === 47 ||                  // /
            char === 10 ||                  // newline
            char === 13                     // carriage return
          ) {
            chunkText += String.fromCharCode(char);
          }
        }
        
        const cleanedChunk = chunkText.replace(/\s+/g, ' ').trim();
        console.log(`📝 Chunk ${chunkIndex + 1} texto limpio: ${cleanedChunk.length} caracteres`);
        console.log(`📄 Chunk ${chunkIndex + 1} preview: "${cleanedChunk.substring(0, 100)}..."`);
        
        if (cleanedChunk.length > 0) {
          extractedText += cleanedChunk + ' ';
        }
        
        if (extractedText.length > 2000) {
          console.log(`🛑 Alcanzado límite de 2000 caracteres en chunk ${chunkIndex + 1}`);
          break;
        }
      }
      
      this.rawText = extractedText.trim();
      
      console.log('\n🎯 RESULTADO FINAL DE EXTRACCIÓN:');
      console.log(`📏 Longitud total: ${this.rawText.length} caracteres`);
      console.log(`📄 Preview completo: "${this.rawText.substring(0, 200)}..."`);
      
      // Análisis de calidad
      const quality = this.analyzeTextQuality(this.rawText);
      this.debugResults.textExtraction = {
        totalLength: this.rawText.length,
        preview: this.rawText.substring(0, 200),
        quality: quality
      };

      console.log('\n' + '='.repeat(50) + '\n');
      return this.rawText.length > 10;

    } catch (error) {
      console.error('❌ Error en extracción:', error.message);
      this.debugResults.textExtraction = { error: error.message };
      return false;
    }
  }

  // ✅ PASO 3: Análisis de calidad del texto
  analyzeTextQuality(text) {
    console.log('🔬 PASO 3: ANÁLISIS DE CALIDAD DEL TEXTO');
    console.log('======================================\n');

    const analysis = {
      totalLength: text.length,
      hasNumbers: /\d+/.test(text),
      hasCurrency: /[$€£¥]|\b(USD|EUR|GBP)\b/i.test(text),
      hasInvoicePatterns: /\b(invoice|factura|bill|total|amount|vendor|company)/i.test(text),
      hasDatePatterns: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/.test(text),
      wordCount: text.split(/\s+/).length,
      containsReadableText: /\b[a-zA-Z]{3,}\b/.test(text),
      averageWordLength: text.split(/\s+/).reduce((acc, word) => acc + word.length, 0) / text.split(/\s+/).length,
      specialCharacterRatio: (text.match(/[^a-zA-Z0-9\s]/g) || []).length / text.length
    };

    console.log('📊 ANÁLISIS DETALLADO:');
    console.log(`📏 Longitud total: ${analysis.totalLength}`);
    console.log(`🔢 Tiene números: ${analysis.hasNumbers}`);
    console.log(`💰 Tiene patrones de moneda: ${analysis.hasCurrency}`);
    console.log(`🧾 Tiene patrones de factura: ${analysis.hasInvoicePatterns}`);
    console.log(`📅 Tiene patrones de fecha: ${analysis.hasDatePatterns}`);
    console.log(`📝 Número de palabras: ${analysis.wordCount}`);
    console.log(`✏️ Contiene texto legible: ${analysis.containsReadableText}`);
    console.log(`📐 Longitud promedio de palabra: ${analysis.averageWordLength.toFixed(2)}`);
    console.log(`🎯 Ratio caracteres especiales: ${(analysis.specialCharacterRatio * 100).toFixed(2)}%`);

    // Determinación de calidad
    let qualityScore = 0;
    if (analysis.hasNumbers) qualityScore += 20;
    if (analysis.hasCurrency) qualityScore += 20;
    if (analysis.hasInvoicePatterns) qualityScore += 20;
    if (analysis.hasDatePatterns) qualityScore += 20;
    if (analysis.containsReadableText) qualityScore += 20;

    analysis.qualityScore = qualityScore;
    analysis.isGoodQuality = qualityScore >= 60;

    console.log(`\n🏆 PUNTUACIÓN DE CALIDAD: ${qualityScore}/100`);
    console.log(`✅ Es buena calidad: ${analysis.isGoodQuality}`);

    this.debugResults.textQuality = analysis;
    console.log('\n' + '='.repeat(50) + '\n');

    return analysis;
  }

  // ✅ PASO 4: Simulación de prompt OpenAI
  debugStep4_SimulateOpenAIPrompt() {
    console.log('🤖 PASO 4: SIMULACIÓN DE PROMPT OPENAI');
    console.log('====================================\n');

    const prompt = `Extract maintenance invoice data from this text. Look for vendor names, amounts, dates, invoice numbers, and work descriptions. Be thorough and accurate.

REQUIRED JSON FORMAT:
{
  "vendor": "company name or null",
  "total": number or 0,
  "date": "YYYY-MM-DD or null",
  "invoice_number": "number/string or null",
  "work_description": "description or null",
  "aircraft_registration": "N-number or null",
  "confidence": 0.0-1.0
}

INVOICE TEXT:
${this.rawText.substring(0, 1500)}`;

    console.log('📤 PROMPT QUE SE ENVIARÍA A OPENAI:');
    console.log('─'.repeat(50));
    console.log(prompt);
    console.log('─'.repeat(50));

    // Simulación de lo que OpenAI vería
    console.log('\n🔍 LO QUE OPENAI RECIBIRÍA:');
    console.log(`📏 Longitud del texto: ${this.rawText.substring(0, 1500).length} caracteres`);
    console.log(`📄 Muestra del texto: "${this.rawText.substring(0, 300)}..."`);

    // Análisis de por qué OpenAI podría fallar
    const textSample = this.rawText.substring(0, 1500);
    const reasons = [];
    
    if (textSample.length < 50) {
      reasons.push('❌ Texto demasiado corto para análisis');
    }
    
    if (!/\d+/.test(textSample)) {
      reasons.push('❌ No se encontraron números en el texto');
    }
    
    if (!/[a-zA-Z]{3,}/.test(textSample)) {
      reasons.push('❌ No se encontraron palabras legibles');
    }
    
    if (textSample.replace(/[^a-zA-Z0-9]/g, '').length < textSample.length * 0.3) {
      reasons.push('❌ Demasiados caracteres no alfanuméricos');
    }

    console.log('\n🚨 POSIBLES RAZONES DE FALLO DE OPENAI:');
    if (reasons.length === 0) {
      console.log('✅ El texto parece aceptable para OpenAI');
    } else {
      reasons.forEach(reason => console.log(reason));
    }

    this.debugResults.openaiSimulation = {
      promptLength: prompt.length,
      textSample: textSample,
      potentialIssues: reasons
    };

    console.log('\n' + '='.repeat(50) + '\n');
  }

  // ✅ PASO 5: Reporte final
  generateFinalReport() {
    console.log('📋 PASO 5: REPORTE FINAL DE DIAGNÓSTICO');
    console.log('======================================\n');

    console.log('🎯 RESUMEN DE RESULTADOS:');
    console.log(`📁 Archivo válido: ${this.debugResults.fileValidation?.isValidSize || false}`);
    console.log(`📄 Texto extraído: ${this.debugResults.textExtraction?.totalLength || 0} caracteres`);
    console.log(`🏆 Calidad del texto: ${this.debugResults.textQuality?.qualityScore || 0}/100`);
    console.log(`🤖 Issues potenciales con OpenAI: ${this.debugResults.openaiSimulation?.potentialIssues?.length || 0}`);

    console.log('\n💡 DIAGNÓSTICO DEFINITIVO:');
    
    if (!this.debugResults.fileValidation?.isValidSize) {
      console.log('❌ PROBLEMA: Archivo PDF no válido o corrupto');
    } else if ((this.debugResults.textExtraction?.totalLength || 0) < 50) {
      console.log('❌ PROBLEMA CRÍTICO: Extracción de texto fallida - no se obtiene texto del PDF');
      console.log('🔧 SOLUCIÓN: El parser manual de bytes NO funciona con PDFs reales');
      console.log('💡 RECOMENDACIÓN: Usar librería de parsing PDF real (pdf-parse, pdf2pic, etc.)');
    } else if ((this.debugResults.textQuality?.qualityScore || 0) < 60) {
      console.log('❌ PROBLEMA: Texto extraído de baja calidad');
      console.log('🔧 SOLUCIÓN: Mejorar algoritmo de extracción de texto');
    } else if (this.debugResults.openaiSimulation?.potentialIssues?.length > 0) {
      console.log('❌ PROBLEMA: Texto no apto para procesamiento con OpenAI');
      console.log('🔧 SOLUCIÓN: Mejorar prompt o pre-procesar texto');
    } else {
      console.log('✅ PIPELINE PARECE CORRECTO - Investigar configuración OpenAI');
    }

    console.log('\n🚀 RECOMENDACIONES TÉCNICAS:');
    console.log('1. 🔧 Reemplazar extractTextFromPDFChunked() con librería PDF real');
    console.log('2. 🧪 Testear con múltiples PDFs de ejemplo');
    console.log('3. 🤖 Validar configuración y API key de OpenAI');
    console.log('4. 📊 Implementar logging detallado en producción');

    console.log('\n' + '='.repeat(50));
  }

  // ✅ Ejecutar debug completo
  async runFullDebug() {
    console.log('🚀 INICIANDO DEBUG COMPLETO DEL PIPELINE PDF\n');
    console.log('Archivo a analizar:', this.pdfPath);
    console.log('Timestamp:', new Date().toISOString());
    console.log('\n' + '='.repeat(80) + '\n');

    try {
      const step1 = this.debugStep1_FileValidation();
      if (!step1) {
        console.log('❌ Archivo no válido, terminando debug.');
        return;
      }

      const step2 = this.debugStep2_SimulateCurrentExtraction();
      if (!step2) {
        console.log('❌ Extracción de texto falló, terminando debug.');
        return;
      }

      this.analyzeTextQuality(this.rawText);
      this.debugStep4_SimulateOpenAIPrompt();
      this.generateFinalReport();

    } catch (error) {
      console.error('💥 Error durante debug:', error);
    }
  }
}

// 🎯 EJECUCIÓN
async function main() {
  const pdfPath = process.argv[2];
  
  if (!pdfPath) {
    console.log('❌ Uso: node debug-pdf-pipeline.js <ruta-al-pdf>');
    console.log('📝 Ejemplo: node debug-pdf-pipeline.js mega_factura.pdf');
    process.exit(1);
  }

  const pdfDebugger = new PDFPipelineDebugger(pdfPath);
  await pdfDebugger.runFullDebug();
}

main().catch(console.error);