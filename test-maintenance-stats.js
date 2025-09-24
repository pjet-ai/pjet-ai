// Script para probar getMaintenanceStats() directamente
const { getMaintenanceStats } = require('./src/utils/maintenanceN8nUtils.ts');

async function testMaintenanceStats() {
  try {
    console.log('Testing getMaintenanceStats()...');
    const result = await getMaintenanceStats();

    console.log('Result:', result);

    if (result.success) {
      console.log('✅ getMaintenanceStats() successful');
      console.log('Data:', result.data);
      console.log('Total Invoices:', result.data.total_invoices);
      console.log('Total Amount:', result.data.total_amount);
      console.log('Total Discrepancies:', result.data.total_discrepancies);
      console.log('This Month Amount:', result.data.this_month_amount);
    } else {
      console.log('❌ getMaintenanceStats() failed');
      console.log('Error:', result.error);
    }
  } catch (error) {
    console.error('❌ Error calling getMaintenanceStats():', error);
  }
}

testMaintenanceStats();