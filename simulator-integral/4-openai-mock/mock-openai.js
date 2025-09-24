// 🤖 MOCK OPENAI PROCESSOR - Simula Respuestas de IA para Extracción de Datos
// Genera respuestas consistentes sin depender de OpenAI API

class MockOpenAI {
  constructor() {
    this.responsePatterns = {
      // Respuesta perfecta con todos los campos
      'complete_maintenance': {
        vendor_name: "AVMATS Jet Support",
        total_amount: 847250.75,
        currency: "USD",
        invoice_date: "2024-09-11",
        invoice_number: "MAINT-2024-5567",
        work_description: "Comprehensive 100-hour inspection and component overhaul including engine maintenance, avionics updates, and hydraulic system service",
        aircraft_registration: "N456DEF",
        maintenance_category: "Scheduled Inspection",
        financial_breakdown: [
          { category: "Labor", amount: 425000.00, description: "Labor costs (850 hours @ $500/hr)" },
          { category: "Parts", amount: 312450.25, description: "Parts and materials" },
          { category: "Services", amount: 89600.50, description: "Services and testing" },
          { category: "Freight", amount: 15200.00, description: "Freight and logistics" },
          { category: "Taxes", amount: 5000.00, description: "Taxes and fees" }
        ],
        parts_list: [
          {
            part_number: "ENG-GE90-447",
            part_description: "Turbine Blade Assembly",
            manufacturer: "General Electric",
            quantity: 2,
            unit_price: 45000.00,
            total_price: 90000.00,
            part_category: "Engine"
          },
          {
            part_number: "HYD-SYSTEM-889",
            part_description: "Hydraulic Pump Assembly", 
            manufacturer: "Parker Aerospace",
            quantity: 1,
            unit_price: 28500.00,
            total_price: 28500.00,
            part_category: "Hydraulic"
          }
        ]
      },

      // Respuesta básica con campos mínimos
      'basic_maintenance': {
        vendor_name: "Basic Maintenance Services",
        total_amount: 15500.00,
        currency: "USD",
        invoice_date: "2024-09-11",
        invoice_number: "BMI-2024-001",
        work_description: "Oil change and basic inspection",
        aircraft_registration: "N123ABC",
        maintenance_category: "Routine Maintenance",
        financial_breakdown: [
          { category: "Labor", amount: 8500.00, description: "Basic maintenance labor" },
          { category: "Parts", amount: 7000.00, description: "Oil and filters" }
        ],
        parts_list: []
      },

      // Respuesta con datos incompletos/problemáticos
      'problematic_pdf': {
        vendor_name: "Unknown Vendor",
        total_amount: 25000.00,
        currency: "USD", 
        invoice_date: "2024-09-11",
        invoice_number: "xyz123",
        work_description: "Engine maintenance work",
        aircraft_registration: "N789XYZ",
        maintenance_category: "Unscheduled Discrepancy",
        financial_breakdown: [
          { category: "Labor", amount: 15000.00, description: "120 hours labor" },
          { category: "Parts", amount: 10000.00, description: "Various engine components" }
        ],
        parts_list: []
      }
    };
  }

  // Simula llamada a OpenAI API
  async processText(text, scenario = 'auto') {
    console.log(`🤖 Mock OpenAI: Processing text (${text.length} characters)`);
    
    // Simular delay de API real
    await this.simulateAPIDelay();
    
    // Determinar escenario automáticamente o usar el especificado
    const detectedScenario = scenario === 'auto' ? this.detectScenario(text) : scenario;
    
    console.log(`🎯 Mock OpenAI: Detected scenario '${detectedScenario}'`);
    
    // Simular diferentes tipos de respuestas
    return this.generateResponse(detectedScenario, text);
  }

  // Detecta qué tipo de documento es basado en el contenido
  detectScenario(text) {
    const textLower = text.toLowerCase();
    
    if (textLower.includes('avmats jet support') && textLower.includes('maint-2024-5567')) {
      return 'complete_maintenance';
    } else if (textLower.includes('basic maintenance') && textLower.includes('bmi-2024-001')) {
      return 'basic_maintenance';  
    } else if (textLower.includes('xyz123') || textLower.includes('n789xyz')) {
      return 'problematic_pdf';
    } else if (text.length < 100 || /^[a-f0-9]+$/.test(text.substring(0, 50))) {
      return 'corrupted_data';
    } else {
      return 'complete_maintenance'; // fallback
    }
  }

  // Genera respuesta basada en escenario
  generateResponse(scenario, originalText) {
    switch (scenario) {
      case 'complete_maintenance':
      case 'basic_maintenance':
      case 'problematic_pdf':
        return {
          success: true,
          data: this.responsePatterns[scenario],
          processingInfo: {
            scenario: scenario,
            textLength: originalText.length,
            confidence: this.calculateConfidence(scenario)
          }
        };

      case 'json_parse_error':
        // Simula el error que vimos en los logs
        return {
          success: false,
          error: 'JSON Parse Error',
          rawResponse: 'The provided text appears to be a maintenance invoice but the format is unclear...',
          processingInfo: {
            scenario: scenario,
            issue: 'OpenAI returned non-JSON response'
          }
        };

      case 'api_timeout':
        return {
          success: false,
          error: 'API Timeout',
          processingInfo: {
            scenario: scenario,
            issue: 'OpenAI API took too long to respond'
          }
        };

      case 'corrupted_data':
        return {
          success: false,
          error: 'Unprocessable Content', 
          processingInfo: {
            scenario: scenario,
            issue: 'Text appears to be corrupted or not a valid invoice'
          }
        };

      case 'partial_extraction':
        // Simula extracción parcial exitosa
        const partialData = { ...this.responsePatterns['basic_maintenance'] };
        partialData.vendor_name = "Unknown Vendor";
        partialData.work_description = null;
        partialData.financial_breakdown = [];
        
        return {
          success: true,
          data: partialData,
          processingInfo: {
            scenario: scenario,
            confidence: 0.6,
            issues: ['Some fields could not be extracted', 'Financial breakdown incomplete']
          }
        };

      default:
        return this.generateResponse('complete_maintenance', originalText);
    }
  }

  // Simula delay realista de API
  async simulateAPIDelay() {
    // OpenAI GPT-4 típicamente toma 2-8 segundos para estas consultas
    const delay = 1000 + Math.random() * 3000;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Calcula confianza basada en escenario
  calculateConfidence(scenario) {
    const confidenceMap = {
      'complete_maintenance': 0.95,
      'basic_maintenance': 0.88,
      'problematic_pdf': 0.65,
      'partial_extraction': 0.60,
      'corrupted_data': 0.10
    };
    
    return confidenceMap[scenario] || 0.50;
  }

  // Lista todos los escenarios disponibles para testing
  listAvailableScenarios() {
    return [
      'complete_maintenance',
      'basic_maintenance', 
      'problematic_pdf',
      'json_parse_error',
      'api_timeout',
      'corrupted_data',
      'partial_extraction'
    ];
  }

  // Testing helper - fuerza un escenario específico
  async testScenario(scenario, mockText = "Sample maintenance text") {
    console.log(`🧪 Mock OpenAI: Testing scenario '${scenario}'`);
    return this.processText(mockText, scenario);
  }
}

export default MockOpenAI;