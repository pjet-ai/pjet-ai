/**
 * 🚀 TEST FINAL: UNIFIED PDF EXTRACTOR CON GEMINI 2.5 PRO
 * 
 * Testing con OpenRouter + Gemini 2.5 Pro (1M context window)
 */

const fs = require('fs')
const path = require('path')

async function testGeminiPower() {
  console.log('🚀 TESTING UNIFIED PDF EXTRACTOR - GEMINI 2.5 PRO POWER')
  console.log('=' .repeat(70))
  
  const pdfPath = path.join(__dirname, '_archive', 'pdf-samples', 'mega_factura.pdf')
  
  if (!fs.existsSync(pdfPath)) {
    console.log('❌ mega_factura.pdf not found')
    return
  }
  
  console.log(`✅ Target: mega_factura.pdf`)
  
  try {
    const pdfBuffer = fs.readFileSync(pdfPath)
    console.log(`📊 PDF size: ${(pdfBuffer.length / 1024).toFixed(2)} KB`)
    
    const formData = new FormData()
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    formData.append('file', blob, 'mega_factura.pdf')
    formData.append('options', JSON.stringify({
      maxPages: 54, // TODAS las páginas - Gemini puede manejarlas
      debug: true,
      llmProvider: 'openrouter-gemini' // USAR GEMINI 2.5 PRO
    }))
    
    console.log('\\n🧠 Testing with Gemini 2.5 Pro (1M context) - ALL 54 PAGES...')
    console.log('🔗 URL: unified-pdf-extractor')
    
    const startTime = Date.now()
    
    const response = await fetch('https://vvazmdauzaexknybbnfc.supabase.co/functions/v1/unified-pdf-extractor', {
      method: 'POST',
      body: formData
    })
    
    const result = await response.json()
    const totalTime = Date.now() - startTime
    
    console.log(`\\n📊 RESPONSE: ${response.status} (${(totalTime/1000).toFixed(2)}s)`)
    
    if (result.success && result.data) {
      console.log('🎉 SUCCESS: GEMINI 2.5 PRO WORKING PERFECTLY!')
      
      const data = result.data
      console.log(`\\n📋 EXTRACTED DATA:`)
      console.log(`   🏢 Vendor: ${data.vendor_name}`)
      console.log(`   📅 Date: ${data.invoice_date}`)
      console.log(`   💰 Total: ${data.currency} ${data.total_amount.toLocaleString()}`)
      console.log(`   📂 Category: ${data.category}`)
      
      console.log('\\n💵 FINANCIAL BREAKDOWN:')
      console.log(`   ⚙️ Labor: $${data.breakdown.labor.toLocaleString()}`)
      console.log(`   🔧 Parts: $${data.breakdown.parts.toLocaleString()}`)
      console.log(`   🛠️ Services: $${data.breakdown.services.toLocaleString()}`)
      console.log(`   📦 Freight: $${data.breakdown.freight.toLocaleString()}`)
      
      console.log(`\\n🔧 PARTS IDENTIFIED: ${data.parts.length} items`)
      data.parts.slice(0, 5).forEach((part, i) => {
        console.log(`   ${i + 1}. ${part.partNumber}: ${part.description.substring(0, 40)}... (${part.quantity}x $${part.unitPrice})`)
      })
      if (data.parts.length > 5) {
        console.log(`   ... and ${data.parts.length - 5} more parts`)
      }
      
      console.log('\\n✈️ TECHNICAL INFO:')
      console.log(`   🛩️ Aircraft: ${data.technical_info.aircraft_model || 'N/A'}`)
      console.log(`   📝 Registration: ${data.technical_info.aircraft_registration || 'N/A'}`)
      console.log(`   🎟️ Work Order: ${data.technical_info.work_order || 'N/A'}`)
      console.log(`   👨‍🔧 Mechanic: ${data.technical_info.mechanic || 'N/A'}`)
      
      console.log(`\\n📊 METADATA:`)
      console.log(`   🧠 LLM: ${result.metadata.llm_provider}`)
      console.log(`   📄 Pages: ${result.metadata.pages_processed}`)
      console.log(`   📝 Characters: ${result.metadata.text_length.toLocaleString()}`)
      console.log(`   ⏱️ Processing: ${result.metadata.processing_time}ms`)
      
      // Quality analysis
      const hasVendor = data.vendor_name && data.vendor_name !== 'Unknown'
      const hasValidTotal = data.total_amount > 0
      const hasBreakdown = Object.values(data.breakdown).some(v => v > 0)
      const hasParts = data.parts.length > 0
      const hasDate = data.invoice_date && data.invoice_date !== '0000-00-00'
      
      console.log('\\n🔬 QUALITY ANALYSIS:')
      console.log(`   ✅ Vendor: ${hasVendor}`)
      console.log(`   ✅ Total: ${hasValidTotal}`) 
      console.log(`   ✅ Breakdown: ${hasBreakdown}`)
      console.log(`   ✅ Parts: ${hasParts}`)
      console.log(`   ✅ Date: ${hasDate}`)
      
      const qualityScore = [hasVendor, hasValidTotal, hasBreakdown, hasParts, hasDate].filter(Boolean).length
      console.log(`   📊 Quality Score: ${qualityScore}/5`)
      
      console.log('\\n🎯 VERDICT:')
      if (qualityScore >= 4) {
        console.log('   🏆 EXCELLENT: Ready for production!')
        console.log('   🚀 Gemini 2.5 Pro + UNPDF = Perfect combination')
        console.log('   ✅ This completely replaces the broken pipeline')
        console.log('\\n🔥 HAMSTER WHEEL = DESTROYED 🔥')
      } else if (qualityScore >= 3) {
        console.log('   ✅ GOOD: Minor tuning needed but functional')
      } else {
        console.log('   ⚠️ NEEDS WORK: Check prompts and data structure')
      }
      
    } else {
      console.log(`❌ FAILED: ${result.error}`)
      
      if (result.debug) {
        console.log('\\n🐛 DEBUG (last 3 steps):')
        result.debug.slice(-3).forEach((log, i) => {
          console.log(`   ${i + 1}. ${log.step}: ${JSON.stringify(log)}`)
        })
      }
    }
    
  } catch (error) {
    console.error(`💥 ERROR: ${error.message}`)
  }
}

testGeminiPower().catch(console.error)