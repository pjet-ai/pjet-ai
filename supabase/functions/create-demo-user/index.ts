import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('👥 CREATE-DEMO-USER: Creating demo user');
    
    // Parse JSON request
    const body = await req.json();
    const userId = body.userId;
    
    if (!userId) {
      throw new Error('userId is required');
    }

    console.log(`👥 CREATE-DEMO-USER: Creating user with ID: ${userId}`);

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Create user in profiles table
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // User already exists, that's fine for demo purposes
        console.log(`👥 CREATE-DEMO-USER: User ${userId} already exists`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: 'User already exists (which is fine for demo)',
            userId,
            existing: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      } else {
        console.error('❌ Error creating user:', error);
        throw new Error('Failed to create user: ' + error.message);
      }
    }

    console.log('✅ CREATE-DEMO-USER: User created successfully:', data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully',
        userId,
        user: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ CREATE-DEMO-USER Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create demo user',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})