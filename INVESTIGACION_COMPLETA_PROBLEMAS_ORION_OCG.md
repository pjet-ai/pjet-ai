# 🚨 INVESTIGACIÓN COMPLETA - Problemas Críticos ORION OCG

## 📋 Resumen Ejecutivo

He realizado una investigación profunda del sistema ORION OCG y he identificado **4 problemas críticos** que están impidiendo el correcto funcionamiento del procesamiento de PDFs y la gestión de mantenimiento.

---

## 🔍 Problemas Identificados

### 🚨 Problema #1: TypeError en Maintenance.tsx:434:31

**Ubicación:** `C:\Users\LABORATORIO\Downloads\desarrollos\ORION OCG\pjet\src\pages\Maintenance.tsx:434:31`

**Error:** `TypeError: Cannot read properties of undefined (reading 'vendor')`

**Causa Raíz:** 
El frontend espera una estructura de datos que no coincide con lo que devuelve el backend:

```typescript
// Lo que espera el frontend (línea 434):
const transformedData = {
  vendor: result.data.vendor || 'Unknown Vendor',  // ❌ result.data es undefined
  total: result.data.total || 0,
  date: result.data.date || new Date().toISOString().split('T')[0]
};

// Lo que devuelve el document-orchestrator:
{
  success: true,
  recordId: "uuid",
  recordType: "maintenance",
  extractedData: {  // ✅ Los datos están aquí, no en .data
    vendor: "Aviation Services",
    total: 1250.00,
    date: "2024-01-15"
  }
}
```

---

### 🚨 Problema #2: Errores de Autenticación en document-orchestrator

**Error:** `Unauthorized` en el document-orchestrator

**Causa Raíz:** 
El document-orchestrator verifica la autenticación correctamente, pero hay problemas potenciales con:

1. **Tabla `profiles` no existe:** La migración `20250109200000_fix_foreign_key_constraints.sql` intenta crear políticas RLS para una tabla `profiles` que no existe en la base de datos remota.

2. **Headers de autenticación:** El frontend envía la sesión correctamente, pero la función podría no estar recibiendo el header `Authorization` correctamente.

3. **Políticas RLS incompletas:** La tabla `maintenance_records` tiene políticas básicas, pero podrían ser demasiado restrictivas.

---

### 🚨 Problema #3: Extracción de Datos Básicos e Incompletos

**Síntomas:** 
- Los datos extraídos son muy básicos: "Unknown Vendor", total: 0, etc.
- La información del PDF no se está procesando correctamente

**Causa Raíz:** 
La función `extractMaintenanceDataAdvanced` en el document-orchestrator tiene varios problemas:

1. **Fallback automático:** Si la extracción de texto falla, automáticamente usa datos genéricos:
```typescript
extractedData = {
  vendor: `Manual Review - ${request.fileName}`,
  total: 1,  // ❌ Siempre $1.00 en fallback
  currency: 'USD',
  work_description: `Maintenance work - Manual review required`
};
```

2. **Extracción de texto PDF limitada:** La función `extractTextFromPDFReal` puede no estar extrayendo correctamente el texto de PDFs complejos.

3. **Llamada a OpenAI truncada:** Solo envía los primeros 1500 caracteres del PDF a OpenAI, lo que puede ser insuficiente.

---

### 🚨 Problema #4: Inconsistencia en Flujo de Datos

**Problema:** El document-orchestrator está guardando registros automáticamente, pero el frontend espera un flujo de "extracción → revisión → guardado".

**Causa Raíz:** 
El document-orchestrator actual (líneas 194-214) inserta directamente el registro en la base de datos:

```typescript
// El orquestador guarda automáticamente:
const { data: maintenance, error: maintenanceError } = await supabase
  .from('maintenance_records')
  .insert(maintenanceRecord)
  .select()
  .single();

// Pero el frontend espera que solo se extraigan datos:
setExtractedData(transformedData);  // Para revisión posterior
setModalMode('create');             // No hay record.id todavía
```

---

## 🔧 Soluciones Recomendadas

### 🛠️ Solución #1: Corregir Estructura de Respuesta

**Archivo:** `C:\Users\LABORATORIO\Downloads\desarrollos\ORION OCG\pjet\src\pages\Maintenance.tsx`

**Cambios necesarios en las líneas 433-447:**

```typescript
// Antes (incorrecto):
const transformedData = {
  vendor: result.data.vendor || 'Unknown Vendor',
  total: result.data.total || 0,
  date: result.data.date || new Date().toISOString().split('T')[0]
};

// Después (corregido):
const transformedData = {
  vendor: result.extractedData?.vendor || 'Unknown Vendor',
  total: result.extractedData?.total || 0,
  date: result.extractedData?.date || new Date().toISOString().split('T')[0],
  currency: result.extractedData?.currency || 'USD',
  category: result.extractedData?.maintenance_category || 'Unscheduled Discrepancy',
  breakdown: {
    labor: result.extractedData?.labor_total || 0,
    parts: result.extractedData?.parts_total || 0,
    services: 0,
    freight: 0
  },
  parts: result.extractedData?.parts || [],
  technical_info: {},
  // Agregar el ID del registro si ya existe
  recordId: result.recordId || null
};
```

### 🛠️ Solución #2: Corregir Problemas de Autenticación

**Paso 1:** Verificar si la tabla `profiles` existe:

