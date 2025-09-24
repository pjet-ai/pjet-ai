// ================================================================
// UTILIDADES PARA SISTEMA DE MANTENIMIENTO N8N INTEGRATION
// ORION OCG - AVIATION MAINTENANCE SUITE v2.0
// ================================================================

import { supabase } from '@/integrations/supabase/client';
import type {
  Invoice,
  InvoiceSummary,
  Discrepancy,
  DiscrepancyCost,
  DiscrepancyPart,
  AviationAudit,
  MaintenanceStats,
  MaintenanceFilters,
  CostCategory,
  Part,
  ApiResponse,
  PaginatedResponse
} from '@/types/maintenance';

// ================================================================
// CONSTANTES Y CONFIGURACIÓN
// ================================================================

const TABLES = {
  INVOICES: 'invoices',
  DISCREPANCIES: 'discrepancies',
  DISCREPANCY_COSTS: 'discrepancy_costs',
  DISCREPANCY_PARTS: 'discrepancy_parts',
  PARTS: 'parts',
  COST_CATEGORIES: 'dim_cost_category',
  INVOICE_SUMMARY: 'invoice_summary_view',
  AVIATION_AUDIT: 'aviation_audit_view'
} as const;

const STATUSES = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  REVIEWED: 'REVIEWED',
  APPROVED: 'APPROVED'
} as const;

const PROCESSING_METHODS = {
  N8N: 'N8N',
  MANUAL: 'MANUAL',
  LEGACY: 'LEGACY'
} as const;

// ================================================================
// API CORE - OPERACIONES PRINCIPALES
// ================================================================

/**
 * Obtener facturas con paginación y filtros - USANDO VISTAS SQL
 */
export const getInvoices = async (
  filters?: MaintenanceFilters,
  pagination = { page: 1, limit: 20 }
): Promise<ApiResponse<PaginatedResponse<InvoiceSummary>>> => {
  try {
    console.log('🔍 DEBUG getInvoices: Starting with filters:', filters);
    console.log('📄 DEBUG getInvoices: Pagination:', pagination);

    // ✅ SOLUCIÓN: Usar vista SQL pre-procesada
    let query = supabase
      .from('maintenance_invoice_summary_view')
      .select('*', { count: 'exact' });

    console.log('⚙️ DEBUG getInvoices: Base query created');

    // Aplicar filtros (adaptados a campos de la vista)
    if (filters?.search) {
      query = query.or(
        `invoice_number.ilike.%${filters.search}%,work_order_number.ilike.%${filters.search}%,vendor_name.ilike.%${filters.search}%`
      );
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    if (filters?.min_amount) {
      query = query.gte('reported_total', filters.min_amount);
    }

    if (filters?.max_amount) {
      query = query.lte('reported_total', filters.max_amount);
    }

    // Paginación y ordenamiento
    const from = (pagination.page - 1) * pagination.limit;
    const to = from + pagination.limit - 1;

    console.log('🚀 DEBUG getInvoices: Executing query with range:', from, 'to', to);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    console.log('📊 DEBUG getInvoices: Query result:', {
      dataLength: data?.length || 0,
      error: error?.message,
      count
    });

    if (error) throw error;

    // ✅ SIMPLIFICACIÓN: Los datos ya vienen transformados de la vista
    // Solo necesitamos asegurarnos de que los campos coincidan con InvoiceSummary
    const transformedData: InvoiceSummary[] = (data || []).map(item => ({
      ...item,
      invoice_date: item.invoice_date || item.created_at, // Usar invoice_date si existe, sino created_at
      po_number: item.po_number || '',
      due_date: item.due_date || '',
      vendor_name: item.vendor_name || 'Unknown Vendor',
      technician_name: item.technician_name || '',
      inspector_name: item.inspector_name || '',
      aircraft_registration: item.aircraft_registration || '',
      service_location: item.service_location || '',
      file_page_count: item.file_page_count || 0,
      file_size_bytes: item.file_size_bytes || 0,
      extracted_at: item.extracted_at || '',
      total_estimated_hours: item.total_actual_hours || 0,
      has_total_discrepancy: item.has_total_discrepancy || false,
      calculated_cost_total: item.calculated_total_cost || 0
    }));

    console.log('✅ DEBUG getInvoices: Returning transformed data:', {
      transformedDataLength: transformedData.length,
      firstItem: transformedData[0],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: count || 0
      }
    });

    return {
      success: true,
      data: {
        data: transformedData,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: count || 0
        }
      }
    };
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return {
      success: false,
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0 }
      },
      error: error instanceof Error ? error.message : 'Failed to fetch invoices'
    };
  }
};

