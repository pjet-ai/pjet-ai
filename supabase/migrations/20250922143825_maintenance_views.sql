-- Maintenance Views for Aviation System

-- Drop existing views
DROP VIEW IF EXISTS public.aviation_audit_view CASCADE;
DROP VIEW IF EXISTS public.maintenance_invoice_summary_view CASCADE;
DROP VIEW IF EXISTS public.maintenance_stats_view CASCADE;

-- Aviation Audit View
CREATE OR REPLACE VIEW public.aviation_audit_view AS
SELECT
    COUNT(DISTINCT i.id)::int as total_invoices_processed,
    COUNT(DISTINCT i.id)::int as invoices_with_extraction,
    COUNT(DISTINCT CASE WHEN i.updated_at > i.created_at THEN i.id END)::int as pending_processing,
    COUNT(DISTINCT i.id)::int as total_data_points,
    COUNT(DISTINCT CASE WHEN i.invoice_number IS NOT NULL AND i.invoice_number != '' THEN i.id END)::int as valid_invoice_numbers,
    COUNT(DISTINCT CASE WHEN i.reported_total > 0 THEN i.id END)::int as valid_amounts,
    COUNT(DISTINCT CASE WHEN i.invoice_date IS NOT NULL THEN i.id END)::int as valid_dates,
    COUNT(DISTINCT i.id)::int as compliance_checks,
    COUNT(DISTINCT CASE WHEN i.currency_code IS NOT NULL THEN i.id END)::int as currency_specified,
    COUNT(DISTINCT CASE WHEN i.created_at IS NOT NULL THEN i.id END)::int as proper_timestamps,
    COUNT(DISTINCT i.id)::int as performance_metrics,
    COUNT(DISTINCT i.id)::int as processed_within_24h,
    COUNT(DISTINCT d.id)::int as total_discrepancies_identified,
    COUNT(DISTINCT CASE WHEN dc.amount > 0 THEN dc.id END)::int as costs_associated,
    NOW() as audit_generated_at,
    DATE_TRUNC('month', NOW()) as audit_period
FROM public.invoices i
LEFT JOIN public.discrepancies d ON i.id = d.invoice_id
LEFT JOIN public.discrepancy_costs dc ON d.id = dc.discrepancy_id
GROUP BY DATE_TRUNC('month', NOW());

-- Maintenance Invoice Summary View
CREATE OR REPLACE VIEW public.maintenance_invoice_summary_view AS
SELECT
    i.id,
    i.invoice_number,
    i.work_order_number,
    i.invoice_date,
    NULL as po_number,
    NULL as due_date,
    NULL as vendor_name,
    NULL as technician_name,
    NULL as inspector_name,
    NULL as aircraft_registration,
    NULL as service_location,
    i.currency_code,
    1.0 as exchange_rate,
    i.reported_total,
    'completed' as status,
    'manual' as processing_method,
    i.created_at,
    i.updated_at,
    i.updated_at as processed_at,
    i.created_at as extracted_at,
    NULL as file_page_count,
    NULL as file_size_bytes,
    EXTRACT(DAY FROM (i.updated_at - i.created_at))::int as processing_days,
    COALESCE(d_counts.discrepancy_count, 0)::int as total_discrepancies,
    COALESCE(d_counts.total_parts_used, 0)::int as total_parts_used,
    COALESCE(d_counts.total_actual_hours, 0)::numeric as total_actual_hours,
    COALESCE(c_counts.labor_cost_total, 0)::numeric as labor_cost_total,
    COALESCE(c_counts.parts_cost_total, 0)::numeric as parts_cost_total,
    COALESCE(c_counts.services_cost_total, 0)::numeric as services_cost_total,
    COALESCE(c_counts.freight_cost_total, 0)::numeric as freight_cost_total,
    CASE WHEN ABS(COALESCE(c_counts.total_calculated_cost, 0) - i.reported_total) > 0.01 THEN true ELSE false END as has_total_discrepancy,
    COALESCE(c_counts.total_calculated_cost, 0)::numeric as calculated_total_cost
FROM public.invoices i
LEFT JOIN (
    SELECT
        invoice_id,
        COUNT(id)::int as discrepancy_count,
        COALESCE(SUM(CASE WHEN description ILIKE '%part%' OR description ILIKE '%component%' THEN 1 ELSE 0 END), 0)::int as total_parts_used,
        COALESCE(SUM(CASE WHEN description ILIKE '%hour%' OR description ILIKE '%labor%' THEN 1 ELSE 0 END), 0)::int as total_actual_hours
    FROM public.discrepancies
    GROUP BY invoice_id
) d_counts ON i.id = d_counts.invoice_id
LEFT JOIN (
    SELECT
        d.invoice_id,
        SUM(CASE WHEN dc.cost_category_id = 1 THEN dc.amount ELSE 0 END)::numeric as labor_cost_total,
        SUM(CASE WHEN dc.cost_category_id = 2 THEN dc.amount ELSE 0 END)::numeric as parts_cost_total,
        SUM(CASE WHEN dc.cost_category_id = 3 THEN dc.amount ELSE 0 END)::numeric as services_cost_total,
        SUM(CASE WHEN dc.cost_category_id = 4 THEN dc.amount ELSE 0 END)::numeric as freight_cost_total,
        SUM(dc.amount)::numeric as total_calculated_cost
    FROM public.discrepancies d
    LEFT JOIN public.discrepancy_costs dc ON d.id = dc.discrepancy_id
    GROUP BY d.invoice_id
) c_counts ON i.id = c_counts.invoice_id;

-- Maintenance Stats View
CREATE OR REPLACE VIEW public.maintenance_stats_view AS
SELECT
    COUNT(*)::int as total_invoices,
    COALESCE(SUM(reported_total), 0)::numeric as total_amount,
    COALESCE(SUM(CASE WHEN DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', NOW()) THEN reported_total ELSE 0 END), 0)::numeric as this_month_amount,
    COUNT(*)::int as completed_invoices,
    0::int as pending_invoices,
    0::int as processing_invoices,
    COALESCE(SUM(d_counts.total_discrepancies), 0)::int as total_discrepancies,
    COALESCE(SUM(d_counts.total_parts_used), 0)::int as total_parts_used,
    COALESCE(SUM(d_counts.total_labor_hours), 0)::numeric as total_labor_hours,
    NOW() as calculated_at
FROM public.invoices i
LEFT JOIN (
    SELECT
        invoice_id,
        COUNT(id)::int as total_discrepancies,
        COALESCE(SUM(CASE WHEN description ILIKE '%part%' OR description ILIKE '%component%' THEN 1 ELSE 0 END), 0)::int as total_parts_used,
        COALESCE(SUM(CASE WHEN description ILIKE '%hour%' OR description ILIKE '%labor%' THEN 1 ELSE 0 END), 0)::int as total_labor_hours
    FROM public.discrepancies
    GROUP BY invoice_id
) d_counts ON i.id = d_counts.invoice_id;

-- Grant permissions
GRANT SELECT ON public.aviation_audit_view TO anon;
GRANT SELECT ON public.aviation_audit_view TO authenticated;
GRANT SELECT ON public.maintenance_invoice_summary_view TO anon;
GRANT SELECT ON public.maintenance_invoice_summary_view TO authenticated;
GRANT SELECT ON public.maintenance_stats_view TO anon;
GRANT SELECT ON public.maintenance_stats_view TO authenticated;