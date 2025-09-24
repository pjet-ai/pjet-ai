// 📄 MOCK PDF TEXT EXTRACTOR - Simulador de Extracción de Texto
// Simula diferentes tipos de facturas de mantenimiento aeronáutico

class MockPDFExtractor {
  constructor() {
    this.samplePDFs = {
      // PDF de mantenimiento complejo con todos los campos
      'complete_maintenance': {
        filename: 'complete_maintenance.pdf',
        sizeKB: 2048,
        text: `
AVMATS JET SUPPORT MAINTENANCE INVOICE
Invoice Number: MAINT-2024-5567
Date: September 11, 2024
Aircraft Registration: N456DEF
Aircraft Type: Gulfstream G650
Serial Number: 6067

MAINTENANCE SUMMARY:
Total Amount: $847,250.75
Currency: USD
Work Description: Comprehensive 100-hour inspection and component overhaul including engine maintenance, avionics updates, and hydraulic system service.
Maintenance Category: Scheduled Inspection

DETAILED FINANCIAL BREAKDOWN:
Labor Costs: $425,000.00 (850 hours @ $500.00/hr)
Parts and Materials: $312,450.25
Services and Testing: $89,600.50
Freight and Logistics: $15,200.00
Taxes and Fees: $5,000.00

MAJOR PARTS REPLACED:
Part Number: ENG-GE90-447
Description: Turbine Blade Assembly
Manufacturer: General Electric
Quantity: 2
Unit Price: $45,000.00
Total Price: $90,000.00
Category: Engine

Part Number: HYD-SYSTEM-889
Description: Hydraulic Pump Assembly
Manufacturer: Parker Aerospace
Quantity: 1
Unit Price: $28,500.00
Total Price: $28,500.00
Category: Hydraulic

COMPLIANCE NOTES:
All work performed in accordance with FAA regulations.
Return to Service: Authorized by A&P License #1234567890
        `,
        complexity: 'high'
      },

      // PDF simple con datos básicos
      'basic_maintenance': {
        filename: 'basic_maintenance.pdf',
        sizeKB: 512,
        text: `
BASIC MAINTENANCE SERVICES
Invoice: BMI-2024-001
Date: 2024-09-11
Aircraft: N123ABC
Total: $15,500.00
Work: Oil change and basic inspection
Category: Routine Maintenance
        `,
        complexity: 'low'
      },

      // PDF problemático con formato inconsistente
      'problematic_pdf': {
        filename: 'problematic_invoice.pdf', 
        sizeKB: 1024,
        text: `
Maintenance Work Order #xyz123
Date: Sept 11 2024
Aircraft N789XYZ
Amount Due 25000
Parts used: various engine components
Labor 120 hrs
        `,
        complexity: 'medium'
      },

      // PDF corrupto o con texto ilegible
      'corrupted_pdf': {
        filename: 'corrupted_file.pdf',
        sizeKB: 128,
        text: 'a8f7s9d8f7s6d5f4s3d2f1s0d9f8s7d6f5s4d3f2s1d0f9s8d7f6s5d4f3s2d1f0',
        complexity: 'corrupt'
      }
    };
  }

  // Simula extracción de texto del PDF
  extractText(filename = 'complete_maintenance', options = {}) {
    console.log(`📄 Mock PDF Extractor: Processing ${filename}`);
    
    const pdfData = this.samplePDFs[filename] || this.samplePDFs['basic_maintenance'];
    
    // Simular tiempo de procesamiento
    const processingTime = this.calculateProcessingTime(pdfData.sizeKB);
    
    console.log(`📊 PDF Analysis: ${pdfData.filename} (${pdfData.sizeKB}KB, ${pdfData.complexity} complexity)`);
    console.log(`⏱️ Estimated processing time: ${processingTime}ms`);
    
    // Simular errores ocasionales
    if (options.simulateError && Math.random() < 0.1) {
      throw new Error(`PDF extraction failed: ${filename} could not be processed`);
    }
    
    return {
      success: true,
      filename: pdfData.filename,
      extractedText: pdfData.text,
      metadata: {
        sizeKB: pdfData.sizeKB,
        complexity: pdfData.complexity,
        processingTime: processingTime,
        wordCount: pdfData.text.split(' ').length,
        characterCount: pdfData.text.length
      }
    };
  }

  // Simula diferentes escenarios de extracción
  extractWithScenario(scenario) {
    console.log(`🎭 Mock PDF Extractor: Running scenario '${scenario}'`);
    
    switch (scenario) {
      case 'success_complete':
        return this.extractText('complete_maintenance');
        
      case 'success_basic':
        return this.extractText('basic_maintenance');
        
      case 'partial_data':
        return this.extractText('problematic_pdf');
        
      case 'extraction_failure':
        return {
          success: false,
          error: 'PDF is corrupted or password protected',
          filename: 'corrupted_file.pdf'
        };
        
      case 'timeout':
        return {
          success: false,
          error: 'PDF processing timeout - file too large',
          filename: 'large_file.pdf'
        };
        
      default:
        return this.extractText('complete_maintenance');
    }
  }

  // Calcula tiempo de procesamiento basado en tamaño
  calculateProcessingTime(sizeKB) {
    // Simular tiempo realista: ~100ms por cada 100KB
    return Math.max(50, Math.floor(sizeKB / 100 * 100) + Math.random() * 200);
  }

  // Lista todos los PDFs disponibles para testing
  listAvailablePDFs() {
    return Object.keys(this.samplePDFs).map(key => ({
      key,
      filename: this.samplePDFs[key].filename,
      complexity: this.samplePDFs[key].complexity,
      sizeKB: this.samplePDFs[key].sizeKB
    }));
  }
}

export default MockPDFExtractor;