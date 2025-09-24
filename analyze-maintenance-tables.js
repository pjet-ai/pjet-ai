// ================================================================
// ANÁLISIS COMPLETO DE TABLAS DE MANTENIMIENTO EN SUPABASE
// ORION OCG - AVIATION MAINTENANCE SUITE
// ================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

const supabase = createClient(supabaseUrl, supabaseKey);

// Tablas a analizar
const targetTables = [
    'dim_cost_category',
    'parts',
    'invoices',
    'discrepancies',
    'discrepancy_costs',
    'discrepancy_parts'
];

// Función para obtener información de una tabla
async function getTableInfo(tableName) {
    console.log(`\n📊 Analizando tabla: ${tableName.toUpperCase()}`);
    console.log('='.repeat(50));

    try {
        // 1. Obtener estructura de columnas
        const { data: columnsData, error: columnsError } = await supabase
            .from(tableName)
            .select('*')
            .limit(0);

        if (columnsError && !columnsError.message.includes('contains 0 rows')) {
            console.error('❌ Error al obtener estructura:', columnsError.message);
            return null;
        }

        // 2. Obtener conteo de registros
        const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

        if (countError) {
            console.error('❌ Error al contar registros:', countError.message);
            return null;
        }

        // 3. Obtener datos de muestra (máximo 5 registros)
        const { data: sampleData, error: sampleError } = await supabase
            .from(tableName)
            .select('*')
            .limit(5);

        if (sampleError) {
            console.error('❌ Error al obtener muestra:', sampleError.message);
            return null;
        }

        // 4. Obtener información de columnas usando la API de Supabase
        const { data: tableInfo, error: infoError } = await supabase.rpc('get_table_info', {
            table_name: tableName
        }).catch(() => null);

        const tableAnalysis = {
            table_name: tableName,
            record_count: count || 0,
            has_data: (count || 0) > 0,
            sample_data: sampleData || [],
            columns: sampleData && sampleData.length > 0 ? Object.keys(sampleData[0]) : [],
            estimated_structure: {}
        };

        // 5. Análisis de estructura basado en datos de muestra
        if (sampleData && sampleData.length > 0) {
            const firstRecord = sampleData[0];
            tableAnalysis.estimated_structure = Object.keys(firstRecord).reduce((acc, key) => {
                const value = firstRecord[key];
                acc[key] = {
                    type: getValueType(value),
                    nullable: value === null,
                    sample_value: value
                };
                return acc;
            }, {});
        }

        // 6. Si la tabla tiene datos, obtener estadísticas básicas
        if (tableAnalysis.has_data) {
            const stats = await getTableStats(tableName, sampleData);
            tableAnalysis.statistics = stats;
        }

        return tableAnalysis;

    } catch (error) {
        console.error('❌ Error inesperado:', error.message);
        return null;
    }
}

// Función para determinar el tipo de dato
function getValueType(value) {
    if (value === null) return 'null';
    if (typeof value === 'string') return 'text';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'boolean') return 'boolean';
    if (value instanceof Date) return 'timestamp';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'object') return 'json';
    return 'unknown';
}

// Función para obtener estadísticas básicas de la tabla
async function getTableStats(tableName, sampleData) {
    const stats = {};

    try {
        // Para tablas con montos, obtener totales
        if (tableName === 'invoices' || tableName === 'discrepancy_costs') {
            const { data: sumData } = await supabase
                .from(tableName)
                .select('total_amount, amount')
                .limit(100);

            if (sumData && sumData.length > 0) {
                const amounts = sumData.map(r => r.total_amount || r.amount || 0).filter(v => v > 0);
                if (amounts.length > 0) {
                    stats.total_amount = amounts.reduce((a, b) => a + b, 0);
                    stats.average_amount = stats.total_amount / amounts.length;
                    stats.max_amount = Math.max(...amounts);
                    stats.min_amount = Math.min(...amounts);
                }
            }
        }

        // Para tablas con fechas, obtener rango
        if (sampleData && sampleData.length > 0) {
            const dateFields = Object.keys(sampleData[0]).filter(key =>
                key.includes('date') || key.includes('at') || key.includes('time')
            );

            for (const field of dateFields) {
                const dates = sampleData
                    .map(r => r[field])
                    .filter(v => v !== null && v !== undefined);

                if (dates.length > 0) {
                    stats[`${field}_range`] = {
                        sample_values: dates.slice(0, 3)
                    };
                }
            }
        }

        // Para tablas con categorías, obtener distribución
        if (tableName === 'discrepancies') {
            const { data: categoryData } = await supabase
                .from(tableName)
                .select('category, priority')
                .limit(100);

            if (categoryData && categoryData.length > 0) {
                const categories = {};
                const priorities = {};

                categoryData.forEach(row => {
                    if (row.category) categories[row.category] = (categories[row.category] || 0) + 1;
                    if (row.priority) priorities[row.priority] = (priorities[row.priority] || 0) + 1;
                });

                stats.category_distribution = categories;
                stats.priority_distribution = priorities;
            }
        }

    } catch (error) {
        console.warn(`⚠️  Error obteniendo estadísticas para ${tableName}:`, error.message);
    }

    return stats;
}

