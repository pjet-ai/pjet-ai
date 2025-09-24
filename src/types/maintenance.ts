// ================================================================
// TIPOS DE DATOS PARA SISTEMA DE MANTENIMIENTO N8N INTEGRATION
// ORION OCG - AVIATION MAINTENANCE SUITE v2.0
// ================================================================

// 🎯 DIMENSIÓN: CATEGORÍAS DE COSTO
export interface CostCategory {
  id: number;
  code: 'labor' | 'parts' | 'services' | 'freight';
  display_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

// 🎯 CATÁLOGO: PARTES Y COMPONENTES
export interface Part {
  id: string;
  part_number: string;
  manufacturer?: string;
  description?: string;
  ata_chapter?: number;
  ata_code?: string;
  uom: string;
  is_airworthy: boolean;
  shelf_life_months?: number;
  created_at: string;
  updated_at: string;
}

// 🎯 MAESTRO: FACTURAS DE MANTENIMIENTO (Estructura REAL)
export interface Invoice {
  id: string;
  invoice_number: string;
  work_order_number: string;
  invoice_date: string;
  currency_code: string;
  reported_total: number;
  created_at: string;
  updated_at: string;

  // Campos computados para compatibilidad
  vendor_name?: string;        // Computado desde discrepancy descriptions
  status?: string;             // Computado - por defecto 'COMPLETED'
  aircraft_registration?: string; // Computado desde descripciones
  file_path?: string;         // Si existe en el futuro
  file_size_bytes?: number;   // Si existe en el futuro
  file_page_count?: number;   // Si existe en el futuro
  extracted_at?: string;      // Si existe en el futuro
  processed_at?: string;      // Si existe en el futuro
}

// 🎯 HECHOS: DISCREPANCIAS (LÍNEAS DE TRABAJO) - Estructura REAL
export interface Discrepancy {
  id: string;
  invoice_id: string;
  item_number: string;
  description: string;
  ata_code?: string;          // Siempre null en datos reales
  ata_chapter?: string;        // Siempre null en datos reales
  regulatory_code?: string;   // Siempre null en datos reales
  notes?: string;              // Siempre null en datos reales

  // Campos computados para compatibilidad con UI
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';  // Computado desde item_number
  category?: 'SCHEDULED' | 'UNSCHEDULED' | 'INSPECTION' | 'REPAIR' | 'MODIFICATION' | 'OVERHAUL'; // Computado
  action_taken?: string;       // Extraído de description
  estimated_hours?: number;    // Computado desde costos
  actual_hours?: number;      // Computado desde costos
  completion_date?: string;    // Computado desde created_at

  created_at: string;
  updated_at: string;
}

// 🎯 HECHOS: COSTOS POR DISCREPANCIA - Estructura REAL
export interface DiscrepancyCost {
  id: number;
  discrepancy_id: string;
  cost_category_id: number;    // 1, 2, o 3
  amount: number;

  // Campos computados para compatibilidad
  unit_price?: number;         // Computado = amount
  quantity?: number;           // Computado = 1
  labor_rate?: number;         // Computado para categorías
  labor_hours?: number;        // Computado desde amount/valor_hora
  notes?: string;              // Siempre null

  // Cost category mapping (computado)
  cost_category?: {
    id: number;
    code: 'labor' | 'parts' | 'services';
    display_name: string;
  };

  created_at?: string;          // Si existe en el futuro
}

// 🎯 HECHOS: PARTES UTILIZADAS POR DISCREPANCIA
export interface DiscrepancyPart {
  id: number;
  discrepancy_id: string;
  part_id: string;
  item_ref?: string;
  quantity: number;
  unit_price?: number;
  line_total: number;
  serial_number?: string;
  batch_number?: string;
  expiration_date?: string;
  condition_check: boolean;
  airworthiness_cert?: string;
  created_at: string;
  updated_at: string;

  // Joined fields
  part?: Part;
}

// ================================================================
// VISTAS Y RESÚMENES
// ================================================================

// 📊 VISTA RESUMEN DE FACTURAS - Adaptada a Estructura REAL
export interface InvoiceSummary {
  id: string;
  invoice_number: string;
  work_order_number: string;
  invoice_date: string;
  currency_code: string;
  reported_total: number;
  created_at: string;
  updated_at: string;

