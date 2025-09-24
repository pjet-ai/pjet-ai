-- 🔍 VERIFICAR ESTRUCTURA DE USUARIOS Y CORREGIR TESTING
-- Script para diagnosticar y corregir el problema de foreign key

-- 1. Verificar tabla auth.users (Supabase Auth)
SELECT 'Auth Users Count:' as info, count(*) as count FROM auth.users;

-- 2. Verificar constraint de maintenance_records
SELECT 
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_name = 'maintenance_records'
    AND kcu.column_name = 'user_id';

-- 3. Verificar si existe nuestro UUID de testing
SELECT 'Test User Exists:' as info, 
       CASE WHEN EXISTS (
         SELECT 1 FROM auth.users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
       ) THEN 'YES' ELSE 'NO' END as exists;

-- 4. Crear usuario de testing si no existe (para desarrollo local)
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    aud,
    role
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'test@orion-ocg.com',
    '$2a$10$dummy.hash.for.testing.only',
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Test User"}',
    'authenticated',
    'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- 5. Verificar resultado
SELECT 'Final Test User Status:' as info, 
       email, 
       created_at
FROM auth.users 
WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';