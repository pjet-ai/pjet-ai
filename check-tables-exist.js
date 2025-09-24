// ================================================================
// VERIFICACIÓN DE TABLAS EXISTENTES EN SUPABASE
// ORION OCG - AVIATION MAINTENANCE SUITE
// ================================================================

import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

const supabase = createClient(supabaseUrl, supabaseKey);

// Tablas esperadas y algunas adicionales para verificar
const tablesToCheck = [
    'dim_cost_category',
    'parts',
    'invoices',
    'discrepancies',
    'discrepancy_costs',
    'discrepancy_parts',
    'maintenance_records',  // Tabla legacy que podría existir
    'maintenance_financial_breakdown',  // Tabla legacy
    'maintenance_parts',    // Tabla legacy
    'maintenance_attachments', // Tabla legacy
    'expenses',             // Tabla de gastos existente
    'flights',              // Tabla de vuelos existente
    'flight_logbook'        // Tabla de logbook existente
];

async function checkTableExists(tableName) {
    try {
        console.log(`🔍 Verificando tabla: ${tableName}`);

        // Intentar obtener un registro para ver si la tabla existe
        const { data, error, count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.log(`   ❌ Error: ${error.message}`);
            return { exists: false, error: error.message, count: 0 };
        }

        console.log(`   ✅ Tabla existe - Registros: ${count || 0}`);
        return { exists: true, count: count || 0 };

    } catch (error) {
        console.log(`   ❌ Excepción: ${error.message}`);
        return { exists: false, error: error.message, count: 0 };
    }
}

async function getTableSchema(tableName) {
    try {
        // Usar una consulta simple para inferir el esquema
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (error) {
            return null;
        }

        if (data && data.length > 0) {
            return Object.keys(data[0]);
        }

        return [];

    } catch (error) {
        return null;
    }
}

async function main() {
    console.log('🚀 VERIFICANDO TABLAS EXISTENTES EN SUPABASE');
    console.log('Proyecto: ORION OCG - Aviation Maintenance Suite');
    console.log('Fecha: ' + new Date().toISOString());
    console.log('='.repeat(60));

    const results = {};

    for (const tableName of tablesToCheck) {
        const tableCheck = await checkTableExists(tableName);
        results[tableName] = tableCheck;

        // Si la tabla existe, intentar obtener su esquema
        if (tableCheck.exists) {
            const schema = await getTableSchema(tableName);
            if (schema) {
                results[tableName].schema = schema;
                console.log(`   📋 Columnas: ${schema.join(', ')}`);
            }
        }

        console.log(''); // Espacio entre tablas
    }

    // Resumen
    console.log('📋 RESUMEN DE TABLAS');
    console.log('='.repeat(50));

    const existingTables = Object.entries(results).filter(([_, info]) => info.exists);
    const nonExistingTables = Object.entries(results).filter(([_, info]) => !info.exists);

    console.log(`✅ Tablas existentes (${existingTables.length}):`);
    existingTables.forEach(([name, info]) => {
        console.log(`   - ${name}: ${info.count} registros`);
    });

    console.log(`\n❌ Tablas no existentes (${nonExistingTables.length}):`);
    nonExistingTables.forEach(([name, info]) => {
        console.log(`   - ${name}: ${info.error}`);
    });

    // Verificar qué estructura realmente existe
    console.log('\n🏗️  ANÁLISIS DE ESTRUCTURA ACTUAL');
    console.log('='.repeat(50));

    if (existingTables.length === 0) {
        console.log('⚠️  No se encontraron tablas de mantenimiento');
        console.log('📝 Recomendación: Ejecutar las migraciones para crear las tablas');
    } else {
        console.log('📊 Estructura encontrada:');

        // Buscar patrones en las tablas existentes
        const hasInvoices = results.invoices?.exists;
        const hasDiscrepancies = results.discrepancies?.exists;
        const hasParts = results.parts?.exists;
        const hasLegacyTables = results.maintenance_records?.exists;

        if (hasLegacyTables) {
            console.log('   🔄 Se encontraron tablas legacy (estructura antigua)');
        }

        if (hasInvoices && hasDiscrepancies && hasParts) {
            console.log('   ✅ Se encontró la nueva estructura normalizada (n8n integration)');
        } else if (hasInvoices || hasDiscrepancies) {
            console.log('   ⚠️  Se encontró una estructura parcial');
        } else {
            console.log('   ❌ No se encontró estructura completa de mantenimiento');
        }
    }

    // Guardar resultados
    const report = {
        analysis_date: new Date().toISOString(),
        project: 'ORION OCG - Aviation Maintenance Suite',
        supabase_project: 'vvazmdauzaexknybbnfc',
        tables_checked: tablesToCheck,
        results: results,
        summary: {
            total_checked: tablesToCheck.length,
            existing_tables: existingTables.length,
            non_existing_tables: nonExistingTables.length,
            has_legacy_structure: results.maintenance_records?.exists || false,
            has_new_structure: (results.invoices?.exists && results.discrepancies?.exists && results.parts?.exists) || false
        }
    };

    // Importar fs y guardar el reporte
    const fs = await import('fs');
    const reportFile = `table-existence-report-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n💾 Reporte guardado en: ${reportFile}`);

    return report;
}

// Ejecutar verificación
main().catch(console.error);