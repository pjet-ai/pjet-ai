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

    // Realizar una consulta simple a la base de datos
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('id')
      .limit(1)

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database connection failed', details: error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('Maintenance records check:', data, error)
    
    // Si maintenance_records no existe, intentar con otras tablas
    if (error) {
      console.log('maintenance_records failed, trying other tables...')
      
      // Intentar con flights
      const { data: flightsData, error: flightsError } = await supabase
        .from('flights')
        .select('id')
        .limit(1)
        
      if (flightsError) {
        console.log('flights failed, trying expenses...')
        
        // Intentar con expenses
        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('id')
          .limit(1)
          
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'No tables found',
            details: {
              maintenance_error: error.message,
              flights_error: flightsError?.message,
              expenses_error: expensesError?.message,
              maintenance_tables: 'check maintenance_records table existence',
              flights_tables: 'check flights table existence',
              expenses_tables: 'check expenses table existence'
            }
          }),
          { 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 404 
          }
        )
      }
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'flights table exists',
          table: 'flights',
          data: flightsData
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'maintenance_records table exists',
        table: 'maintenance_records',
        data: data
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