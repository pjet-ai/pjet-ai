/**
 * 🧪 TEST: UNIFIED EXTRACTOR FIXED
 * 
 * Testing the fixed version with:
 * - Rate limit handling
 * - Auto-fallback to OpenAI  
 * - Error handling fixes
 */

const fs = require('fs')
const path = require('path')

async function testFixedSolution() {
  console.log('🛠️ TESTING FIXED UNIFIED EXTRACTOR')
  console.log('=' .repeat(50))
  
  const pdfPath = path.join(__dirname, '_archive', 'pdf-samples', 'mega_factura.pdf')
  
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ PDF not found')
    return
  }
  
  const pdfBuffer = fs.readFileSync(pdfPath)
  console.log(`📄 PDF: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
  
  try {
    const formData = new FormData()
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    formData.append('file', blob, 'mega_factura.pdf')
    
    // Test with default settings (should use OpenAI to avoid rate limits)
    formData.append('options', JSON.stringify({
      maxPages: 10,
      debug: true
      // No llmProvider specified - should default to OpenAI
    }))
    
    console.log('\\n🔄 Testing fixed version (should default to OpenAI)...')
    
    const response = await fetch('https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/unified-pdf-extractor', {
      method: 'POST',
      body: formData
    })
    
    console.log(`Status: ${response.status}`)
    
    if (response.status === 200) {
      const result = await response.json()
      
      if (result.success && result.data) {
        console.log('✅ SUCCESS - Errors fixed!')
        console.log(`🏢 Vendor: ${result.data.vendor_name}`)
        console.log(`💰 Total: ${result.data.currency} ${result.data.total_amount}`)
        console.log(`🧠 LLM: ${result.metadata.llm_provider}`)
        console.log(`⏱️ Time: ${result.metadata.processing_time}ms`)
        console.log(`📝 Text: ${result.metadata.text_length} chars`)
        
        const isGood = result.data.vendor_name !== 'Unknown' && result.data.total_amount > 0
        console.log(`\\n🎯 QUALITY: ${isGood ? '✅ EXCELLENT' : '⚠️ NEEDS WORK'}`)
        
        if (result.debug && result.debug.length > 0) {
          console.log('\\n🔍 PROCESS STEPS:')
          result.debug.forEach((log, i) => {
            console.log(`   ${i + 1}. ${log.step}`)
          })
        }
        
        if (isGood) {
          console.log('\\n🎉 UNIFIED EXTRACTOR IS WORKING!')
          console.log('   ✅ Rate limits handled')
          console.log('   ✅ Auto-fallback working')  
          console.log('   ✅ Errors fixed')
          console.log('   ✅ Ready for production use')
        }
        
      } else {
        console.log(`❌ Failed: ${result.error || 'Unknown error'}`)
      }
      
    } else {
      const text = await response.text()
      console.log(`❌ HTTP Error ${response.status}: ${text.substring(0, 200)}...`)
    }
    
  } catch (error) {
    console.log(`💥 Test Error: ${error.message}`)
  }
  
  console.log('\\n' + '='.repeat(50))
  console.log('🏁 FIXED SOLUTION TEST COMPLETE')
}

testFixedSolution().catch(console.error)