  // Campos computados para compatibilidad UI
  vendor_name?: string;           // Extraído de descripciones
  aircraft_registration?: string;  // Extraído de descripciones
  status?: string;                // Default: 'COMPLETED'
  processing_method?: string;      // Default: 'N8N'
  processed_at?: string;           // Default: created_at

  // Totales calculados desde datos reales
  calculated_cost_total: number;
  labor_cost_total: number;
  parts_cost_total: number;
  services_cost_total: number;
  freight_cost_total: number;

  // Conteos desde datos reales
  total_discrepancies: number;
  total_parts_used: number;        // Siempre 0 (no hay relación)
  total_estimated_hours: number;   // Computado
  total_actual_hours: number;      // Computado

  // Validaciones y métricas
  has_total_discrepancy: boolean;
  processing_days?: number;       // Diferencia entre created_at y ahora
}

// 🔍 VISTA DETALLADA DE AUDITORÍA
export interface AviationAudit {
  id: string;
  invoice_number: string;
  work_order_number: string;
  invoice_date: string;
  vendor_name: string;
  aircraft_registration?: string;
  aircraft_hours_total?: number;
  aircraft_cycles_total?: number;
  technician_name?: string;
  inspector_name?: string;
  service_location?: string;

  // Información de discrepancias
  discrepancy_description?: string;
  ata_code?: string;
  ata_chapter?: number;
  regulatory_code?: string;
  priority?: string;
  maintenance_category?: string;
  action_taken?: string;
  completion_date?: string;
  estimated_hours?: number;
  actual_hours?: number;

  // Costos detallados
  cost_category?: string;
  cost_amount?: number;
  cost_labor_hours?: number;
  cost_labor_rate?: number;

  // Partes utilizadas
  part_number?: string;
  part_manufacturer?: string;
  part_description?: string;
  parts_quantity?: number;
  parts_unit_price?: number;
  parts_total?: number;
  part_serial_number?: string;
  part_airworthiness_cert?: string;

  // Estado y auditoría
  status: string;
  processing_method: string;
  processed_at?: string;
  discrepancy_created_at?: string;
  parts_added_at?: string;

  // Métricas de eficiencia
  efficiency_variance_percent?: number;
  hours_per_day_ratio?: number;
}

// ================================================================
// INTERFACES PARA FORMULARIOS Y MODALES
// ================================================================

// 📋 FORMULARIO DE SUBIDA DE FACTURA
export interface InvoiceUploadForm {
  file: File;
  vendor_name?: string;
  aircraft_registration?: string;
  work_order_number?: string;
  invoice_number?: string;
  invoice_date?: string;
}

// 💰 DESGLOSE FINANCIERO
export interface FinancialBreakdown {
  category: 'labor' | 'parts' | 'services' | 'freight';
  amount: number;
  description?: string;
  unit_price?: number;
  quantity?: number;
  labor_rate?: number;
  labor_hours?: number;
}

// 🔧 PARTES UTILIZADAS
export interface UsedPart {
  part_number: string;
  manufacturer?: string;
  description?: string;
  quantity: number;
  unit_price?: number;
  line_total?: number;
  serial_number?: string;
  condition_check?: boolean;
  airworthiness_cert?: string;
}

// 📋 LÍNEA DE TRABAJO
export interface WorkItem {
  item_number: string;
  description: string;
  ata_code?: string;
  ata_chapter?: number;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  category: 'SCHEDULED' | 'UNSCHEDULED' | 'INSPECTION' | 'REPAIR' | 'MODIFICATION' | 'OVERHAUL';
  estimated_hours?: number;
  actual_hours?: number;
  action_taken?: string;
  financial_breakdown?: FinancialBreakdown[];
  parts_used?: UsedPart[];
}

// ================================================================
// INTERFACES PARA ESTADÍSTICAS Y DASHBOARD
// ================================================================

export interface MaintenanceStats {
  total_invoices: number;
  total_amount: number;
  this_month_amount: number;
  pending_invoices: number;
  processing_invoices: number;
  completed_invoices: number;
  total_discrepancies: number;
  total_parts_used: number;
  total_labor_hours: number;
  average_processing_time_days?: number;
  cost_variance_percentage?: number;
}

export interface CategoryStats {
  category: string;
  count: number;
  total_amount: number;
  percentage: number;
}

export interface VendorStats {
  vendor_name: string;
  invoice_count: number;
  total_amount: number;
  average_amount: number;
  last_invoice_date?: string;
}

export interface AircraftStats {
  aircraft_registration: string;
  total_invoices: number;
  total_amount: number;
  total_hours?: number;
  total_discrepancies: number;
  last_maintenance_date?: string;
}

// ================================================================
// FILTROS Y BÚSQUEDA
// ================================================================

export interface MaintenanceFilters {
  search?: string;
  status?: string;
  vendor?: string;
  aircraft_registration?: string;
  date_from?: string;
  date_to?: string;
  processing_method?: string;
  ata_chapter?: number;
  priority?: string;
  category?: string;
  min_amount?: number;
  max_amount?: number;
  discrepancy_level?: string;
  has_discrepancies?: string;
}

export interface MaintenanceSorting {
  field: 'invoice_date' | 'vendor_name' | 'reported_total' | 'status' | 'created_at';
  direction: 'asc' | 'desc';
}

export interface MaintenancePagination {
  page: number;
  limit: number;
  total: number;
}

// ================================================================
// EXPORTACIÓN Y REPORTES
// ================================================================

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  include_discrepancies: boolean;
  include_parts: boolean;
  include_costs: boolean;
  date_range?: {
    from: string;
    to: string;
  };
  filters?: MaintenanceFilters;
}

