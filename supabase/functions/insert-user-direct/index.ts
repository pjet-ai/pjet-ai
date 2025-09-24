import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2YXptZGF1emFleGtueWJibmZjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3NzkxNjQsImV4cCI6MjA3MjM1NTE2NH0.5JaUnsAz1RKkt8A7U2Mt4S3y23yQuYaaFFBlcl0RZGE';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('🔧 INSERT-USER-DIRECT: Creating user directly in database');
    
    // Parse JSON request
    const body = await req.json();
    const userId = body.userId;
    
    if (!userId) {
      throw new Error('userId is required');
    }

    console.log(`🔧 INSERT-USER-DIRECT: Creating user with ID: ${userId}`);

    // Initialize Supabase client with service role key to bypass all constraints
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // First, check if user exists in auth.users by creating a dummy auth user
    // This is the proper way to handle users in Supabase
    try {
      const { error: authError } = await supabase.auth.admin.createUser({
        email: `demo-${userId}@example.com`,
        password: 'demo-password-123',
        email_confirm: true,
      });
      
      if (authError && authError.code !== '23505') {
        console.log('⚠️ Auth user creation issue (may already exist):', authError.message);
      } else {
        console.log('✅ Auth user created or already exists');
      }
    } catch (authErr) {
      console.log('ℹ️ Auth user already exists or skip this step');
    }

    // Now create the profile record
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        user_id: userId,
        first_name: 'Demo',
        last_name: 'User',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // User already exists, that's fine
        console.log(`🔧 INSERT-USER-DIRECT: User ${userId} already exists in profiles`);
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
        console.error('❌ Error creating user in profiles:', error);
        throw new Error('Failed to create user: ' + error.message);
      }
    }

    console.log('✅ INSERT-USER-DIRECT: User created successfully in profiles:', data);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User created successfully in profiles',
        userId,
        user: data
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('❌ INSERT-USER-DIRECT Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to create user',
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
})