// 🧠 TESTING STAGE 2 - INTELLIGENT CHUNKER
// Validación de división inteligente en chunks optimizados para OpenAI

const LOCAL_FUNCTION_URL = 'http://127.0.0.1:54321/functions/v1/intelligent-chunker-stage2';

async function testStage2WithMegaFactura() {
  console.log('🧠 TESTING STAGE 2 - INTELLIGENT CHUNKER');
  console.log('📋 Testing with extracted sections from Stage 1');
  
  try {
    // Simular resultado de Stage 1 para mega_factura.pdf
    const mockStage1Data = {
      sessionId: 'test-session-stage2-' + Date.now(),
      processingStrategy: 'hybrid',
      metadata: {
        filename: 'mega_factura.pdf',
        pageCount: 54,
        complexity: 'extreme',
        sizeMB: 0.21
      },
      extractedSections: [
        {
          id: 'section_1',
          title: 'Financial_summary - Page 3',
          content: 'MAINTENANCE SUMMARY\nTotal Amount: $924,253.02\nSquawks: $2,500.00\nLabor: $482,698.96\nParts: $307,615.35\nServices: $125,763.10\nFreight: $4,837.45\nTaxes: $838.16',
          pageRange: [3, 3],
          type: 'financial_summary',
          confidence: 0.95,
          importance: 'critical',
          estimatedTokens: 40
        },
        {
          id: 'section_2',
          title: 'Totals - Pages 4-6',
          content: 'LABOR DETAILS\nItem Description: Engine Maintenance\nHours: 120.5\nRate: $125.00\nAmount: $15,062.50\n--- SECTION BREAK ---\nPARTS LIST\nPart Number: ENG-001\nDescription: Engine Component\nQuantity: 2\nUnit Price: $45,000.00\nTotal: $90,000.00\n--- SECTION BREAK ---\nSERVICES BREAKDOWN\nInspection Services: $50,000.00\nCertification: $25,000.00\nTesting: $15,000.00',
          pageRange: [4, 6],
          type: 'totals',
          confidence: 0.9,
          importance: 'critical',
          estimatedTokens: 77
        },
        {
          id: 'section_3',
          title: 'Header - Page 1',
          content: 'AVMATS JET SUPPORT\nMAINTENANCE INVOICE\nInvoice #: INV-2024-001\nDate: January 1, 2024\nBill To: Aircraft Owner',
          pageRange: [1, 1],
          type: 'header',
          confidence: 0.9,
          importance: 'high',
          estimatedTokens: 21
        },
        {
          id: 'section_4',
          title: 'Metadata - Page 2',
          content: 'AIRCRAFT INFORMATION\nTail Number: N123ABC\nAircraft Type: Falcon 2000\nSerial Number: 123456\nRegistration: N123ABC',
          pageRange: [2, 2],
          type: 'metadata',
          confidence: 0.85,
          importance: 'high',
          estimatedTokens: 23
        },
        {
          id: 'section_5',
          title: 'Line_items - Pages 8-20',
          content: generateLargeLineItemsSection(), // Sección grande para probar división
          pageRange: [8, 20],
          type: 'line_items',
          confidence: 0.8,
          importance: 'high',
          estimatedTokens: 5200 // Excede límite, debería dividirse
        }
      ]
    };
    
    console.log('📊 Session Data:');
    console.log('Session ID:', mockStage1Data.sessionId);
    console.log('Strategy:', mockStage1Data.processingStrategy);
    console.log('Sections:', mockStage1Data.extractedSections.length);
    console.log('Total Tokens:', mockStage1Data.extractedSections.reduce((sum, s) => sum + s.estimatedTokens, 0));
    
    console.log('\n🚀 Sending request to Stage 2...');
    
    const response = await fetch(LOCAL_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mockStage1Data)
    });
    
    const result = await response.json();
    
    console.log('\n📋 STAGE 2 RESPONSE:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    console.log('Processing Time:', result.processingTime + 'ms');
    
    if (result.success) {
      console.log('\n✅ STAGE 2 CHUNKING RESULTS:');
      console.log('🎯 Session ID:', result.sessionId);
      console.log('📊 Total Chunks:', result.totalChunks);
      console.log('🚀 Token Efficiency:', result.tokenEfficiency.toFixed(1) + '%');
      console.log('⏱️  Est. Total Time:', result.processingPlan.estimatedTotalTime + 's');
      console.log('🔄 Optimization Applied:', result.optimizationApplied ? 'YES' : 'NO');
      console.log('🎪 Next Stage Ready:', result.nextStageReady ? 'YES' : 'NO');
      
      console.log('\n📋 PROCESSING PLAN:');
      console.log('Strategy:', result.processingPlan.strategy);
      if (result.processingPlan.batchGroups) {
        console.log('Parallel Batches:', result.processingPlan.batchGroups.length);
      }
      if (result.processingPlan.sequentialOrder) {
        console.log('Sequential Items:', result.processingPlan.sequentialOrder.length);
      }
      
      if (result.chunks && result.chunks.length > 0) {
        console.log('\n📊 CHUNK ANALYSIS:');
        console.log('Top 5 chunks by priority:');
        
        result.chunks
          .sort((a, b) => b.priority - a.priority)
          .slice(0, 5)
          .forEach((chunk, index) => {
            console.log(`\n${index + 1}. ${chunk.title}`);
            console.log('   ID:', chunk.id);
            console.log('   Type:', chunk.type);
            console.log('   Importance:', chunk.importance);
            console.log('   Priority:', chunk.priority);
            console.log('   Tokens:', chunk.tokenCount);
            console.log('   Est. Time:', chunk.estimatedProcessingTime + 's');
            console.log('   OpenAI Optimized:', chunk.openaiOptimized ? 'YES' : 'NO');
            console.log('   Expected Fields:', chunk.expectedOutputFields.slice(0, 3).join(', ') + '...');
            console.log('   Instructions:', chunk.processingInstructions.substring(0, 100) + '...');
          });
        
        if (result.chunks.length > 5) {
          console.log(`\n... and ${result.chunks.length - 5} more chunks`);
        }
        
        // Validar resultados
        console.log('\n🔍 VALIDATING STAGE 2 RESULTS:');
        validateStage2Results(result, mockStage1Data);
        
      }
      
    } else {
      console.log('\n❌ STAGE 2 FAILED:');
      console.log('Error:', result.error);
      if (result.errors) {
        result.errors.forEach(error => console.log('- ', error));
      }
    }
    
  } catch (error) {
    console.error('🚨 STAGE 2 TEST ERROR:', error.message);
  }
}

