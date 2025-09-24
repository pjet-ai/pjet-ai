/**
 * 🧪 TEST UNIFIED EXTRACTOR - FALLBACK CON OPENAI
 * 
 * Test usando OpenAI como fallback mientras configuras OpenRouter
 */

const fs = require('fs')
const path = require('path')

async function testUnifiedFallback() {
  console.log('🎯 TESTING UNIFIED PDF EXTRACTOR - OpenAI Fallback Mode')
  console.log('=' .repeat(70))
  
  const pdfPath = path.join(__dirname, '_archive', 'pdf-samples', 'mega_factura.pdf')
  
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ mega_factura.pdf not found')
    return
  }
  
  console.log(`✅ Found target: ${pdfPath}`)
  
  try {
    const pdfBuffer = fs.readFileSync(pdfPath)
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    
    const formData = new FormData()
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    formData.append('file', blob, 'mega_factura.pdf')
    formData.append('options', JSON.stringify({
      maxPages: 10, // Limit for OpenAI
      debug: true,
      llmProvider: 'openai' // Use OpenAI fallback
    }))
    
    console.log('\\n🔄 Testing with OpenAI fallback (since OpenRouter not configured)...')
    
    const startTime = Date.now()
    
    const response = await fetch('https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/unified-pdf-extractor', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    const totalTime = Date.now() - startTime
    
    console.log(`\\n📊 RESPONSE: ${response.status} (${totalTime}ms)`)
    
    if (result.success && result.data) {
      console.log('🎉 SUCCESS: Fallback working!')
      
      const data = result.data
      console.log(`\\n📋 EXTRACTED DATA:`)
      console.log(`   🏢 Vendor: ${data.vendor_name}`)
      console.log(`   💰 Total: ${data.currency} ${data.total_amount}`)
      console.log(`   📂 Category: ${data.category}`)
      console.log(`   🔧 Parts: ${data.parts.length} items`)
      
      const isValid = data.vendor_name && data.vendor_name !== 'Unknown' && data.total_amount > 0
      
      console.log(`\\n🎯 VERDICT: ${isValid ? '✅ WORKING' : '⚠️ NEEDS TUNING'}`)
      
      if (isValid) {
        console.log('\\n🚀 NEXT STEPS:')
        console.log('   1. Configure OpenRouter API key for Gemini 2.5 Pro')  
        console.log('   2. Update UI to use unified-pdf-extractor')
        console.log('   3. This replaces ALL previous PDF functions')
      }
      
    } else {
      console.log(`❌ FAILED: ${result.error}`)
      
      if (result.debug) {
        console.log('\\n🐛 DEBUG:')
        result.debug.slice(-3).forEach((log, i) => {
          console.log(`   ${i + 1}. ${log.step}: ${JSON.stringify(log)}`)
        })
      }
    }
    
  } catch (error) {
    console.error(`💥 ERROR: ${error.message}`)
  }
}

testUnifiedFallback().catch(console.error)