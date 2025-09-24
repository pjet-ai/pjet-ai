// 🎭 ORCHESTRATOR TEST - Simulador Integral End-to-End
// Ejecuta todo el pipeline de mantenimiento sin dependencias externas

import MockPDFExtractor from './1-pdf-processor/mock-text-extractor.js';
import MockOpenAI from './4-openai-mock/mock-openai.js';
import SchemaValidator from './2-data-transformer/schema-validator.js';
import MockSupabase from './3-database-mock/mock-supabase.js';

class MaintenanceOrchestrator {
  constructor(options = {}) {
    this.pdfExtractor = new MockPDFExtractor();
    this.openai = new MockOpenAI();
    this.schemaValidator = new SchemaValidator();
    this.database = new MockSupabase();
    
    this.options = {
      enableValidation: options.enableValidation !== false,
      enableErrorInjection: options.enableErrorInjection || false,
      verboseLogging: options.verboseLogging !== false,
      simulateRealTiming: options.simulateRealTiming !== false
    };
    
    console.log('🎭 Maintenance Orchestrator initialized');
    console.log(`📊 Options: ${JSON.stringify(this.options, null, 2)}`);
  }

  // Ejecuta pipeline completo end-to-end
  async runFullPipeline(scenario = 'complete_maintenance', options = {}) {
    console.log(`\n${'='.repeat(80)}`);
    console.log('🚀 STARTING FULL PIPELINE SIMULATION');
    console.log(`📋 Scenario: ${scenario}`);
    console.log(`${'='.repeat(80)}\n`);

    const startTime = Date.now();
    const results = {
      scenario,
      phases: {},
      validations: {},
      errors: [],
      warnings: [],
      success: false,
      totalTime: 0
    };

    try {
      // PHASE 1: PDF Text Extraction
      console.log('📄 PHASE 1: PDF Text Extraction');
      const phase1Start = Date.now();
      
      const extractionResult = this.pdfExtractor.extractWithScenario(scenario);
      results.phases.textExtraction = {
        success: extractionResult.success,
        data: extractionResult,
        duration: Date.now() - phase1Start
      };

      if (!extractionResult.success) {
        results.errors.push('PDF extraction failed');
        return this.finalizePipeline(results, startTime);
      }

      console.log(`✅ Text extracted: ${extractionResult.extractedText.length} characters`);

      // PHASE 2: OpenAI Data Processing
      console.log('\n🤖 PHASE 2: OpenAI Data Processing');
      const phase2Start = Date.now();
      
      const aiResult = await this.openai.processText(extractionResult.extractedText, scenario);
      results.phases.aiProcessing = {
        success: aiResult.success,
        data: aiResult,
        duration: Date.now() - phase2Start
      };

      if (!aiResult.success) {
        results.errors.push(`OpenAI processing failed: ${aiResult.error}`);
        return this.finalizePipeline(results, startTime);
      }

      console.log(`✅ AI processing completed (confidence: ${aiResult.processingInfo?.confidence || 'unknown'})`);

      // PHASE 3: Schema Validation
      if (this.options.enableValidation) {
        console.log('\n🔍 PHASE 3: Schema Validation');
        const phase3Start = Date.now();
        
        const validation = this.schemaValidator.validate(aiResult.data, 'extractedData');
        results.validations.extractedData = validation;
        results.phases.schemaValidation = {
          success: validation.valid,
          data: validation,
          duration: Date.now() - phase3Start
        };

        if (!validation.valid) {
          results.errors.push(...validation.errors.map(err => `Schema validation: ${err}`));
          results.warnings.push(...validation.warnings.map(warn => `Schema warning: ${warn}`));
        }

        console.log(`${validation.valid ? '✅' : '⚠️'} Schema validation: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);
      }

      // PHASE 4: Data Transformation
      console.log('\n🔄 PHASE 4: Data Transformation');
      const phase4Start = Date.now();
      
      const transformedData = this.transformDataForSave(aiResult.data);
      results.phases.dataTransformation = {
        success: true,
        data: transformedData,
        duration: Date.now() - phase4Start
      };

      // Validate transformed data
      if (this.options.enableValidation) {
        const saveValidation = this.schemaValidator.validate(
          { extractedData: transformedData, originalFile: null }, 
          'saveRecordInput'
        );
        results.validations.saveRecordInput = saveValidation;
        
        if (!saveValidation.valid) {
          results.errors.push(...saveValidation.errors.map(err => `Save validation: ${err}`));
        }
      }

      console.log('✅ Data transformed for save operation');

      // PHASE 5: Database Save
      console.log('\n💾 PHASE 5: Database Save');
      const phase5Start = Date.now();
      
      const saveResult = await this.database.mockSaveMaintenanceRecord({
        extractedData: transformedData,
        originalFile: null
      });
      
      results.phases.databaseSave = {
        success: saveResult.data?.success || false,
        data: saveResult,
        duration: Date.now() - phase5Start
      };

      if (!saveResult.data?.success) {
        results.errors.push(`Database save failed: ${saveResult.data?.error || 'Unknown error'}`);
        return this.finalizePipeline(results, startTime);
      }

      console.log(`✅ Database save completed: Record ID ${saveResult.data.maintenance.id}`);

      // PHASE 6: Final Validation
      console.log('\n🏁 PHASE 6: Final Validation');
      const phase6Start = Date.now();
      
      const dbStats = this.database.getTableStats();
      const finalValidation = this.validateFinalState(dbStats, saveResult.data);
      
      results.phases.finalValidation = {
        success: finalValidation.success,
        data: finalValidation,
        duration: Date.now() - phase6Start
      };

      if (!finalValidation.success) {
        results.errors.push(...finalValidation.errors);
      }

      results.success = results.errors.length === 0;
      console.log(`${results.success ? '✅' : '❌'} Final validation: ${finalValidation.errors.length} issues found`);

    } catch (error) {
      console.error('💥 Pipeline crashed:', error.message);
      results.errors.push(`Pipeline crash: ${error.message}`);
      results.success = false;
    }

    return this.finalizePipeline(results, startTime);
  }

  // Transforma datos del formato extract al formato save
  transformDataForSave(extractedData) {
    if (!extractedData) return {};

    const transformed = {
      vendor: extractedData.vendor_name,
      total: extractedData.total_amount,
      date: extractedData.invoice_date,
      currency: extractedData.currency,
      invoice_number: extractedData.invoice_number,
      work_description: extractedData.work_description,
      aircraft_registration: extractedData.aircraft_registration,
      maintenance_category: extractedData.maintenance_category
    };

    // Transformar financial breakdown
    if (extractedData.financial_breakdown && Array.isArray(extractedData.financial_breakdown)) {
      transformed.financial_breakdown = extractedData.financial_breakdown.reduce((acc, item) => {
        acc[item.category.toLowerCase()] = item.amount;
        return acc;
      }, {});
      
      // Calcular totales
      transformed.labor_total = transformed.financial_breakdown.labor || 0;
      transformed.parts_total = transformed.financial_breakdown.parts || 0;
    }

    // Transformar parts list
    if (extractedData.parts_list && Array.isArray(extractedData.parts_list)) {
      transformed.parts = extractedData.parts_list.map(part => ({
        part_number: part.part_number,
        part_description: part.part_description,
        manufacturer: part.manufacturer,
        quantity: part.quantity,
        unit_price: part.unit_price,
        total_price: part.total_price,
        part_category: part.part_category
      }));
    }

    return transformed;
  }

  // Valida estado final del pipeline
  validateFinalState(dbStats, saveResult) {
    const errors = [];
    
    // Verificar que se guardó el registro principal
    if (dbStats.maintenance_records.count === 0) {
      errors.push('No maintenance record was saved');
    }

    // Verificar consistencia de datos
    if (saveResult.maintenance && saveResult.savedComponents) {
      if (saveResult.savedComponents.financialBreakdown && dbStats.maintenance_financial_breakdown.count === 0) {
        errors.push('Financial breakdown was reported as saved but no records found in database');
      }
      
      if (saveResult.savedComponents.parts && dbStats.maintenance_parts.count === 0) {
        errors.push('Parts were reported as saved but no records found in database');
      }
    }

    return {
      success: errors.length === 0,
      errors,
      dbStats
    };
  }

  // Finaliza el pipeline y genera reporte
  finalizePipeline(results, startTime) {
    results.totalTime = Date.now() - startTime;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log('📊 PIPELINE EXECUTION REPORT');
    console.log(`${'='.repeat(80)}`);
    
    console.log(`\n🎯 Overall Result: ${results.success ? '✅ SUCCESS' : '❌ FAILURE'}`);
    console.log(`⏱️ Total Execution Time: ${results.totalTime}ms`);
    console.log(`📋 Scenario: ${results.scenario}`);
    
    // Reporte por fases
    console.log('\n📈 Phase Breakdown:');
    for (const [phaseName, phaseData] of Object.entries(results.phases)) {
      console.log(`   ${phaseData.success ? '✅' : '❌'} ${phaseName}: ${phaseData.duration}ms`);
    }
    
    // Errores y warnings
    if (results.errors.length > 0) {
      console.log('\n❌ Errors:');
      results.errors.forEach(error => console.log(`   • ${error}`));
    }
    
    if (results.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      results.warnings.forEach(warning => console.log(`   • ${warning}`));
    }
    
    // Estadísticas de base de datos
    const dbStats = this.database.getTableStats();
    console.log('\n💾 Database State:');
    for (const [tableName, stats] of Object.entries(dbStats)) {
      console.log(`   📄 ${tableName}: ${stats.count} records`);
    }
    
    console.log(`\n${'='.repeat(80)}\n`);
    
    return results;
  }

  // Ejecuta múltiples escenarios para testing completo
  async runTestSuite(scenarios = ['complete_maintenance', 'basic_maintenance', 'problematic_pdf']) {
    console.log('🧪 RUNNING COMPLETE TEST SUITE\n');
    
    const suiteResults = [];
    
    for (const scenario of scenarios) {
      // Limpiar base de datos antes de cada test
      this.database.clearAllTables();
      
      const result = await this.runFullPipeline(scenario);
      suiteResults.push(result);
      
      // Pausa entre tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Reporte final del suite
    console.log('🏆 TEST SUITE SUMMARY');
    console.log(`${'='.repeat(50)}`);
    
    const successes = suiteResults.filter(r => r.success).length;
    const failures = suiteResults.length - successes;
    
    console.log(`✅ Passed: ${successes}/${suiteResults.length}`);
    console.log(`❌ Failed: ${failures}/${suiteResults.length}`);
    console.log(`📊 Success Rate: ${(successes / suiteResults.length * 100).toFixed(1)}%`);
    
    return {
      results: suiteResults,
      summary: {
        total: suiteResults.length,
        passed: successes,
        failed: failures,
        successRate: successes / suiteResults.length
      }
    };
  }
}

// Función principal para ejecutar el simulador
async function main() {
  console.log('🎭 MAINTENANCE PIPELINE SIMULATOR');
  console.log('================================\n');
  
  const orchestrator = new MaintenanceOrchestrator({
    enableValidation: true,
    verboseLogging: true,
    simulateRealTiming: false
  });
  
  // Ejecutar test suite completo
  const suiteResults = await orchestrator.runTestSuite([
    'complete_maintenance',
    'basic_maintenance', 
    'problematic_pdf',
    'json_parse_error'
  ]);
  
  // Detectar problemas específicos de los logs reales
  console.log('\n🔍 ANALYZING REAL-WORLD ISSUES');
  console.log('==============================');
  
  const issues = [];
  
  suiteResults.results.forEach(result => {
    // Buscar el patrón de error "vendor: undefined, total: undefined"
    if (result.phases.aiProcessing?.data?.data) {
      const data = result.phases.aiProcessing.data.data;
      if (!data.vendor_name || !data.total_amount) {
        issues.push({
          scenario: result.scenario,
          issue: 'Missing vendor_name or total_amount',
          severity: 'high',
          matches: 'Real log: vendor: undefined, total: undefined'
        });
      }
    }
    
    // Buscar errores de JSON parsing
    if (result.phases.aiProcessing?.success === false && 
        result.phases.aiProcessing?.data?.error?.includes('JSON')) {
      issues.push({
        scenario: result.scenario,
        issue: 'JSON parse error in OpenAI response',
        severity: 'high',
        matches: 'Real log: JSON parse error: SyntaxError'
      });
    }
  });
  
  if (issues.length > 0) {
    console.log('\n🚨 Issues Found Matching Real Logs:');
    issues.forEach(issue => {
      console.log(`   ❌ ${issue.scenario}: ${issue.issue}`);
      console.log(`      📋 Matches: ${issue.matches}`);
    });
  } else {
    console.log('\n✅ No critical issues detected in simulation');
  }
  
  console.log('\n🎉 Simulation Complete!');
}

// Ejecutar directamente
main().catch(console.error);

export default MaintenanceOrchestrator;