// 🔍 SCHEMA VALIDATOR - Validación de Estructuras de Datos
// Identifica inconsistencias entre fases del pipeline

class SchemaValidator {
  constructor() {
    this.schemas = {
      // Schema esperado por extract-maintenance-data (OUTPUT)
      extractedData: {
        required: ['vendor_name', 'total_amount', 'currency', 'invoice_date'],
        optional: ['invoice_number', 'work_description', 'aircraft_registration', 'maintenance_category', 'financial_breakdown', 'parts_list'],
        types: {
          vendor_name: 'string',
          total_amount: 'number',
          currency: 'string',
          invoice_date: 'string',
          invoice_number: 'string',
          work_description: 'string',
          aircraft_registration: 'string',
          maintenance_category: 'string',
          financial_breakdown: 'array',
          parts_list: 'array'
        },
        nested: {
          financial_breakdown: {
            required: ['category', 'amount'],
            optional: ['description'],
            types: {
              category: 'string',
              amount: 'number',
              description: 'string'
            }
          },
          parts_list: {
            required: ['part_number', 'part_description'],
            optional: ['manufacturer', 'quantity', 'unit_price', 'total_price', 'part_category'],
            types: {
              part_number: 'string',
              part_description: 'string',
              manufacturer: 'string',
              quantity: 'number',
              unit_price: 'number',
              total_price: 'number',
              part_category: 'string'
            }
          }
        }
      },

      // Schema esperado por save-maintenance-record (INPUT)
      saveRecordInput: {
        required: ['extractedData'],
        optional: ['originalFile'],
        types: {
          extractedData: 'object',
          originalFile: ['object', 'null', 'undefined']
        },
        nested: {
          extractedData: {
            required: ['vendor', 'total', 'date'],
            optional: ['invoice_number', 'work_description', 'aircraft_registration', 'maintenance_category', 'financial_breakdown', 'parts', 'currency', 'labor_total', 'parts_total'],
            types: {
              vendor: 'string',
              total: 'number',
              date: 'string',
              invoice_number: 'string',
              work_description: 'string',
              aircraft_registration: 'string',
              maintenance_category: 'string',
              currency: 'string',
              labor_total: 'number',
              parts_total: 'number',
              financial_breakdown: 'object',
              parts: 'array'
            }
          }
        }
      },

      // Schema de base de datos maintenance_records
      databaseRecord: {
        required: ['user_id', 'date', 'vendor', 'total'],
        optional: ['currency', 'status', 'invoice_number', 'work_description', 'aircraft_registration', 'maintenance_category', 'work_order_number', 'technician_name', 'location', 'labor_hours', 'labor_total', 'parts_total', 'subtotal', 'tax_total', 'compliance_reference'],
        types: {
          user_id: 'string',
          date: 'string',
          vendor: 'string', 
          total: 'number',
          currency: 'string',
          status: 'string',
          invoice_number: 'string',
          work_description: 'string',
          aircraft_registration: 'string',
          maintenance_category: 'string'
        }
      }
    };
  }

