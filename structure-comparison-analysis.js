// ================================================================
// COMPARACIÓN: ESTRUCTURA ESPERADA vs ESTRUCTURA REAL
// ORION OCG - AVIATION MAINTENANCE SUITE
// ================================================================

import fs from 'fs';

// Estructura esperada según la migración y tipos TypeScript
const expectedStructure = {
    dim_cost_category: {
        expected_columns: [
            'id', 'code', 'display_name', 'description', 'created_at', 'updated_at'
        ],
        expected_categories: ['labor', 'parts', 'services', 'freight']
    },
    parts: {
        expected_columns: [
            'id', 'part_number', 'manufacturer', 'description', 'ata_chapter',
            'ata_code', 'uom', 'is_airworthy', 'shelf_life_months', 'created_at', 'updated_at'
        ],
        expected_unique_constraint: ['part_number', 'manufacturer']
    },
    invoices: {
        expected_columns: [
            'id', 'invoice_number', 'work_order_number', 'po_number', 'invoice_date',
            'due_date', 'currency_code', 'exchange_rate', 'reported_total', 'calculated_total',
            'vendor_name', 'vendor_address', 'vendor_phone', 'vendor_faa_certificate',
            'aircraft_registration', 'aircraft_hours_total', 'aircraft_cycles_total',
            'service_location', 'technician_name', 'inspector_name', 'status',
            'processing_method', 'file_path', 'file_size_bytes', 'file_page_count',
            'extracted_at', 'processed_at', 'created_at', 'updated_at'
        ],
        expected_statuses: ['PENDING', 'PROCESSING', 'COMPLETED', 'REVIEWED', 'APPROVED'],
        expected_methods: ['N8N', 'MANUAL', 'LEGACY']
    },
    discrepancies: {
        expected_columns: [
            'id', 'invoice_id', 'item_number', 'description', 'ata_code', 'ata_chapter',
            'regulatory_code', 'compliance_notes', 'action_taken', 'priority', 'category',
            'estimated_hours', 'actual_hours', 'completion_date', 'created_at', 'updated_at'
        ],
        expected_priorities: ['LOW', 'NORMAL', 'HIGH', 'URGENT'],
        expected_categories: ['SCHEDULED', 'UNSCHEDULED', 'INSPECTION', 'REPAIR', 'MODIFICATION', 'OVERHAUL']
    },
    discrepancy_costs: {
        expected_columns: [
            'id', 'discrepancy_id', 'cost_category_id', 'amount', 'unit_price',
            'quantity', 'labor_rate', 'labor_hours', 'notes', 'created_at'
        ]
    },
    discrepancy_parts: {
        expected_columns: [
            'id', 'discrepancy_id', 'part_id', 'item_ref', 'quantity', 'unit_price',
            'line_total', 'serial_number', 'batch_number', 'expiration_date',
            'condition_check', 'airworthiness_cert', 'created_at', 'updated_at'
        ]
    }
};

// Estructura real encontrada
const actualStructure = {
    dim_cost_category: {
        actual_columns: ['id', 'code', 'display_name', 'name'],
        record_count: 4,
        categories_found: ['labor', 'parts', 'services', 'freight']
    },
    parts: {
        actual_columns: ['id', 'part_number', 'description', 'uom', 'created_at', 'updated_at'],
        record_count: 258,
        missing_columns: ['manufacturer', 'ata_chapter', 'ata_code', 'is_airworthy', 'shelf_life_months']
    },
    invoices: {
        actual_columns: ['id', 'invoice_number', 'work_order_number', 'invoice_date', 'currency_code', 'reported_total', 'created_at', 'updated_at'],
        record_count: 1,
        missing_columns: [
            'po_number', 'due_date', 'exchange_rate', 'calculated_total', 'vendor_name',
            'vendor_address', 'vendor_phone', 'vendor_faa_certificate', 'aircraft_registration',
            'aircraft_hours_total', 'aircraft_cycles_total', 'service_location', 'technician_name',
            'inspector_name', 'status', 'processing_method', 'file_path', 'file_size_bytes',
            'file_page_count', 'extracted_at', 'processed_at'
        ]
    },
    discrepancies: {
        actual_columns: ['id', 'invoice_id', 'item_number', 'description', 'ata_code', 'ata_chapter', 'regulatory_code', 'notes', 'created_at', 'updated_at'],
        record_count: 274,
        missing_columns: ['compliance_notes', 'action_taken', 'priority', 'category', 'estimated_hours', 'actual_hours', 'completion_date']
    },
    discrepancy_costs: {
        actual_columns: ['id', 'discrepancy_id', 'cost_category_id', 'amount'],
        record_count: 282,
        missing_columns: ['unit_price', 'quantity', 'labor_rate', 'labor_hours', 'notes']
    },
    discrepancy_parts: {
        actual_columns: [],
        record_count: 0,
        missing_columns: ['id', 'discrepancy_id', 'part_id', 'item_ref', 'quantity', 'unit_price', 'line_total', 'serial_number', 'batch_number', 'expiration_date', 'condition_check', 'airworthiness_cert', 'created_at', 'updated_at']
    }
};