```sql
-- Ejecutar en la base de datos:
SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles');
```

**Paso 2:** Si no existe, crear la tabla básica:

```sql
-- Crear tabla profiles si no existe
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view their own profile" ON public.profiles 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

**Paso 3:** Modificar el document-orchestrator para mejor manejo de errores de autenticación:

```typescript
// En document-orchestrator/index.ts, línea 25-28:
const { data: { user }, error: userError } = await supabase.auth.getUser();
if (userError || !user) {
  console.error('Authentication failed:', userError?.message);
  throw new Error('Unauthorized: User authentication required');
}
```

### 🛠️ Solución #3: Mejorar Extracción de Datos PDF

**Mejora 1:** Aumentar el límite de caracteres enviados a OpenAI:

```typescript
// En extractMaintenanceDataAdvanced, línea 394:
// Cambiar de 1500 a 4000 caracteres
`${pdfText.substring(0, 4000)}`
```

**Mejora 2:** Mejorar el manejo de fallback:

```typescript
// En lugar de usar siempre valores genéricos, intentar extraer del nombre del archivo:
const fileAnalysis = analyzeFileName(request.fileName);
extractedData = {
  vendor: fileAnalysis.vendor || `Manual Review - ${request.fileName}`,
  total: fileAnalysis.amount || 0,  // Usar monto del nombre si existe
  currency: 'USD',
  invoice_number: fileAnalysis.invoice || null,
  work_description: fileAnalysis.description || `Maintenance work - ${request.fileName}`,
  aircraft_registration: fileAnalysis.aircraft || null
};
```

**Mejora 3:** Agregar mejor logging para diagnóstico:

```typescript
// En extractTextFromPDFReal:
console.log(`🔍 PDF Processing Details:`);
console.log(`- File size: ${uint8Array.length} bytes`);
console.log(`- Extracted text length: ${extractedText.length}`);
console.log(`- Sample text: "${extractedText.substring(0, 200)}..."`);
console.log(`- Extraction methods used: ${methodsUsed.join(', ')}`);
```

### 🛠️ Solución #4: Ajustar Flujo de Trabajo

**Opción A:** Modificar el orquestador para que solo extraiga datos (no guarde automáticamente):

```typescript
// Cambiar el return de processMaintenanceDocumentAdvanced:
return {
  success: true,
  extractedData: extractedData,
  uploadSource: request.uploadSource,
  documentHash: documentHash,
  // NO guardar automáticamente - dejar que el frontend decida
  autoSaved: false
};
```

**Opción B:** Ajustar el frontend para manejar ambos casos:

```typescript
// En Maintenance.tsx, después de recibir la respuesta:
if (result.recordId) {
  // El registro ya fue guardado automáticamente
  setSelectedRecord(result.recordId);
  setModalMode('edit');
} else {
  // Solo se extrajeron datos,需要手动保存
  setSelectedRecord(null);
  setModalMode('create');
}
```

---

## 🧪 Herramientas de Diagnóstico Creadas

He creado dos scripts de prueba para ayudar a diagnosticar los problemas:

1. **`debug-auth-test.js`** - Prueba autenticación y acceso a funciones
2. **`debug-pdf-processing.js`** - Prueba procesamiento de PDFs y formato de respuesta

**Cómo usar:**
```bash
# Instalar dependencias
npm install @supabase/supabase-js dotenv

# Configurar variables de entorno
echo "SUPABASE_URL=tu-url" > .env
echo "SUPABASE_ANON_KEY=tu-key" >> .env

# Ejecutar pruebas
node debug-auth-test.js
node debug-pdf-processing.js
```

---

## 📝 Pasos de Acción Inmediata

### Prioridad ALTA (Corregir primero):
1. **Corregir el TypeError en Maintenance.tsx:434** - Cambiar `result.data.vendor` a `result.extractedData?.vendor`
2. **Verificar/crear tabla profiles** - Ejecutar el SQL para crear la tabla profiles
3. **Probar con los scripts de diagnóstico** - Usar los scripts para confirmar que los problemas están resueltos

### Prioridad MEDIA:
4. **Mejorar la extracción de PDFs** - Aumentar límite de caracteres y mejorar fallback
5. **Ajustar el flujo de trabajo** - Decidir si el orquestador guarda automáticamente o no

### Prioridad BAJA:
6. **Optimizar políticas RLS** - Ajustar permisos si es necesario
7. **Agregar logging adicional** - Para mejor diagnóstico futuro

---

## 🎯 Resultado Esperado

Después de aplicar estas soluciones:

✅ **Frontend no tendrá errores TypeError**
✅ **Autenticación funcionará correctamente** 
✅ **Extracción de PDFs será más precisa**
✅ **Flujo de trabajo será consistente**
✅ **Usuarios podrán procesar PDFs con datos completos**

---

## 📞 Soporte

Si encuentras problemas durante la implementación de estas soluciones:

1. Ejecuta los scripts de diagnóstico primero
2. Revisa los logs de la consola para mensajes de error detallados
3. Verifica que las variables de entorno estén configuradas correctamente
4. Confirma que la estructura de la base de datos coincida con las migraciones

**Archivos clave a monitorear:**
- `src/pages/Maintenance.tsx` (frontend)
- `supabase/functions/document-orchestrator/index.ts` (backend)
- `supabase/migrations/` (estructura de base de datos)

---

*Investigación completada el 2025-09-11*