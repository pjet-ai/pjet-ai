import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Crear cliente con service_role key para tener acceso a auth.users
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { userId } = await req.json()
    
    // Query directa a auth.users (requiere service_role key)
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT id, email, created_at FROM auth.users WHERE id = '${userId}'`
      })

    if (error) {
      // Si no existe la función RPC, intentamos con método alternativo
      const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
      
      if (usersError) {
        return new Response(
          JSON.stringify({ error: usersError.message }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }
      
      const user = users.users.find(u => u.id === userId)
      return new Response(
        JSON.stringify({ 
          exists: !!user,
          user: user ? { id: user.id, email: user.email, created_at: user.created_at } : null 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        exists: data && data.length > 0,
        user: data && data.length > 0 ? data[0] : null 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})