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
    console.log('👥 GET-USERS: Getting users from profiles table');
    
    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    // Get all users from profiles table
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, created_at')
      .order('created_at', { ascending: false });

    // Also get maintenance_records structure
    const { data: maintenanceSample, error: maintenanceError } = await supabase
      .from('maintenance_records')
      .select('*')
      .limit(1);

    if (maintenanceError && !maintenanceError.message.includes('0 rows')) {
      console.log('⚠️ Could not get maintenance_records structure:', maintenanceError.message);
    } else {
      console.log('🔍 maintenance_records structure:', maintenanceSample && maintenanceSample[0] ? Object.keys(maintenanceSample[0]) : 'No data');
    }

    if (usersError) {
      console.error('❌ Error getting users:', usersError);
      throw new Error('Failed to get users: ' + usersError.message);
    }

    console.log(`✅ GET-USERS: Found ${users.length} users`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        users,
        count: users.length,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ GET-USERS Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to get users',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})