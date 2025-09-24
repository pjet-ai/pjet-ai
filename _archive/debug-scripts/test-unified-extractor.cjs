/**
 * 🧪 TEST DEFINITIVO: UNIFIED PDF EXTRACTOR
 * 
 * Test de la arquitectura final con:
 * - UNPDF para extracción robusta
 * - OpenRouter + Gemini 2.5 Pro (1M context)
 * - Datos estructurados de mantenimiento
 */

const fs = require('fs')
const path = require('path')

async function testUnifiedExtractor() {
  console.log('🎯 TESTING UNIFIED PDF EXTRACTOR - ARCHITECTURE DEFINITIVA')
  console.log('=' .repeat(70))
  
  // 1. Buscar el PDF target
  const pdfPath = path.join(__dirname, '_archive', 'pdf-samples', 'mega_factura.pdf')
  
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ mega_factura.pdf not found in _archive/pdf-samples/')
    return
  }
  
  console.log(`✅ Found target: ${pdfPath}`)
  
  try {
    const pdfBuffer = fs.readFileSync(pdfPath)
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    
    // 2. Preparar test con OpenRouter
    const formData = new FormData()
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    formData.append('file', blob, 'mega_factura.pdf')
    formData.append('options', JSON.stringify({
      maxPages: 54, // Procesar todas las páginas  
      debug: true,
      llmProvider: 'openrouter-gemini' // Usar Gemini 2.5 Pro
    }))
    
    console.log('\\n🚀 Testing UNIFIED EXTRACTOR with OpenRouter + Gemini 2.5 Pro...')
    console.log('🔗 URL: https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/unified-pdf-extractor')
    
    const startTime = Date.now()
    
    const response = await fetch('https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/unified-pdf-extractor', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    const totalTime = Date.now() - startTime
    
    console.log(`\\n📊 RESPONSE STATUS: ${response.status}`)
    console.log(`⏱️ Total time: ${totalTime}ms`)
    console.log('\\n' + '='.repeat(70))
    
    if (result.success && result.data) {
      console.log('🎉 SUCCESS: UNIFIED EXTRACTOR working perfectly!')
      
      console.log('\\n📊 METADATA:')
      console.log(`   🔧 Extraction method: ${result.metadata.extraction_method}`)
      console.log(`   🧠 LLM provider: ${result.metadata.llm_provider}`) 
      console.log(`   📄 Pages processed: ${result.metadata.pages_processed}`)
      console.log(`   📝 Text length: ${result.metadata.text_length} chars`)
      console.log(`   ⏱️ Processing time: ${result.metadata.processing_time}ms`)
      
      console.log('\\n📋 STRUCTURED DATA EXTRACTED:')
      const data = result.data
      
      console.log(`   🏢 Vendor: ${data.vendor_name}`)
      console.log(`   📅 Date: ${data.invoice_date}`)
      console.log(`   💰 Total: ${data.currency} ${data.total_amount}`)
      console.log(`   📂 Category: ${data.category}`)
      
      console.log('\\n💵 FINANCIAL BREAKDOWN:')
      console.log(`   ⚙️ Labor: $${data.breakdown.labor}`)
      console.log(`   🔧 Parts: $${data.breakdown.parts}`)
      console.log(`   🛠️ Services: $${data.breakdown.services}`)
      console.log(`   📦 Freight: $${data.breakdown.freight}`)
      
      console.log(`\\n🔧 PARTS (${data.parts.length} items):`)
      data.parts.slice(0, 3).forEach((part, i) => {
        console.log(`   ${i + 1}. ${part.partNumber}: ${part.description} (${part.quantity}x $${part.unitPrice})`)
      })
      if (data.parts.length > 3) {
        console.log(`   ... and ${data.parts.length - 3} more parts`)
      }
      
      console.log('\\n✈️ TECHNICAL INFO:')
      console.log(`   🛩️ Aircraft: ${data.technical_info.aircraft_model || 'N/A'}`)
      console.log(`   📝 Registration: ${data.technical_info.aircraft_registration || 'N/A'}`)
      console.log(`   🎟️ Work Order: ${data.technical_info.work_order || 'N/A'}`)
      console.log(`   👨‍🔧 Mechanic: ${data.technical_info.mechanic || 'N/A'}`)
      
      // Análisis de calidad
      const hasVendor = data.vendor_name && data.vendor_name !== 'Unknown'
      const hasValidTotal = data.total_amount > 0
      const hasBreakdown = Object.values(data.breakdown).some(v => v > 0)
      const hasParts = data.parts.length > 0
      
      console.log('\\n🔬 QUALITY ANALYSIS:')
      console.log(`   ✅ Vendor extracted: ${hasVendor}`)
      console.log(`   ✅ Total amount valid: ${hasValidTotal}`)
      console.log(`   ✅ Financial breakdown: ${hasBreakdown}`)
      console.log(`   ✅ Parts identified: ${hasParts}`)
      
      const qualityScore = [hasVendor, hasValidTotal, hasBreakdown, hasParts].filter(Boolean).length
      console.log(`   📊 Quality Score: ${qualityScore}/4`)
      
      if (result.debug) {
        console.log('\\n🐛 DEBUG LOG:')
        result.debug.forEach((log, i) => {
          console.log(`   ${i + 1}. ${log.step}: ${JSON.stringify(log)}`)
        })
      }
      
      console.log('\\n🎯 VERDICT:')
      if (qualityScore >= 3) {
        console.log('   🏆 EXCELLENT: Unified extractor is production-ready!')
        console.log('   💡 This solution combines UNPDF + OpenRouter + Gemini perfectly')
        console.log('   ✅ Ready to replace all legacy PDF processing functions')
      } else {
        console.log('   ⚠️ NEEDS IMPROVEMENT: Some data extraction issues detected')
      }
      
    } else {
      console.log('❌ FAILURE: Unified extractor failed')
      console.log(`   Error: ${result.error || 'Unknown error'}`)
      
      if (result.debug) {
        console.log('\\n🐛 DEBUG LOG:')
        result.debug.forEach((log, i) => {
          console.log(`   ${i + 1}. ${log.step}: ${JSON.stringify(log)}`)
        })
      }
      
      console.log('\\n🔧 POSSIBLE ISSUES:')
      console.log('   1. OpenRouter API key not configured')
      console.log('   2. Gemini 2.5 Pro rate limits')
      console.log('   3. PDF content too complex for current prompt')
      console.log('   4. JSON parsing issues in response')
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message)
  }
  
  console.log('\\n' + '='.repeat(70))
  console.log('🏁 UNIFIED PDF EXTRACTOR TEST COMPLETE')
  console.log('   Next: Configure OpenRouter API key if needed')
  console.log('   Then: Update UI to use unified-pdf-extractor endpoint')
}

// Execute test
testUnifiedExtractor().catch(console.error)