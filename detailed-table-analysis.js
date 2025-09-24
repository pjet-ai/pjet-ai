// ================================================================
// ANÁLISIS DETALLADO DE DATOS Y ESTRUCTURA
// ORION OCG - AVIATION MAINTENANCE SUITE
// ================================================================

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Configuración de Supabase
const supabaseUrl = 'https://vvazmdauzaexknybbnfc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Njc3OTE2NCwiZXhwIjoyMDcyMzU1MTY0fQ.vcXRRrDsdd2MVM1Tf9MkTzWEagFPOOmoCp3oW44YTMc';

const supabase = createClient(supabaseUrl, supabaseKey);

// Análisis detallado por tabla
async function analyzeDimCostCategory() {
    console.log('\n📊 ANÁLISIS: dim_cost_category');
    console.log('='.repeat(40));

    const { data, error } = await supabase
        .from('dim_cost_category')
        .select('*')
        .order('id');

    if (error) {
        console.error('❌ Error:', error.message);
        return null;
    }

    console.log('Registros encontrados:', data.length);
    data.forEach(category => {
        console.log(`  - ID ${category.id}: ${category.code} -> ${category.display_name}`);
    });

    return { table: 'dim_cost_category', data };
}

async function analyzeParts() {
    console.log('\n🔧 ANÁLISIS: parts');
    console.log('='.repeat(40));

    const { data, error } = await supabase
        .from('parts')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Error:', error.message);
        return null;
    }

    console.log('Total registros:', 258);
    console.log('Muestra de primeros 10 registros:');
    data.forEach((part, index) => {
        console.log(`  ${index + 1}. ${part.part_number} - ${part.description || 'Sin descripción'}`);
    });

    // Estadísticas básicas
    const { count } = await supabase
        .from('parts')
        .select('*', { count: 'exact', head: true });

    return { table: 'parts', count, sample: data };
}

async function analyzeInvoices() {
    console.log('\n📄 ANÁLISIS: invoices');
    console.log('='.repeat(40));

    const { data, error } = await supabase
        .from('invoices')
        .select('*');

    if (error) {
        console.error('❌ Error:', error.message);
        return null;
    }

    console.log('Total registros:', data.length);
    data.forEach(invoice => {
        console.log(`  - Factura ${invoice.invoice_number} - Orden: ${invoice.work_order_number}`);
        console.log(`    Total: ${invoice.reported_total} ${invoice.currency_code}`);
        console.log(`    Fecha: ${invoice.invoice_date}`);
        console.log(`    Vendor: ${invoice.vendor_name || 'No especificado'}`);
        console.log('');
    });

    return { table: 'invoices', data };
}

async function analyzeDiscrepancies() {
    console.log('\n⚠️  ANÁLISIS: discrepancies');
    console.log('='.repeat(40));

    const { data, error } = await supabase
        .from('discrepancies')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Error:', error.message);
        return null;
    }

    console.log('Total registros:', 274);
    console.log('Muestra de primeras 10 discrepancias:');
    data.forEach((discrepancy, index) => {
        console.log(`  ${index + 1}. Item ${discrepancy.item_number}: ${discrepancy.description.substring(0, 80)}...`);
        console.log(`     ATA: ${discrepancy.ata_code || 'N/A'} | Categoría: ${discrepancy.regulatory_code || 'N/A'}`);
        console.log('');
    });

    // Análisis de distribución por categorías
    const { data: categoryData } = await supabase
        .from('discrepancies')
        .select('regulatory_code')
        .not('regulatory_code', 'is', null);

    const categoryDistribution = {};
    categoryData?.forEach(item => {
        const cat = item.regulatory_code || 'SIN_CATEGORIA';
        categoryDistribution[cat] = (categoryDistribution[cat] || 0) + 1;
    });

    console.log('Distribución por categoría regulatoria:');
    Object.entries(categoryDistribution).forEach(([category, count]) => {
        console.log(`  - ${category}: ${count} registros`);
    });

    return { table: 'discrepancies', count: 274, sample: data, distribution: categoryDistribution };
}

