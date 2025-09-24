// Script para depurar getMaintenanceStats() en el contexto real
const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = 'https://your-project.supabase.co'; // Reemplazar con URL real
const supabaseKey = 'your-anon-key'; // Reemplazar con key real

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugMaintenanceStats() {
  console.log('🔍 Debugging getMaintenanceStats()...\n');

  try {
    // 1. Verificar conexión a la base de datos
    console.log('1. Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('invoices')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    console.log('✅ Database connection successful');

    // 2. Verificar datos en la tabla invoices
    console.log('\n2. Checking invoices table...');
    const { data: invoices, error: invoicesError } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        work_order_number,
        invoice_date,
        currency_code,
        reported_total,
        created_at,
        updated_at
      `);

    if (invoicesError) {
      console.error('❌ Error fetching invoices:', invoicesError);
      return;
    }

    console.log(`✅ Found ${invoices?.length || 0} invoices`);
    if (invoices && invoices.length > 0) {
      console.log('First invoice:', invoices[0]);
      console.log('Total amount from invoices:', invoices.reduce((sum, inv) => sum + (inv.reported_total || 0), 0));
    }

    // 3. Verificar datos en la tabla discrepancies
    console.log('\n3. Checking discrepancies table...');
    const { data: discrepancies, error: discrepanciesError } = await supabase
      .from('discrepancies')
      .select(`
        id,
        invoice_id,
        item_number,
        description,
        discrepancy_costs (
          cost_category_id,
          amount
        )
      `);

    if (discrepanciesError) {
      console.error('❌ Error fetching discrepancies:', discrepanciesError);
      return;
    }

    console.log(`✅ Found ${discrepancies?.length || 0} discrepancies`);
    if (discrepancies && discrepancies.length > 0) {
      console.log('First discrepancy:', discrepancies[0]);
    }

    // 4. Verificar datos en la tabla discrepancy_costs
    console.log('\n4. Checking discrepancy_costs table...');
    const { data: costs, error: costsError } = await supabase
      .from('discrepancy_costs')
      .select(`
        id,
        discrepancy_id,
        cost_category_id,
        amount
      `);

    if (costsError) {
      console.error('❌ Error fetching costs:', costsError);
      return;
    }

    console.log(`✅ Found ${costs?.length || 0} cost records`);
    if (costs && costs.length > 0) {
      console.log('Costs by category:');
      const costByCategory = {};
      costs.forEach(cost => {
        costByCategory[cost.cost_category_id] = (costByCategory[cost.cost_category_id] || 0) + cost.amount;
      });
      console.log(costByCategory);
    }

    // 5. Calcular estadísticas manualmente
    console.log('\n5. Calculating stats manually...');
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const totalInvoices = invoices?.length || 0;
    const totalAmount = invoices?.reduce((sum, inv) => sum + (inv.reported_total || 0), 0) || 0;

    const thisMonthAmount = invoices?.filter(inv => {
      const invDate = new Date(inv.invoice_date);
      return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
    }).reduce((sum, inv) => sum + (inv.reported_total || 0), 0) || 0;

    const totalDiscrepancies = discrepancies?.length || 0;

    const laborCostTotal = costs?.filter(c => c.cost_category_id === 1)?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const partsCostTotal = costs?.filter(c => c.cost_category_id === 2)?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
    const servicesCostTotal = costs?.filter(c => c.cost_category_id === 3)?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

    const AVERAGE_LABOR_RATE = 65;
    const totalLaborHours = laborCostTotal > 0 ? laborCostTotal / AVERAGE_LABOR_RATE : 0;

    const manualStats = {
      total_invoices: totalInvoices,
      total_amount: totalAmount,
      this_month_amount: thisMonthAmount,
      pending_invoices: 0,
      processing_invoices: 0,
      completed_invoices: totalInvoices,
      total_discrepancies: totalDiscrepancies,
      total_parts_used: 0,
      total_labor_hours: totalLaborHours
    };

    console.log('📊 Manual calculation results:');
    console.log(manualStats);

    // 6. Probar la función getMaintenanceStats real
    console.log('\n6. Testing actual getMaintenanceStats() function...');

    // Importar la función (esto es solo una simulación)
    const getMaintenanceStats = async () => {
      try {
        // Obtener totales desde la estructura real de la base de datos
        const { data: invoices, error: invoicesError } = await supabase
          .from('invoices')
          .select(`
            id,
            invoice_number,
            work_order_number,
            invoice_date,
            currency_code,
            reported_total,
            created_at,
            updated_at
          `);

        if (invoicesError) throw invoicesError;

        // Obtener discrepancias y costos para calcular estadísticas
        const { data: discrepancies, error: discrepanciesError } = await supabase
          .from('discrepancies')
          .select(`
            id,
            invoice_id,
            item_number,
            description,
            discrepancy_costs (
              cost_category_id,
              amount
            )
          `);

        if (discrepanciesError) throw discrepanciesError;

        // Obtener costos por categoría
        const { data: costs, error: costsError } = await supabase
          .from('discrepancy_costs')
          .select(`
            id,
            discrepancy_id,
            cost_category_id,
            amount
          `);

        if (costsError) throw costsError;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const totalInvoices = invoices?.length || 0;
        const totalAmount = invoices?.reduce((sum, inv) => sum + (inv.reported_total || 0), 0) || 0;

        const thisMonthAmount = invoices?.filter(inv => {
          const invDate = new Date(inv.invoice_date);
          return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        }).reduce((sum, inv) => sum + (inv.reported_total || 0), 0) || 0;

        // Status computed - asumiendo que todas las facturas están completadas
        const completedInvoices = totalInvoices; // Todas están completadas por defecto
        const pendingInvoices = 0; // No hay pendientes en la estructura real
        const processingInvoices = 0; // No hay procesando en la estructura real

        const totalDiscrepancies = discrepancies?.length || 0;

        // Calcular totales por categoría de costo
        const laborCostTotal = costs?.filter(c => c.cost_category_id === 1)?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        const partsCostTotal = costs?.filter(c => c.cost_category_id === 2)?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;
        const servicesCostTotal = costs?.filter(c => c.cost_category_id === 3)?.reduce((sum, c) => sum + (c.amount || 0), 0) || 0;

        // Calcular horas de trabajo (estimado: $65/hora para categoría labor)
        const AVERAGE_LABOR_RATE = 65;
        const totalLaborHours = laborCostTotal > 0 ? laborCostTotal / AVERAGE_LABOR_RATE : 0;

        // Calcular partes usadas (si hay tabla de partes)
        const totalPartsUsed = 0; // La tabla de partes no está en la estructura real actual

        return {
          success: true,
          data: {
            total_invoices: totalInvoices,
            total_amount: totalAmount,
            this_month_amount: thisMonthAmount,
            pending_invoices: pendingInvoices,
            processing_invoices: processingInvoices,
            completed_invoices: completedInvoices,
            total_discrepancies: totalDiscrepancies,
            total_parts_used: totalPartsUsed,
            total_labor_hours: totalLaborHours,
            average_processing_time_days: 0, // No disponible en estructura real
            cost_variance_percentage: 0 // No disponible en estructura real
          }
        };
      } catch (error) {
        console.error('Error fetching maintenance stats:', error);
        return {
          success: false,
          data: {},
          error: error instanceof Error ? error.message : 'Failed to fetch maintenance stats'
        };
      }
    };

    const functionResult = await getMaintenanceStats();
    console.log('📈 Function result:', functionResult);

    // 7. Comparar resultados
    console.log('\n7. Comparison:');
    console.log('Manual vs Function match:', JSON.stringify(manualStats) === JSON.stringify(functionResult.data));

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

debugMaintenanceStats();