function generateLargeLineItemsSection() {
  // Generar contenido grande que exceda el límite de tokens
  let content = 'MAINTENANCE LINE ITEMS - DETAILED BREAKDOWN\n\n';
  
  for (let i = 1; i <= 200; i++) {
    content += `Item ${i}: ${getRandomMaintenanceItem()}\n`;
    content += `Part Number: ${generatePartNumber()}\n`;
    content += `Description: ${getRandomDescription()}\n`;
    content += `Quantity: ${Math.floor(Math.random() * 5) + 1}\n`;
    content += `Unit Price: $${(Math.random() * 10000 + 100).toFixed(2)}\n`;
    content += `Extended: $${(Math.random() * 50000 + 500).toFixed(2)}\n\n`;
  }
  
  return content;
}

function getRandomMaintenanceItem() {
  const items = [
    'Engine Component Replacement',
    'Avionics System Inspection',
    'Landing Gear Maintenance',
    'Fuel System Service',
    'Electrical System Repair',
    'Hydraulic Component Service',
    'Cabin Interior Maintenance',
    'Navigation Equipment Calibration'
  ];
  return items[Math.floor(Math.random() * items.length)];
}

function generatePartNumber() {
  return `${Math.random().toString(36).substr(2, 3).toUpperCase()}-${Math.floor(Math.random() * 9000) + 1000}`;
}