// Función para analizar relaciones entre tablas
async function analyzeRelationships() {
    console.log('\n🔗 ANALIZANDO RELACIONES ENTRE TABLAS');
    console.log('='.repeat(50));

    const relationships = [];

    // Relación invoices -> discrepancies
    try {
        const { data: invoicesData } = await supabase
            .from('invoices')
            .select('id, invoice_number')
            .limit(10);

        if (invoicesData && invoicesData.length > 0) {
            const invoiceIds = invoicesData.map(i => i.id);
            const { data: discrepanciesData } = await supabase
                .from('discrepancies')
                .select('invoice_id, COUNT(*) as count')
                .in('invoice_id', invoiceIds)
                .group('invoice_id');

            relationships.push({
                from: 'invoices',
                to: 'discrepancies',
                type: 'one-to-many',
                sample_records: discrepanciesData || []
            });
        }
    } catch (error) {
        console.warn('⚠️  Error analizando relación invoices->discrepancies:', error.message);
    }

    // Relación discrepancies -> discrepancy_costs
    try {
        const { data: discrepanciesData } = await supabase
            .from('discrepancies')
            .select('id, description')
            .limit(10);

        if (discrepanciesData && discrepanciesData.length > 0) {
            const discrepancyIds = discrepanciesData.map(d => d.id);
            const { data: costsData } = await supabase
                .from('discrepancy_costs')
                .select('discrepancy_id, COUNT(*) as count')
                .in('discrepancy_id', discrepancyIds)
                .group('discrepancy_id');

            relationships.push({
                from: 'discrepancies',
                to: 'discrepancy_costs',
                type: 'one-to-many',
                sample_records: costsData || []
            });
        }
    } catch (error) {
        console.warn('⚠️  Error analizando relación discrepancies->discrepancy_costs:', error.message);
    }

    return relationships;
}

// Función principal de análisis
async function main() {
    console.log('🚀 INICIANDO ANÁLISIS DE TABLAS DE MANTENIMIENTO');
    console.log('Proyecto: ORION OCG - Aviation Maintenance Suite');
    console.log('Fecha: ' + new Date().toISOString());
    console.log('='.repeat(60));

    const analysis = {
        project_info: {
            name: 'ORION OCG - Aviation Maintenance Suite',
            analysis_date: new Date().toISOString(),
            supabase_project: 'vvazmdauzaexknybbnfc'
        },
        tables: {},
        relationships: [],
        summary: {}
    };

    // Analizar cada tabla
    for (const tableName of targetTables) {
        const tableInfo = await getTableInfo(tableName);
        if (tableInfo) {
            analysis.tables[tableName] = tableInfo;
        }
    }

    // Analizar relaciones
    analysis.relationships = await analyzeRelationships();

    // Generar resumen
    const tablesWithData = Object.values(analysis.tables).filter(t => t.has_data).length;
    const totalRecords = Object.values(analysis.tables).reduce((sum, t) => sum + (t.record_count || 0), 0);

    analysis.summary = {
        total_tables_analyzed: Object.keys(analysis.tables).length,
        tables_with_data: tablesWithData,
        tables_empty: Object.keys(analysis.tables).length - tablesWithData,
        total_records: totalRecords,
        database_status: tablesWithData > 0 ? 'ACTIVE' : 'EMPTY',
        data_quality_score: calculateDataQualityScore(analysis.tables)
    };

    // Mostrar resultados
    console.log('\n📋 RESUMEN DEL ANÁLISIS');
    console.log('='.repeat(50));
    console.log(`Tablas analizadas: ${analysis.summary.total_tables_analyzed}`);
    console.log(`Tablas con datos: ${analysis.summary.tables_with_data}`);
    console.log(`Tablas vacías: ${analysis.summary.tables_empty}`);
    console.log(`Total registros: ${analysis.summary.total_records}`);
    console.log(`Estado de la base de datos: ${analysis.summary.database_status}`);
    console.log(`Calidad de datos: ${analysis.summary.data_quality_score}/100`);

    // Guardar análisis completo en archivo
    const analysisFileName = `maintenance-analysis-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(
        analysisFileName,
        JSON.stringify(analysis, null, 2)
    );

    console.log(`\n💾 Análisis completo guardado en: ${analysisFileName}`);

    return analysis;
}

// Función para calcular calidad de datos
function calculateDataQualityScore(tables) {
    let score = 0;
    let maxScore = 0;

    Object.values(tables).forEach(table => {
        maxScore += 20; // Máximo 20 puntos por tabla

        // Puntos por tener datos
        if (table.has_data) score += 10;

        // Puntos por estructura completa
        if (table.columns && table.columns.length > 3) score += 5;

        // Puntos por datos de muestra válidos
        if (table.sample_data && table.sample_data.length > 0) {
            const validRecords = table.sample_data.filter(record =>
                Object.keys(record).some(key => record[key] !== null && record[key] !== '')
            ).length;
            score += (validRecords / table.sample_data.length) * 5;
        }
    });

    return Math.round((score / maxScore) * 100);
}

// Ejecutar análisis
main().catch(console.error);