// Funciones helper para procesar datos reales
const extractVendorFromDescription = (description: string): string => {
  // Buscar patrones de vendor en descripciones
  const vendorPatterns = [
    /([A-Z][A-Za-z\s]+Aircraft|Aero\s+[A-Z][A-Za-z\s]+)/i,
    /([A-Z][A-Za-z\s]+Maintenance|Maintenance\s+[A-Z][A-Za-z\s]+)/i,
    /([A-Z][A-Za-z\s]+Aviation|Aviation\s+[A-Z][A-Za-z\s]+)/i
  ];

  for (const pattern of vendorPatterns) {
    const match = description.match(pattern);
    if (match) return match[1].trim();
  }

  return 'Unknown Vendor';
};

const extractAircraftFromDescription = (description: string): string => {
  // Buscar patrones de registro de aeronave
  const aircraftPatterns = [
    /N\d{1,5}/i,  // N12345
    /([A-Z]{2,3}-\d{1,4})/i  // HB-123, G-ABCD
  ];

  for (const pattern of aircraftPatterns) {
    const match = description.match(pattern);
    if (match) return match[0];
  }

  return '';
};

const calculateEstimatedHours = (discrepancyCount: number): number => {
  // Estimación basada en número de discrepancias
  return Math.max(1, discrepancyCount * 2); // Mínimo 1 hora, 2 horas por discrepancia
};

const calculateActualHours = (laborCost: number): number => {
  // Asumir tasa de labor promedio de $100/hora
  return Math.round(laborCost / 100);
};

const calculateProcessingDays = (createdAt: string): number => {
  const created = new Date(createdAt);
  const now = new Date();
  return Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Obtener factura por ID con detalles completos - Adaptado a estructura REAL
 */
export const getInvoiceById = async (id: string): Promise<ApiResponse<Invoice>> => {
  try {
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Obtener discrepancias para extraer información adicional
    const { data: discrepancies } = await supabase
      .from('discrepancies')
      .select('description')
      .eq('invoice_id', id)
      .limit(1);

    // Enriquecer con datos computados
    const enrichedInvoice: Invoice = {
      ...invoice,
      vendor_name: extractVendorFromDescription(discrepancies?.[0]?.description || ''),
      status: 'COMPLETED',
      aircraft_registration: extractAircraftFromDescription(discrepancies?.[0]?.description || ''),
      processing_method: 'N8N'
    };

    return {
      success: true,
      data: enrichedInvoice
    };
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return {
      success: false,
      data: {} as Invoice,
      error: error instanceof Error ? error.message : 'Failed to fetch invoice'
    };
  }
};

/**
 * Obtener discrepancias de una factura
 */
export const getInvoiceDiscrepancies = async (invoiceId: string): Promise<ApiResponse<Discrepancy[]>> => {
  try {
    const { data, error } = await supabase
      .from('discrepancies')
      .select(`
        id,
        invoice_id,
        item_number,
        description,
        ata_code,
        ata_chapter,
        regulatory_code,
        notes,
        created_at,
        updated_at
      `)
      .eq('invoice_id', invoiceId)
      .order('item_number', { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching discrepancies:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch discrepancies'
    };
  }
};

/**
 * Obtener costos de una discrepancia
 */
export const getDiscrepancyCosts = async (discrepancyId: string): Promise<ApiResponse<DiscrepancyCost[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.DISCREPANCY_COSTS)
      .select(`
        *,
        cost_category:dim_cost_category(*)
      `)
      .eq('discrepancy_id', discrepancyId);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching discrepancy costs:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch discrepancy costs'
    };
  }
};

