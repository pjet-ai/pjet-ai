# Información de Usuario para Pruebas en Supabase

## Usuario de Prueba Creado

### Información del Usuario
- **User ID**: `b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7`
- **Email**: `test@example.com`
- **Contraseña**: `password123`
- **Estado**: Confirmado y activo

### Registro de Mantenimiento Creado
- **ID del Registro**: `42ea0835-5372-45fb-89b4-dab249f22aed`
- **Matrícula**: EC-ABC
- **Tipo de Mantenimiento**: Scheduled Inspection
- **Orden de Trabajo**: WO-001
- **Estado**: Pending

## Cómo Usar este User ID

Para registrar datos en la tabla `maintenance_records`, usa el siguiente user_id:

```javascript
const userId = 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7';
```

### Ejemplo de Insert:

```javascript
const { data, error } = await supabase
  .from('maintenance_records')
  .insert({
    user_id: 'b7f98427-bc1b-4a3a-b4d0-c5eeead1bad7',
    date: '2025-09-11',
    vendor: 'Taller Aeronáutico S.A.',
    total: 1500.00,
    currency: 'USD',
    aircraft_registration: 'EC-ABC',
    maintenance_type: 'Scheduled Inspection',
    work_order_number: 'WO-002',
    work_description: 'Descripción del mantenimiento',
    status: 'Pending',
    technician_name: 'Nombre del técnico'
  });
```

## Estructura de la Tabla maintenance_records

Las columnas principales que puedes usar:
- `user_id` (UUID, requerido) - Referencia al usuario
- `date` (DATE, requerido) - Fecha del mantenimiento
- `vendor` (TEXT, requerido) - Proveedor del servicio
- `total` (DECIMAL, requerido) - Total del mantenimiento
- `currency` (TEXT, requerido) - Moneda (default: USD)
- `aircraft_registration` (TEXT) - Matrícula de la aeronave
- `maintenance_type` (TEXT) - Tipo de mantenimiento
- `work_order_number` (TEXT) - Número de orden de trabajo
- `work_description` (TEXT) - Descripción del trabajo
- `status` (TEXT) - Estado del mantenimiento
- `technician_name` (TEXT) - Nombre del técnico
- `labor_hours` (DECIMAL) - Horas de mano de obra
- `labor_rate_per_hour` (DECIMAL) - Tarifa por hora
- `labor_total` (DECIMAL) - Total de mano de obra
- `parts_total` (DECIMAL) - Total de partes

## Notas Importantes

1. Este user_id es válido para uso en desarrollo y pruebas
2. El usuario está confirmado y puede ser usado para operaciones
3. Las políticas de RLS (Row Level Security) permiten que este usuario cree y gestione sus propios registros
4. Para producción, deberás crear usuarios reales a través del flujo de autenticación normal