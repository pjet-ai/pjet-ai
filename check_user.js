import { createClient } from '@supabase/supabase-js';

// Configuración de Supabase local
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkUser() {
  try {
    console.log('Verificando usuario con ID: b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7');
    
    // Intentar obtener usuario usando auth.admin
    const { data, error } = await supabase.auth.admin.getUserById('b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7');
    
    if (error) {
      console.log('Error al obtener usuario:', error.message);
      
      // Intentar listar todos los usuarios para ver qué existe
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.log('Error al listar usuarios:', listError.message);
      } else {
        console.log('Usuarios existentes:', users.users.length);
        users.users.forEach(user => {
          console.log(`- ID: ${user.id}, Email: ${user.email}, Creado: ${user.created_at}`);
        });
      }
      
      return;
    }
    
    if (data.user) {
      console.log('✅ Usuario encontrado:');
      console.log(`ID: ${data.user.id}`);
      console.log(`Email: ${data.user.email}`);
      console.log(`Creado: ${data.user.created_at}`);
    } else {
      console.log('❌ Usuario no encontrado');
      
      // Listar todos los usuarios para mostrar alternativas
      const { data: users } = await supabase.auth.admin.listUsers();
      console.log(`\nUsuarios existentes (${users.users.length}):`);
      users.users.forEach(user => {
        console.log(`- ID: ${user.id}, Email: ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('Error inesperado:', error.message);
  }
}

checkUser();