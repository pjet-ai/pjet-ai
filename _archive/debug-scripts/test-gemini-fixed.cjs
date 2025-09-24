/**
 * 🚀 TEST GEMINI FIXED VERSION
 */

const fs = require('fs')
const path = require('path')

async function testGeminiFixed() {
  console.log('🚀 TESTING GEMINI FIXED VERSION')
  
  const pdfPath = path.join(__dirname, '_archive', 'pdf-samples', 'mega_factura.pdf')
  const pdfBuffer = fs.readFileSync(pdfPath)
  
  const formData = new FormData()
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
  formData.append('file', blob, 'mega_factura.pdf')
  formData.append('options', JSON.stringify({
    maxPages: 10,
    debug: true,
    llmProvider: 'openrouter-gemini'
  }))
  
  try {
    console.log('🧠 Testing with fixed version + Gemini 2.5 Pro...')
    
    const response = await fetch('https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/unified-pdf-extractor-fixed', {
      method: 'POST',
      body: formData
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.status === 200) {
      const result = await response.json()
      
      if (result.success) {
        console.log('✅ SUCCESS with Gemini!')
        console.log(`🏢 Vendor: ${result.data.vendor_name}`)
        console.log(`💰 Total: ${result.data.currency} ${result.data.total_amount}`)
        console.log(`📂 Category: ${result.data.category}`)
        console.log(`🧠 LLM: ${result.metadata.llm_provider}`)
        console.log(`📄 Text length: ${result.metadata.text_length}`)
        console.log(`⏱️ Time: ${result.metadata.processing_time}ms`)
        
        if (result.debug) {
          console.log('\\n🐛 DEBUG:')
          result.debug.forEach((log, i) => {
            console.log(`   ${i + 1}. ${log.step}`)
          })
        }
        
        const qualityOk = result.data.vendor_name !== 'Unknown' && result.data.total_amount > 0
        console.log(`\\n🎯 QUALITY: ${qualityOk ? '✅ GOOD' : '⚠️ NEEDS WORK'}`)
        
        if (qualityOk) {
          console.log('\\n🎉 GEMINI 2.5 PRO WORKING!')
          console.log('   Ready to replace all legacy functions')
        }
        
      } else {
        console.log(`❌ Error: ${result.error}`)
        
        if (result.debug) {
          console.log('\\n🐛 DEBUG:')
          result.debug.slice(-3).forEach((log, i) => {
            console.log(`   ${i + 1}. ${log.step}: ${log.error || 'ok'}`)
          })
        }
      }
    } else {
      const text = await response.text()
      console.log(`❌ HTTP Error: ${text}`)
    }
    
  } catch (error) {
    console.log(`❌ Test Error: ${error.message}`)
  }
}

testGeminiFixed().catch(console.error)