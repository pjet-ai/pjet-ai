-- Fix Maintenance Invoice Summary View to include invoice_date

-- Drop existing view
DROP VIEW IF EXISTS public.maintenance_invoice_summary_view CASCADE;

-- Recreate view with invoice_date field
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

-- Grant permissions
GRANT SELECT ON public.maintenance_invoice_summary_view TO anon;
GRANT SELECT ON public.maintenance_invoice_summary_view TO authenticated;