export interface AuditReportOptions {
  invoice_ids?: string[];
  date_range?: {
    from: string;
    to: string;
  };
  aircraft_registrations?: string[];
  vendors?: string[];
  include_detailed_costs: boolean;
  include_part_traceability: boolean;
  include_compliance_notes: boolean;
}

// ================================================================
// UTILIDADES Y HELPER TYPES
// ================================================================

export type InvoiceStatus = Invoice['status'];
export type ProcessingMethod = Invoice['processing_method'];
export type CostCategoryCode = CostCategory['code'];
export type PriorityLevel = Discrepancy['priority'];
export type MaintenanceCategory = Discrepancy['category'];

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: MaintenancePagination;
  success: boolean;
  error?: string;
}

// ================================================================
// COMPATIBILIDAD CON CÓDIGO LEGADO (TEMPORAL)
// ================================================================

export interface MaintenanceRecordLegacy {
  // Mapeo a nueva estructura para compatibilidad temporal
  id: string;
  date: string;
  vendor: string;
  total: number;
  currency: string;
  status: string;
  created_at: string;

  // Mapear desde nueva estructura
  maintenance_type?: string;
  work_description?: string;
  location?: string;
  work_order_number?: string;
  technician_name?: string;
  aircraft_registration?: string;
  aircraft_hours_total?: number;
  aircraft_cycles_total?: number;
  labor_hours?: number;
  parts_total?: number;

  // Campos legacy obsoletos (serán null)
  technician_license?: null;
  aircraft_hours_since_overhaul?: null;
  aircraft_cycles_since_overhaul?: null;
  labor_rate_per_hour?: null;
  labor_total?: null;
  shop_supplies_total?: null;
  compliance_reference?: null;
  airworthiness_directive?: null;
  service_bulletin_reference?: null;
  inspection_type?: null;
  next_inspection_hours?: null;
  next_inspection_cycles?: null;
  return_to_service_date?: null;
  mechanic_signature?: null;
  inspector_signature?: null;
  vendor_address?: null;
  vendor_phone?: null;
  vendor_faa_certificate?: null;
  payment_terms?: null;
  payment_method?: null;
  warranty_period_days?: null;
  warranty_description?: null;
  document_hash?: null;
  extracted_by_ocr?: null;
  manual_review_required?: null;
  approved_by?: null;
  approval_date?: null;
}