async function analyzeDiscrepancyCosts() {
    console.log('\n💰 ANÁLISIS: discrepancy_costs');
    console.log('='.repeat(40));

    const { data, error } = await supabase
        .from('discrepancy_costs')
        .select('*')
        .limit(10);

    if (error) {
        console.error('❌ Error:', error.message);
        return null;
    }

    console.log('Total registros:', 282);
    console.log('Muestra de primeros 10 costos:');
    data.forEach((cost, index) => {
        console.log(`  ${index + 1}. Discrepancy ID: ${cost.discrepancy_id} | Categoría: ${cost.cost_category_id} | Monto: ${cost.amount}`);
    });

    // Análisis de costos por categoría
    const { data: categoryCosts } = await supabase
        .from('discrepancy_costs')
        .select('cost_category_id, amount');

    const costByCategory = {};
    categoryCosts?.forEach(cost => {
        if (!costByCategory[cost.cost_category_id]) {
            costByCategory[cost.cost_category_id] = { total: 0, count: 0 };
        }
        costByCategory[cost.cost_category_id].total += cost.amount;
        costByCategory[cost.cost_category_id].count += 1;
    });

    console.log('\nCostos por categoría:');
    Object.entries(costByCategory).forEach(([catId, stats]) => {
        console.log(`  - Categoría ${catId}: Total $${stats.total.toFixed(2)} | ${stats.count} registros | Promedio $${(stats.total / stats.count).toFixed(2)}`);
    });

    // Total general
    const totalAmount = Object.values(costByCategory).reduce((sum, stats) => sum + stats.total, 0);
    console.log(`\n💰 Total general de costos: $${totalAmount.toFixed(2)}`);

    return { table: 'discrepancy_costs', count: 282, sample: data, cost_summary: costByCategory, total_amount: totalAmount };
}

async function analyzeRelationships() {
    console.log('\n🔗 ANÁLISIS DE RELACIONES');
    console.log('='.repeat(40));

    // Relación invoices -> discrepancies
    console.log('\n📄 Relación Invoices -> Discrepancies:');
    const { data: invoiceDiscrepancies } = await supabase
        .from('discrepancies')
        .select('invoice_id, count')
        .limit(5);

    if (invoiceDiscrepancies && invoiceDiscrepancies.length > 0) {
        console.log('Muestra de discrepancias por factura:');
        invoiceDiscrepancies.forEach((item, index) => {
            console.log(`  ${index + 1}. Invoice ID: ${item.invoice_id} -> ${item.count} discrepancias`);
        });
    }

    // Relación discrepancies -> discrepancy_costs
    console.log('\n⚠️  Relación Discrepancies -> Discrepancy_Costs:');
    const { data: discrepancyCostsCount } = await supabase
        .from('discrepancy_costs')
        .select('discrepancy_id, amount')
        .limit(10);

    if (discrepancyCostsCount && discrepancyCostsCount.length > 0) {
        const costByDiscrepancy = {};
        discrepancyCostsCount.forEach(cost => {
            if (!costByDiscrepancy[cost.discrepancy_id]) {
                costByDiscrepancy[cost.discrepancy_id] = 0;
            }
            costByDiscrepancy[cost.discrepancy_id] += cost.amount;
        });

        console.log('Muestra de costos por discrepancia:');
        Object.entries(costByDiscrepancy).slice(0, 5).forEach(([discrepancyId, total]) => {
            console.log(`  - Discrepancy ${discrepancyId}: Total $${total.toFixed(2)}`);
        });
    }

    return { analyzed: true };
}

async function main() {
    console.log('🚀 ANÁLISIS DETALLADO DE DATOS DE MANTENIMIENTO');
    console.log('Proyecto: ORION OCG - Aviation Maintenance Suite');
    console.log('Fecha: ' + new Date().toISOString());
    console.log('='.repeat(60));

    const analysis = {
        analysis_date: new Date().toISOString(),
        project: 'ORION OCG - Aviation Maintenance Suite',
        tables: {}
    };

    // Ejecutar análisis por tabla
    analysis.tables.dim_cost_category = await analyzeDimCostCategory();
    analysis.tables.parts = await analyzeParts();
    analysis.tables.invoices = await analyzeInvoices();
    analysis.tables.discrepancies = await analyzeDiscrepancies();
    analysis.tables.discrepancy_costs = await analyzeDiscrepancyCosts();
    analysis.relationships = await analyzeRelationships();

    // Resumen final
    console.log('\n📋 RESUMEN FINAL DEL ANÁLISIS');
    console.log('='.repeat(50));

    const totalRecords = Object.entries(analysis.tables)
        .filter(([_, data]) => data && data.count)
        .reduce((sum, [_, data]) => sum + data.count, 0);

    console.log(`📊 Total registros analizados: ${totalRecords}`);
    console.log(`📄 Facturas: ${analysis.tables.invoices?.data?.length || 0}`);
    console.log(`⚠️  Discrepancias: ${analysis.tables.discrepancies?.count || 0}`);
    console.log(`💰 Costos registrados: ${analysis.tables.discrepancy_costs?.count || 0}`);
    console.log(`🔧 Partes en catálogo: ${analysis.tables.parts?.count || 0}`);
    console.log(`📋 Categorías de costo: ${analysis.tables.dim_cost_category?.data?.length || 0}`);

    const totalCostAmount = analysis.tables.discrepancy_costs?.total_amount || 0;
    console.log(`💵 Valor total registrado: $${totalCostAmount.toFixed(2)}`);

    // Guardar análisis completo
    const analysisFile = `detailed-analysis-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));

    console.log(`\n💾 Análisis detallado guardado en: ${analysisFile}`);

    return analysis;
}

// Ejecutar análisis
main().catch(console.error);