  // Valida un objeto contra un schema específico
  validate(data, schemaName) {
    console.log(`🔍 Schema Validator: Validating against '${schemaName}' schema`);
    
    if (!this.schemas[schemaName]) {
      return {
        valid: false,
        errors: [`Unknown schema: ${schemaName}`]
      };
    }

    const schema = this.schemas[schemaName];
    const errors = [];
    const warnings = [];

    // Validar campos requeridos
    for (const requiredField of schema.required) {
      if (!data || data[requiredField] === undefined || data[requiredField] === null) {
        errors.push(`Missing required field: ${requiredField}`);
      }
    }

    // Validar tipos de datos
    if (data) {
      for (const [field, expectedType] of Object.entries(schema.types || {})) {
        if (data[field] !== undefined && data[field] !== null) {
          if (!this.validateType(data[field], expectedType)) {
            errors.push(`Invalid type for field '${field}': expected ${expectedType}, got ${typeof data[field]}`);
          }
        }
      }

      // Validar schemas anidados
      if (schema.nested) {
        for (const [field, nestedSchema] of Object.entries(schema.nested)) {
          if (data[field]) {
            if (Array.isArray(data[field])) {
              data[field].forEach((item, index) => {
                const nestedResult = this.validateNested(item, nestedSchema, `${field}[${index}]`);
                errors.push(...nestedResult.errors);
                warnings.push(...nestedResult.warnings);
              });
            } else if (typeof data[field] === 'object') {
              const nestedResult = this.validateNested(data[field], nestedSchema, field);
              errors.push(...nestedResult.errors);
              warnings.push(...nestedResult.warnings);
            }
          }
        }
      }

      // Detectar campos extra (warnings)
      const allValidFields = [...schema.required, ...(schema.optional || [])];
      for (const field of Object.keys(data)) {
        if (!allValidFields.includes(field)) {
          warnings.push(`Unexpected field: ${field}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalFields: data ? Object.keys(data).length : 0,
        requiredFieldsPresent: schema.required.filter(field => data && data[field] !== undefined).length,
        requiredFieldsTotal: schema.required.length,
        hasWarnings: warnings.length > 0
      }
    };
  }

  // Valida schema anidado
  validateNested(data, nestedSchema, fieldPath) {
    const errors = [];
    const warnings = [];

    // Validar campos requeridos del objeto anidado
    for (const requiredField of nestedSchema.required || []) {
      if (!data || data[requiredField] === undefined || data[requiredField] === null) {
        errors.push(`Missing required nested field: ${fieldPath}.${requiredField}`);
      }
    }

    // Validar tipos en objeto anidado
    if (data && nestedSchema.types) {
      for (const [field, expectedType] of Object.entries(nestedSchema.types)) {
        if (data[field] !== undefined && data[field] !== null) {
          if (!this.validateType(data[field], expectedType)) {
            errors.push(`Invalid type for nested field '${fieldPath}.${field}': expected ${expectedType}, got ${typeof data[field]}`);
          }
        }
      }
    }

    return { errors, warnings };
  }

  // Valida tipo específico (incluyendo arrays de tipos permitidos)
  validateType(value, expectedType) {
    if (Array.isArray(expectedType)) {
      return expectedType.some(type => this.validateSingleType(value, type));
    }
    return this.validateSingleType(value, expectedType);
  }

  // Valida un solo tipo
  validateSingleType(value, expectedType) {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'null':
        return value === null;
      case 'undefined':
        return value === undefined;
      default:
        return false;
    }
  }

  // Identifica transformaciones necesarias entre schemas
  compareSchemas(sourceData, sourceSchema, targetSchema) {
    console.log(`🔄 Schema Validator: Comparing '${sourceSchema}' → '${targetSchema}'`);
    
    const sourceValidation = this.validate(sourceData, sourceSchema);
    const transformations = [];
    const issues = [];

    const source = this.schemas[sourceSchema];
    const target = this.schemas[targetSchema];

    if (!source || !target) {
      return {
        transformations: [],
        issues: ['One or both schemas not found'],
        canTransform: false
      };
    }

    // Identificar campos que necesitan mapeo
    for (const targetField of target.required) {
      const sourceEquivalent = this.findEquivalentField(targetField, source);
      
      if (sourceEquivalent) {
        if (sourceEquivalent !== targetField) {
          transformations.push({
            type: 'rename',
            from: sourceEquivalent,
            to: targetField,
            reason: 'Field name mapping required'
          });
        }
      } else {
        issues.push({
          type: 'missing_mapping',
          field: targetField,
          severity: 'error',
          reason: `Required target field '${targetField}' has no equivalent in source schema`
        });
      }
    }

    return {
      transformations,
      issues,
      canTransform: issues.filter(i => i.severity === 'error').length === 0,
      sourceValidation
    };
  }

  // Encuentra campo equivalente en otro schema
  findEquivalentField(targetField, sourceSchema) {
    // Mapeo de campos conocidos entre schemas
    const fieldMappings = {
      'vendor': 'vendor_name',
      'total': 'total_amount', 
      'date': 'invoice_date',
      'financial_breakdown': 'financial_breakdown',
      'parts': 'parts_list'
    };

    // Buscar mapeo directo
    if (fieldMappings[targetField]) {
      return fieldMappings[targetField];
    }

    // Buscar mapeo inverso
    for (const [key, value] of Object.entries(fieldMappings)) {
      if (value === targetField && sourceSchema.required.includes(key)) {
        return key;
      }
    }

    // Buscar coincidencia exacta
    const allSourceFields = [...sourceSchema.required, ...(sourceSchema.optional || [])];
    if (allSourceFields.includes(targetField)) {
      return targetField;
    }

    return null;
  }

  // Genera reporte completo de validación
  generateValidationReport(data, schemaName) {
    const validation = this.validate(data, schemaName);
    
    console.log(`📋 Validation Report for '${schemaName}':`);
    console.log(`   Valid: ${validation.valid ? '✅' : '❌'}`);
    console.log(`   Fields: ${validation.summary.requiredFieldsPresent}/${validation.summary.requiredFieldsTotal} required present`);
    
    if (validation.errors.length > 0) {
      console.log(`   Errors (${validation.errors.length}):`);
      validation.errors.forEach(error => console.log(`     ❌ ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.log(`   Warnings (${validation.warnings.length}):`);
      validation.warnings.forEach(warning => console.log(`     ⚠️ ${warning}`));
    }

    return validation;
  }
}

export default SchemaValidator;