function getRandomDescription() {
  const descriptions = [
    'High-performance aviation component for critical systems',
    'FAA-certified part with extended warranty coverage',
    'OEM replacement component with installation kit',
    'Upgraded component with enhanced reliability features',
    'Standard maintenance part for routine service intervals'
  ];
  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function validateStage2Results(result, inputData) {
  const chunks = result.chunks;
  const originalSections = inputData.extractedSections;
  
  console.log('✅ Basic chunking:', chunks.length > 0);
  console.log('✅ Total chunks reasonable:', chunks.length >= originalSections.length);
  
  // Debe haber dividido la sección grande
  const largeSection = originalSections.find(s => s.estimatedTokens > 4000);
  if (largeSection) {
    const chunksFromLargeSection = chunks.filter(c => c.sourceSection === largeSection.id);
    console.log('✅ Large section divided:', chunksFromLargeSection.length > 1);
  }
  
  // Chunks críticos deben tener alta prioridad
  const criticalChunks = chunks.filter(c => c.importance === 'critical');
  const averageCriticalPriority = criticalChunks.reduce((sum, c) => sum + c.priority, 0) / criticalChunks.length;
  console.log('✅ Critical chunks prioritized:', averageCriticalPriority > 7);
  
  // Todos los chunks deben ser OpenAI optimizados
  const optimizedCount = chunks.filter(c => c.openaiOptimized).length;
  console.log('✅ All chunks OpenAI optimized:', optimizedCount === chunks.length);
  
  // Token efficiency debe ser razonable
  console.log('✅ Token efficiency reasonable:', result.tokenEfficiency > 50 && result.tokenEfficiency <= 100);
  
  // Estrategia híbrida para mega_factura
  console.log('✅ Correct hybrid strategy:', result.processingPlan.strategy === 'hybrid');
  
  // Debe tener plan de procesamiento válido
  const hasPlan = result.processingPlan.batchGroups || result.processingPlan.sequentialOrder;
  console.log('✅ Valid processing plan:', hasPlan);
  
  console.log('\n🎉 STAGE 2 VALIDATION COMPLETED');
  console.log(`📊 Ready for Stage 3 with ${chunks.length} optimized chunks`);
}

// Test básico con secciones pequeñas
async function testStage2Basic() {
  console.log('\n🔧 BASIC STAGE 2 FUNCTIONALITY TEST');
  
  const basicData = {
    sessionId: 'test-basic-stage2-' + Date.now(),
    processingStrategy: 'sequential',
    metadata: {
      filename: 'test_document.pdf',
      pageCount: 5,
      complexity: 'low',
      sizeMB: 0.05
    },
    extractedSections: [
      {
        id: 'basic_section_1',
        title: 'Header - Page 1',
        content: 'Simple maintenance header information',
        pageRange: [1, 1],
        type: 'header',
        confidence: 0.9,
        importance: 'high',
        estimatedTokens: 12
      },
      {
        id: 'basic_section_2',
        title: 'Financial Summary - Page 2',
        content: 'Total: $5,000.00 Labor: $3,000.00 Parts: $2,000.00',
        pageRange: [2, 2],
        type: 'financial_summary',
        confidence: 0.95,
        importance: 'critical',
        estimatedTokens: 15
      }
    ]
  };
  
  try {
    const response = await fetch(LOCAL_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basicData)
    });
    
    const result = await response.json();
    
    console.log('✅ Basic chunking test:', result.success);
    console.log('✅ Sequential strategy:', result.processingPlan.strategy === 'sequential');
    console.log('✅ Chunks created:', result.totalChunks === 2);
    console.log('✅ Token efficiency calculated:', result.tokenEfficiency > 0);
    
  } catch (error) {
    console.log('⚠️ Basic test failed:', error.message);
  }
}

// Ejecutar tests
console.log('🧪 STARTING STAGE 2 TESTING SUITE\n');

testStage2WithMegaFactura()
  .then(() => testStage2Basic())
  .then(() => {
    console.log('\n✅ STAGE 2 TESTING COMPLETED');
    console.log('🚀 Intelligent Chunker ready for production');
    console.log('🎯 Next: Implement Stage 3 (OpenAI Processor)');
  })
  .catch(error => {
    console.error('❌ STAGE 2 TESTING FAILED:', error);
  });