function generateComparisonReport() {
    console.log('🔍 ANÁLISIS COMPARATIVO: ESTRUCTURA ESPERADA vs REAL');
    console.log('='.repeat(60));
    console.log('Proyecto: ORION OCG - Aviation Maintenance Suite');
    console.log('Fecha: ' + new Date().toISOString());
    console.log('='.repeat(60));

    const report = {
        analysis_date: new Date().toISOString(),
        project: 'ORION OCG - Aviation Maintenance Suite',
        comparison_summary: {},
        detailed_analysis: {},
        recommendations: [],
        critical_issues: [],
        compatibility_score: 0
    };

    let total_columns_expected = 0;
    let total_columns_found = 0;
    let critical_columns_missing = 0;

    // Análisis por tabla
    Object.keys(expectedStructure).forEach(tableName => {
        console.log(`\n📊 ANÁLISIS DE TABLA: ${tableName.toUpperCase()}`);
        console.log('='.repeat(40));

        const expected = expectedStructure[tableName];
        const actual = actualStructure[tableName];

        const comparison = {
            table_name: tableName,
            expected_columns: expected.expected_columns.length,
            actual_columns: actual.actual_columns.length,
            missing_columns: actual.missing_columns || [],
            column_coverage_percent: Math.round((actual.actual_columns.length / expected.expected_columns.length) * 100),
            has_data: actual.record_count > 0,
            record_count: actual.record_count,
            issues: [],
            warnings: []
        };

        total_columns_expected += expected.expected_columns.length;
        total_columns_found += actual.actual_columns.length;

        // Análisis de columnas faltantes
        if (actual.missing_columns && actual.missing_columns.length > 0) {
            console.log(`❌ Columnas faltantes (${actual.missing_columns.length}):`);
            actual.missing_columns.forEach(col => {
                console.log(`   - ${col}`);

                // Evaluar criticidad de la columna faltante
                const isCritical = isColumnCritical(tableName, col);
                if (isCritical) {
                    critical_columns_missing++;
                    comparison.issues.push(`Columna crítica faltante: ${col}`);
                }
            });
        }

        // Verificar cobertura mínima
        if (comparison.column_coverage_percent < 50) {
            comparison.issues.push(`Cobertura de columnas muy baja (${comparison.column_coverage_percent}%)`);
        }

        // Verificar datos
        if (!comparison.has_data && tableName !== 'discrepancy_parts') {
            comparison.warnings.push(`Tabla sin datos (${actual.record_count} registros)`);
        }

        // Análisis específico por tabla
        switch (tableName) {
            case 'dim_cost_category':
                // Verificar categorías
                if (actual.categories_found && actual.categories_found.length === expected.expected_categories.length) {
                    console.log('✅ Categorías de costo completas');
                } else {
                    comparison.issues.push('Categorías de costo incompletas');
                }
                break;

            case 'invoices':
                // Verificar campos críticos para facturas
                const criticalInvoiceFields = ['vendor_name', 'status', 'aircraft_registration'];
                const missingCritical = criticalInvoiceFields.filter(field => actual.missing_columns.includes(field));
                if (missingCritical.length > 0) {
                    comparison.issues.push(`Campos críticos faltantes en facturas: ${missingCritical.join(', ')}`);
                }
                break;

            case 'discrepancies':
                // Verificar campos de auditoría
                const auditFields = ['priority', 'category', 'estimated_hours', 'actual_hours'];
                const missingAudit = auditFields.filter(field => actual.missing_columns.includes(field));
                if (missingAudit.length > 0) {
                    comparison.issues.push(`Campos de auditoría faltantes: ${missingAudit.join(', ')}`);
                }
                break;

            case 'discrepancy_parts':
                if (actual.record_count === 0) {
                    comparison.warnings.push('Tabla de partes por discrepancia vacía - posible falta de implementación');
                }
                break;
        }

        // Mostrar resumen de la tabla
        console.log(`📋 Resumen:`);
        console.log(`   Columnas esperadas: ${comparison.expected_columns}`);
        console.log(`   Columnas reales: ${comparison.actual_columns}`);
        console.log(`   Cobertura: ${comparison.column_coverage_percent}%`);
        console.log(`   Registros: ${comparison.record_count}`);
        console.log(`   Estado: ${comparison.issues.length > 0 ? '❌ CON ERRORES' : comparison.warnings.length > 0 ? '⚠️  CON ADVERTENCIAS' : '✅ OK'}`);

        if (comparison.issues.length > 0) {
            console.log(`   Errores: ${comparison.issues.length}`);
        }

        report.detailed_analysis[tableName] = comparison;
    });

    // Calcular puntuación de compatibilidad
    const compatibilityScore = Math.round((total_columns_found / total_columns_expected) * 100 - (critical_columns_missing * 5));
    report.compatibility_score = Math.max(0, compatibilityScore);

    // Resumen general
    console.log('\n📋 RESUMEN GENERAL');
    console.log('='.repeat(50));
    console.log(`📊 Columnas totales esperadas: ${total_columns_expected}`);
    console.log(`📊 Columnas totales encontradas: ${total_columns_found}`);
    console.log(`📊 Cobertura general: ${Math.round((total_columns_found / total_columns_expected) * 100)}%`);
    console.log(`🚨 Columnas críticas faltantes: ${critical_columns_missing}`);
    console.log(`📈 Puntuación de compatibilidad: ${report.compatibility_score}/100`);

    // Generar recomendaciones
    report.recommendations = generateRecommendations(report.detailed_analysis);
    report.critical_issues = generateCriticalIssues(report.detailed_analysis);

    console.log('\n💡 RECOMENDACIONES');
    console.log('='.repeat(30));
    report.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
    });

    console.log('\n🚨 INCIDENCIAS CRÍTICAS');
    console.log('='.repeat(30));
    if (report.critical_issues.length > 0) {
        report.critical_issues.forEach((issue, index) => {
            console.log(`${index + 1}. ${issue}`);
        });
    } else {
        console.log('✅ No se encontraron incidencias críticas');
    }

    // Guardar reporte
    const reportFile = `structure-comparison-${new Date().toISOString().split('T')[0]}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));

    console.log(`\n💾 Reporte de comparación guardado en: ${reportFile}`);

    return report;
}

function isColumnCritical(tableName, columnName) {
    const criticalColumns = {
        invoices: ['invoice_number', 'work_order_number', 'invoice_date', 'vendor_name', 'status'],
        discrepancies: ['invoice_id', 'item_number', 'description', 'priority', 'category'],
        discrepancy_costs: ['discrepancy_id', 'cost_category_id', 'amount'],
        parts: ['part_number'],
        dim_cost_category: ['code', 'display_name']
    };

    return criticalColumns[tableName]?.includes(columnName) || false;
}

function generateRecommendations(detailedAnalysis) {
    const recommendations = [];

    // Recomendaciones basadas en el análisis
    Object.entries(detailedAnalysis).forEach(([tableName, analysis]) => {
        if (analysis.column_coverage_percent < 70) {
            recommendations.push(`Ejecutar migración completa para la tabla ${tableName} - cobertura del ${analysis.column_coverage_percent}%`);
        }

        if (analysis.missing_columns && analysis.missing_columns.length > 0) {
            const critical = analysis.missing_columns.filter(col => isColumnCritical(tableName, col));
            if (critical.length > 0) {
                recommendations.push(`Agregar columnas críticas a ${tableName}: ${critical.join(', ')}`);
            }
        }

        if (tableName === 'invoices' && analysis.record_count === 0) {
            recommendations.push('Importar datos de facturas para tener casos de prueba reales');
        }

        if (tableName === 'discrepancy_parts' && analysis.record_count === 0) {
            recommendations.push('Implementar lógica para vincular partes con discrepancias');
        }
    });

    // Recomendaciones generales
    recommendations.push('Actualizar la aplicación React para trabajar con la estructura real de la base de datos');
    recommendations.push('Crear vista de compatibilidad para mapear entre estructura esperada y real');
    recommendations.push('Documentar las diferencias entre el diseño y la implementación real');

    return recommendations;
}

function generateCriticalIssues(detailedAnalysis) {
    const criticalIssues = [];

    Object.entries(detailedAnalysis).forEach(([tableName, analysis]) => {
        if (analysis.issues && analysis.issues.length > 0) {
            analysis.issues.forEach(issue => {
                if (issue.includes('crítica') || issue.includes('críticos')) {
                    criticalIssues.push(`${tableName}: ${issue}`);
                }
            });
        }

        if (tableName === 'invoices' && analysis.record_count === 0) {
            criticalIssues.push(`${tableName}: Sin datos de facturas - imposible probar el sistema`);
        }
    });

    return criticalIssues;
}

// Ejecutar análisis
const report = generateComparisonReport();
export default report;