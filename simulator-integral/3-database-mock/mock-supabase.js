// 💾 MOCK SUPABASE DATABASE - Simula Operaciones de Base de Datos
// In-memory database que replica la estructura y comportamiento de Supabase

class MockSupabase {
  constructor() {
    this.tables = {
      maintenance_records: [],
      maintenance_financial_breakdown: [],
      maintenance_parts: []
    };
    
    this.nextId = 1;
    this.users = [
      { id: '00000000-0000-0000-0000-000000000000', email: 'test@orion-ocg.com' }
    ];
    
    console.log('💾 Mock Supabase initialized with empty tables');
  }

  // Simula supabase.functions.invoke()
  async functionsInvoke(functionName, options = {}) {
    console.log(`🔗 Mock Supabase Functions: Invoking '${functionName}'`);
    
    switch (functionName) {
      case 'extract-maintenance-data':
        return this.mockExtractMaintenanceData(options.body);
        
      case 'save-maintenance-record':
        return this.mockSaveMaintenanceRecord(options.body);
        
      default:
        return {
          data: null,
          error: { message: `Function '${functionName}' not found in mock` }
        };
    }
  }

  // Mock extract-maintenance-data function
  async mockExtractMaintenanceData(formData) {
    console.log('🔍 Mock Function: extract-maintenance-data');
    
    // Simular delay de procesamiento
    await this.simulateDelay(2000, 5000);
    
    // Determinar qué tipo de respuesta generar
    const scenarios = [
      'success_complete',
      'success_basic', 
      'partial_data',
      'openai_error'
    ];
    
    const scenario = scenarios[0]; // Usar escenario exitoso por defecto
    
    switch (scenario) {
      case 'success_complete':
        return {
          data: {
            success: true,
            strategy: 'direct',
            extractedData: {
              vendor_name: "AVMATS Jet Support",
              total_amount: 847250.75,
              currency: "USD",
              invoice_date: "2024-09-11",
              invoice_number: "MAINT-2024-5567",
              work_description: "Comprehensive 100-hour inspection and component overhaul",
              aircraft_registration: "N456DEF",
              maintenance_category: "Scheduled Inspection",
              financial_breakdown: [
                { category: "Labor", amount: 425000.00, description: "Labor costs" },
                { category: "Parts", amount: 312450.25, description: "Parts and materials" }
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
                }
              ]
            }
          },
          error: null
        };
        
      case 'openai_error':
        return {
          data: {
            success: false,
            error: "JSON parse error: Unexpected token 'T'",
            extractedData: null
          },
          error: null
        };
        
      default:
        return {
          data: { success: true, extractedData: {} },
          error: null
        };
    }
  }

  // Mock save-maintenance-record function
  async mockSaveMaintenanceRecord(payload) {
    console.log('💾 Mock Function: save-maintenance-record');
    console.log('📊 Payload received:', JSON.stringify(payload, null, 2));
    
    // Simular delay de base de datos
    await this.simulateDelay(500, 1500);
    
    const { extractedData, originalFile } = payload;
    
    // Validar datos de entrada
    if (!extractedData) {
      return {
        data: {
          success: false,
          error: 'Extracted data is required'
        },
        error: null
      };
    }

    // Simular validación de usuario (mock auth)
    const mockUserId = '00000000-0000-0000-0000-000000000000';
    
    // Crear registro principal
    const maintenanceRecord = {
      id: this.nextId++,
      user_id: mockUserId,
      date: extractedData.date || extractedData.invoice_date || new Date().toISOString().split('T')[0],
      vendor: extractedData.vendor || extractedData.vendor_name || 'Unknown Vendor',
      total: extractedData.total || extractedData.total_amount || 0,
      currency: extractedData.currency || 'USD',
      status: extractedData.status || 'pending',
      invoice_number: extractedData.invoice_number || null,
      work_description: extractedData.work_description || null,
      aircraft_registration: extractedData.aircraft_registration || null,
      maintenance_category: extractedData.maintenance_category || null,
      labor_total: extractedData.labor_total || 0,
      parts_total: extractedData.parts_total || 0,
      created_at: new Date().toISOString()
    };

    // Guardar en tabla principal
    this.tables.maintenance_records.push(maintenanceRecord);
    console.log(`💾 Saved maintenance record: ID ${maintenanceRecord.id}`);

    // Procesar financial breakdown si existe
    let financialBreakdownCount = 0;
    if (extractedData.financial_breakdown) {
      const breakdown = Array.isArray(extractedData.financial_breakdown) 
        ? extractedData.financial_breakdown 
        : Object.entries(extractedData.financial_breakdown).map(([category, amount]) => ({
            category, 
            amount, 
            description: `${category} costs`
          }));
      
      breakdown.forEach(item => {
        const breakdownRecord = {
          id: this.nextId++,
          maintenance_record_id: maintenanceRecord.id,
          category: item.category,
          amount: item.amount,
          description: item.description || '',
          created_at: new Date().toISOString()
        };
        
        this.tables.maintenance_financial_breakdown.push(breakdownRecord);
        financialBreakdownCount++;
      });
    }

    // Procesar parts si existen
    let partsCount = 0;
    if (extractedData.parts && Array.isArray(extractedData.parts)) {
      extractedData.parts.forEach(part => {
        const partRecord = {
          id: this.nextId++,
          maintenance_record_id: maintenanceRecord.id,
          part_number: part.part_number || 'Unknown',
          part_description: part.part_description || 'Part',
          manufacturer: part.manufacturer || 'Unknown',
          quantity: part.quantity || 1,
          unit_price: part.unit_price || 0,
          total_price: part.total_price || 0,
          part_category: part.part_category || 'Other',
          created_at: new Date().toISOString()
        };
        
        this.tables.maintenance_parts.push(partRecord);
        partsCount++;
      });
    }

    // Simular casos de error ocasionales
    if (Math.random() < 0.05) { // 5% chance de error
      return {
        data: {
          success: false,
          error: 'Database connection timeout'
        },
        error: null
      };
    }

    return {
      data: {
        success: true,
        message: 'Maintenance record saved successfully',
        maintenance: maintenanceRecord,
        savedComponents: {
          mainRecord: true,
          financialBreakdown: financialBreakdownCount > 0,
          parts: partsCount > 0
        },
        stats: {
          financialBreakdownItems: financialBreakdownCount,
          partsCount: partsCount
        }
      },
      error: null
    };
  }

  // Simula delay realista
  async simulateDelay(minMs, maxMs) {
    const delay = minMs + Math.random() * (maxMs - minMs);
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  // Query functions para testing
  async select(table) {
    return {
      data: this.tables[table] || [],
      error: null
    };
  }

  async insert(table, data) {
    if (!this.tables[table]) {
      return {
        data: null,
        error: { message: `Table ${table} not found` }
      };
    }

    const record = {
      id: this.nextId++,
      ...data,
      created_at: new Date().toISOString()
    };

    this.tables[table].push(record);
    
    return {
      data: [record],
      error: null
    };
  }

  // Funciones de utilidad para testing
  getTableStats() {
    return Object.entries(this.tables).reduce((stats, [tableName, records]) => {
      stats[tableName] = {
        count: records.length,
        lastRecord: records[records.length - 1] || null
      };
      return stats;
    }, {});
  }

  clearAllTables() {
    for (const tableName of Object.keys(this.tables)) {
      this.tables[tableName] = [];
    }
    this.nextId = 1;
    console.log('💾 All mock tables cleared');
  }

  // Simular errores específicos para testing
  setErrorMode(errorType, probability = 0.5) {
    this.errorMode = { type: errorType, probability };
    console.log(`💾 Mock database set to error mode: ${errorType} (${probability * 100}% chance)`);
  }

  clearErrorMode() {
    delete this.errorMode;
    console.log('💾 Mock database error mode cleared');
  }
}

export default MockSupabase;