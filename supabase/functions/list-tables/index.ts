import { serve } from 'https://deno.land/std@0.131.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Inicializar Supabase client
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.39.7')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Lista de tablas esperadas en el sistema
    const expectedTables = [
      'maintenance_records',
      'maintenance_financial_breakdown', 
      'maintenance_parts',
      'flights',
      'expenses',
      'airports',
      'profiles'
    ]

    const results = {}

    // Probar cada tabla
    for (const tableName of expectedTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)

        results[tableName] = {
          exists: !error,
          hasData: data && data.length > 0,
          error: error?.message || null,
          count: data?.length || 0
        }
      } catch (error) {
        results[tableName] = {
          exists: false,
          hasData: false,
          error: error.message || 'Unknown error',
          count: 0
        }
      }
    }

    // Obtener la lista real de tablas del esquema
    try {
      const { data, error } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public')
        .order('table_name')

      if (error) {
        console.log('Could not query information_schema:', error)
      } else {
        console.log('All tables in database:', data)
      }
    } catch (error) {
      console.log('Error querying information_schema:', error)
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        timestamp: new Date().toISOString(),
        expected_tables: results,
        total_tables: Object.keys(results).length,
        found_tables: Object.values(results).filter(t => t.exists).length
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Function failed', details: error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})