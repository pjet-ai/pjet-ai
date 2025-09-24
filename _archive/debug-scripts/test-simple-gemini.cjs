/**
 * 🧪 SIMPLE TEST: GEMINI 2.5 PRO
 */

const fs = require('fs')
const path = require('path')

async function simpleTest() {
  console.log('🧪 SIMPLE GEMINI TEST')
  
  const pdfPath = path.join(__dirname, '_archive', 'pdf-samples', 'mega_factura.pdf')
  const pdfBuffer = fs.readFileSync(pdfPath)
  
  const formData = new FormData()
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
  formData.append('file', blob, 'mega_factura.pdf')
  formData.append('options', JSON.stringify({
    maxPages: 5, // Solo 5 páginas para diagnóstico
    debug: false,
    llmProvider: 'openrouter-gemini'
  }))
  
  try {
    const response = await fetch('https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/unified-pdf-extractor', {
      method: 'POST',
      body: formData
    })
    
    console.log(`Status: ${response.status}`)
    
    const text = await response.text()
    console.log(`Response: ${text.substring(0, 500)}...`)
    
    if (response.status === 200) {
      try {
        const result = JSON.parse(text)
        if (result.success) {
          console.log('✅ SUCCESS with Gemini!')
          console.log(`Vendor: ${result.data.vendor_name}`)
          console.log(`Total: ${result.data.total_amount}`)
        } else {
          console.log(`❌ Error: ${result.error}`)
        }
      } catch (parseError) {
        console.log(`❌ JSON Parse Error: ${parseError.message}`)
      }
    }
    
  } catch (error) {
    console.log(`❌ Fetch Error: ${error.message}`)
  }
}

simpleTest().catch(console.error)