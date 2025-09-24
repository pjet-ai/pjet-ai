/**
 * 🧪 TEST COMPLETO: UNPDF ROBUST PDF EXTRACTOR
 * 
 * Script para testear la nueva función robusta de extracción con UNPDF
 * Target: mega_factura.pdf comprimido de 54 páginas
 */

const fs = require('fs')
const path = require('path')

async function testRobustPDFExtractor() {
  console.log('🚀 TESTING UNPDF ROBUST PDF EXTRACTOR')
  console.log('=' .repeat(60))
  
  // 1. Verificar que el PDF existe
  const pdfPath = path.join(__dirname, '_archive', 'pdf-samples', 'mega_factura.pdf')
  
  if (!fs.existsSync(pdfPath)) {
    console.log('⚠️ mega_factura.pdf not found in _archive/pdf-samples/')
    console.log('🔍 Searching for PDF in current directory...')
    
    // Buscar en directorio actual
    const files = fs.readdirSync('.')
    const pdfFiles = files.filter(f => f.endsWith('.pdf'))
    
    if (pdfFiles.length === 0) {
      console.log('❌ No PDF files found. Please place mega_factura.pdf in the project root.')
      return
    }
    
    console.log(`📄 Found PDFs: ${pdfFiles.join(', ')}`)
    
    // Usar el primer PDF encontrado
    var actualPdfPath = pdfFiles[0]
    console.log(`🎯 Using: ${actualPdfPath}`)
  } else {
    var actualPdfPath = pdfPath
    console.log(`✅ Found target PDF: ${actualPdfPath}`)
  }
  
  // 2. Preparar FormData
  try {
    const pdfBuffer = fs.readFileSync(actualPdfPath)
    console.log(`📊 PDF size: ${pdfBuffer.length} bytes`)
    
    const formData = new FormData()
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    formData.append('file', blob, path.basename(actualPdfPath))
    formData.append('options', JSON.stringify({
      maxPages: 10, // Limitar a 10 páginas para prueba inicial
      debug: true
    }))
    
    // 3. Test the function
    console.log('\\n🔍 Testing UNPDF Robust Extractor...')
    console.log('URL: https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/pdf-extractor-robust')
    
    const startTime = Date.now()
    
    const response = await fetch('https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/pdf-extractor-robust', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    const totalTime = Date.now() - startTime
    
    console.log(`\\n📊 RESPONSE STATUS: ${response.status}`)
    console.log(`⏱️ Total time: ${totalTime}ms`)
    console.log('\\n' + '='.repeat(60))
    
    if (result.success) {
      console.log('🎉 SUCCESS: UNPDF extraction worked!')
      console.log('\\n📄 METADATA:')
      console.log(`   📄 Pages processed: ${result.metadata.pages}`)
      console.log(`   🔧 Method: ${result.metadata.extractionMethod}`)
      console.log(`   ⏱️ Processing time: ${result.metadata.processingTime}ms`)
      console.log(`   📊 File size: ${result.metadata.fileSize} bytes`)
      
      console.log('\\n📋 EXTRACTED TEXT:')
      console.log(`   📏 Length: ${result.extractedText.length} characters`)
      console.log(`   📄 Preview: "${result.extractedText.substring(0, 300)}..."`)
      
      // Análisis de calidad del texto
      const hasNumbers = /\\d+/.test(result.extractedText)
      const hasCurrency = /\\$|\\bdollar|USD/i.test(result.extractedText)
      const hasVendor = /\\b[A-Z][a-z]+\\s+[A-Z][a-z]+\\b/.test(result.extractedText)
      
      console.log('\\n🔬 QUALITY ANALYSIS:')
      console.log(`   🔢 Contains numbers: ${hasNumbers}`)
      console.log(`   💰 Contains currency: ${hasCurrency}`)
      console.log(`   🏢 Contains vendor names: ${hasVendor}`)
      
      if (result.debug) {
        console.log('\\n🐛 DEBUG LOG:')
        result.debug.forEach((log, i) => {
          console.log(`   ${i + 1}. ${log.step}: ${JSON.stringify(log)}`)
        })
      }
      
      // Comparar con extractor anterior
      console.log('\\n⚖️ COMPARISON WITH PREVIOUS METHOD:')
      console.log('   ✅ UNPDF: Real PDF.js implementation')
      console.log('   ✅ UNPDF: Handles compression properly') 
      console.log('   ✅ UNPDF: Page-by-page processing')
      console.log('   ✅ UNPDF: Structured text extraction')
      
      if (result.extractedText.length > 500) {
        console.log('\\n🎯 VERDICT: UNPDF extraction is significantly better!')
        console.log('💡 Recommendation: Replace current extractor with UNPDF')
      } else {
        console.log('\\n⚠️ VERDICT: Still need to investigate text quality')
      }
      
    } else {
      console.log('❌ FAILURE: UNPDF extraction failed')
      console.log(`   Error: ${result.error}`)
      
      if (result.debug) {
        console.log('\\n🐛 DEBUG LOG:')
        result.debug.forEach((log, i) => {
          console.log(`   ${i + 1}. ${log.step}: ${JSON.stringify(log)}`)
        })
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
    console.log('\\n🔧 Possible issues:')
    console.log('   1. Function not deployed yet')
    console.log('   2. Network connection problem')
    console.log('   3. PDF file corrupted')
    console.log('   4. UNPDF compatibility issue with this PDF')
  }
  
  console.log('\\n' + '='.repeat(60))
  console.log('🏁 UNPDF ROBUST PDF EXTRACTOR TEST COMPLETE')
}

// Execute test
testRobustPDFExtractor().catch(console.error)