/**
 * Obtener partes utilizadas en una discrepancia
 */
export const getDiscrepancyParts = async (discrepancyId: string): Promise<ApiResponse<DiscrepancyPart[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.DISCREPANCY_PARTS)
      .select(`
        *,
        part:parts(*)
      `)
      .eq('discrepancy_id', discrepancyId);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching discrepancy parts:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch discrepancy parts'
    };
  }
};

// ================================================================
// UPLOAD Y PROCESAMIENTO DE FACTURAS
// ================================================================

/**
 * Subir archivo de factura a Supabase Storage
 */
export const uploadInvoiceFile = async (
  file: File,
  invoiceId: string
): Promise<ApiResponse<{ path: string; url: string }>> => {
  try {
    const fileName = `invoices/${invoiceId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('maintenance-invoices')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) throw error;

    // Obtener URL pública
    const { data: urlData } = supabase.storage
      .from('maintenance-invoices')
      .getPublicUrl(fileName);

    return {
      success: true,
      data: {
        path: data.path,
        url: urlData.publicUrl
      }
    };
  } catch (error) {
    console.error('Error uploading invoice file:', error);
    return {
      success: false,
      data: { path: '', url: '' },
      error: error instanceof Error ? error.message : 'Failed to upload invoice file'
    };
  }
};

/**
 * Crear registro de factura básico (antes de procesamiento n8n)
 */
export const createInvoiceRecord = async (
  invoiceData: Partial<Invoice>
): Promise<ApiResponse<Invoice>> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.INVOICES)
      .insert([{
        ...invoiceData,
        status: STATUSES.PENDING,
        processing_method: PROCESSING_METHODS.N8N,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error creating invoice record:', error);
    return {
      success: false,
      data: {} as Invoice,
      error: error instanceof Error ? error.message : 'Failed to create invoice record'
    };
  }
};

/**
 * Actualizar estado de factura después de procesamiento n8n
 */
export const updateInvoiceProcessingStatus = async (
  invoiceId: string,
  status: string,
  processingData: Partial<Invoice> = {}
): Promise<ApiResponse<Invoice>> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.INVOICES)
      .update({
        status,
        ...processingData,
        processed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .select()
      .single();

    if (error) throw error;

    return {
      success: true,
      data
    };
  } catch (error) {
    console.error('Error updating invoice status:', error);
    return {
      success: false,
      data: {} as Invoice,
      error: error instanceof Error ? error.message : 'Failed to update invoice status'
    };
  }
};

// ================================================================
// ESTADÍSTICAS Y DASHBOARD
// ================================================================

/**
 * Obtener estadísticas generales para dashboard - USANDO VISTAS SQL
 */
export const getMaintenanceStats = async (): Promise<ApiResponse<MaintenanceStats>> => {
  try {
    // ✅ SOLUCIÓN: Usar vista pre-calculada
    const { data: stats, error } = await supabase
      .from('maintenance_stats_view')
      .select('*')
      .single();

    if (error) throw error;

    console.log('🔍 Stats Debug - Vista SQL:', stats);

    // ✅ SIMPLIFICACIÓN: Mapeo directo desde vista
    return {
      success: true,
      data: {
        total_invoices: stats.total_invoices,
        total_amount: stats.total_amount,
        this_month_amount: stats.this_month_amount,
        pending_invoices: stats.pending_invoices,
        processing_invoices: stats.processing_invoices,
        completed_invoices: stats.completed_invoices,
        total_discrepancies: stats.total_discrepancies,
        total_parts_used: stats.total_parts_used,
        total_labor_hours: stats.total_labor_hours,
        average_processing_time_days: 0, // No disponible en vista actual
        cost_variance_percentage: 0 // No disponible en vista actual
      }
    };
  } catch (error) {
    console.error('Error fetching maintenance stats:', error);
    return {
      success: false,
      data: {} as MaintenanceStats,
      error: error instanceof Error ? error.message : 'Failed to fetch maintenance stats'
    };
  }
};

// ================================================================
// AUDITORÍA Y REPORTES
// ================================================================

/**
 * Obtener datos de auditoría de aviación - DATOS INDIVIDUALES DE DISCREPANCIAS
 */
export const getAviationAuditData = async (
  filters?: MaintenanceFilters
): Promise<ApiResponse<AviationAudit[]>> => {
  try {
    console.log('🔍 DEBUG getAviationAuditData: Starting with filters:', filters);

    // ✅ SOLUCIÓN: Obtener datos individuales de discrepancias con información de facturas
    let query = supabase
      .from('discrepancies')
      .select(`
        id,
        invoice_id,
        item_number,
        description,
        ata_code,
        ata_chapter,
        regulatory_code,
        created_at,
        invoice:invoices (
          id,
          invoice_number,
          invoice_date,
          currency_code,
          reported_total,
          created_at,
          updated_at
        )
      `);

    // Aplicar filtros si existen
    if (filters?.search) {
      query = query.or(`
        description.ilike.%${filters.search}%,
        invoice.invoice_number.ilike.%${filters.search}%,
        invoice.vendor_name.ilike.%${filters.search}%,
        invoice.aircraft_registration.ilike.%${filters.search}%
      `);
    }

    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }

    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }

    // Nota: Los filtros por vendor, aircraft y status están deshabilitados temporalmente
    // ya que estos campos no existen en la estructura actual de la tabla invoices

    // Ordenar y ejecutar consulta
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(1000); // Limitar a un número razonable de registros

    if (error) throw error;

    console.log('📊 DEBUG getAviationAuditData: Raw data received:', {
      count: data?.length || 0,
      firstRecord: data?.[0]
    });

    // Transformar datos al formato esperado para auditoría
    const transformedData: AviationAudit[] = (data || []).map(discrepancy => {
      // Extraer información de la factura
      const invoice = discrepancy.invoice;

      return {
        id: discrepancy.id,
        invoice_id: discrepancy.invoice_id,
        invoice_number: invoice?.invoice_number || 'Unknown',
        invoice_date: invoice?.invoice_date || null,
        vendor_name: 'Unknown Vendor', // Este campo no existe en la tabla actual
        aircraft_registration: 'Unknown Aircraft', // Este campo no existe en la tabla actual
        discrepancy_description: discrepancy.description,
        ata_code: discrepancy.ata_code || discrepancy.ata_chapter?.toString() || '-',
        priority: 'NORMAL', // Valor por defecto, podría calcularse basado en la descripción
        status: 'COMPLETED', // Asumir completed ya que tenemos datos
        cost_amount: invoice?.reported_total || 0,
        created_at: discrepancy.created_at,
        updated_at: discrepancy.created_at
      };
    });

    console.log('✅ DEBUG getAviationAuditData: Transformed data:', {
      count: transformedData.length,
      firstRecord: transformedData[0]
    });

    return {
      success: true,
      data: transformedData
    };
  } catch (error) {
    console.error('Error fetching aviation audit data:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch aviation audit data'
    };
  }
};

/**
 * Exportar datos a CSV
 */
export const exportMaintenanceData = async (
  filters?: MaintenanceFilters,
  includeDetails = true
): Promise<ApiResponse<string>> => {
  try {
    console.log('🔍 DEBUG exportMaintenanceData: Starting with filters:', filters);

    const response = await getInvoices(filters, { page: 1, limit: 10000 });

    if (!response.success) {
      throw new Error('Failed to fetch data for export');
    }

    const data = response.data.data; // Acceder correctamente a los datos anidados
    console.log('📊 DEBUG exportMaintenanceData: Data received:', data.length, 'records');

    // Convertir a CSV (simplificado - en producción usar librería como PapaParse)
    const headers = [
      'Invoice Number',
      'Work Order',
      'Date',
      'Vendor',
      'Aircraft',
      'Total',
      'Status',
      'Processing Method',
      'Discrepancies',
      'Parts Used'
    ];

    const rows = data.map(invoice => [
      invoice.invoice_number,
      invoice.work_order_number || '',
      invoice.invoice_date,
      invoice.vendor_name || '',
      invoice.aircraft_registration || '',
      invoice.reported_total.toString(),
      invoice.status,
      invoice.processing_method,
      invoice.total_discrepancies.toString(),
      invoice.total_parts_used.toString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return {
      success: true,
      data: csvContent
    };
  } catch (error) {
    console.error('Error exporting maintenance data:', error);
    return {
      success: false,
      data: '',
      error: error instanceof Error ? error.message : 'Failed to export maintenance data'
    };
  }
};

// ================================================================
// UTILIDADES Y HELPERS
// ================================================================

/**
 * Formatear moneda
 */
export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount);
};

/**
 * Formatear fecha
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calcular días entre fechas
 */
export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
};

/**
 * Validar formato de número de parte
 */
export const validatePartNumber = (partNumber: string): boolean => {
  // Expresión regular básica para números de parte de aviación
  const partNumberRegex = /^[A-Z0-9\-\/]+$/i;
  return partNumberRegex.test(partNumber.trim());
};

/**
 * Generar color de estado para UI
 */
export const getStatusColor = (status: string): string => {
  const colorMap: Record<string, string> = {
    'PENDING': 'text-yellow-600 bg-yellow-100',
    'PROCESSING': 'text-blue-600 bg-blue-100',
    'COMPLETED': 'text-green-600 bg-green-100',
    'REVIEWED': 'text-purple-600 bg-purple-100',
    'APPROVED': 'text-emerald-600 bg-emerald-100'
  };
  return colorMap[status] || 'text-gray-600 bg-gray-100';
};

/**
 * Generar color de prioridad para UI
 */
export const getPriorityColor = (priority: string): string => {
  const colorMap: Record<string, string> = {
    'LOW': 'text-green-600 bg-green-100',
    'NORMAL': 'text-blue-600 bg-blue-100',
    'HIGH': 'text-orange-600 bg-orange-100',
    'URGENT': 'text-red-600 bg-red-100'
  };
  return colorMap[priority] || 'text-gray-600 bg-gray-100';
};

/**
 * Obtener categorías de costo disponibles
 */
export const getCostCategories = async (): Promise<ApiResponse<CostCategory[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.COST_CATEGORIES)
      .select('*')
      .order('id');

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error fetching cost categories:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to fetch cost categories'
    };
  }
};

/**
 * Buscar partes por número o descripción
 */
export const searchParts = async (
  searchTerm: string,
  limit = 20
): Promise<ApiResponse<Part[]>> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PARTS)
      .select('*')
      .or(`part_number.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .limit(limit);

    if (error) throw error;

    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('Error searching parts:', error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : 'Failed to search parts'
    };
  }
};

/**
 * Eliminar una factura y sus datos relacionados
 */
export const deleteInvoice = async (invoiceId: string): Promise<ApiResponse<boolean>> => {
  try {
    // La eliminación en cascada debería manejar las tablas relacionadas
    // debido a las restricciones ON DELETE CASCADE
    const { error } = await supabase
      .from(TABLES.INVOICES)
      .delete()
      .eq('id', invoiceId);

    if (error) throw error;

    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return {
      success: false,
      data: false,
      error: error instanceof Error ? error.message : 'Failed to delete invoice'
    };
  }
};

// ================================================================
// EXPORTACIONES
// ================================================================

export {
  TABLES,
  STATUSES,
  PROCESSING_METHODS
};