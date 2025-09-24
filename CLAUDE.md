# 🚁 ORION OCG - Sistema de Gestión de Aviación

> **Para Gemini**: Este archivo contiene únicamente información del proyecto ORION OCG. Úsalo como contexto cuando Claude Code te consulte sobre análisis técnico, arquitectura o recomendaciones.

## 📋 Resumen del Proyecto

ORION OCG es una aplicación web integral para la gestión de operaciones de aviación que incluye:

- **Gestión de Vuelos**: Registro y seguimiento de vuelos con logbook completo
- **Módulo de Mantenimiento**: Sistema completo de gestión de mantenimiento de aeronaves con funcionalidades CRUD, búsqueda, filtros y exportación
- **Módulo de Gastos**: Gestión de gastos operacionales con integración de facturas
- **Análisis y Reportes**: Dashboard con métricas y análisis de datos
- **Gestión de Aeropuertos**: Base de datos completa de aeropuertos

## 🛠️ Stack Tecnológico

### Frontend
- **Vite 5.4.10** - Build tool y development server
- **React 18.3.1** - Framework principal
- **TypeScript 5.6.3** - Lenguaje de programación
- **React Router DOM 6.26.2** - Navegación
- **Tailwind CSS 3.4.11** - Framework CSS
- **shadcn/ui** - Biblioteca de componentes UI (Radix UI + Tailwind)
- **React Hook Form 7.53.1** - Manejo de formularios
- **Zod 3.23.8** - Validación de esquemas
- **TanStack Query 5.59.16** - State management y data fetching
- **Recharts 2.13.0** - Gráficos y visualizaciones
- **Lucide React** - Iconografía

### Backend y Base de Datos
- **Supabase** - Backend as a Service (PostgreSQL + Auth + Storage + Edge Functions)
- **Edge Functions** - Para procesamiento de PDFs y extracción de datos

### Herramientas de Desarrollo
- **ESLint** - Linting
- **TypeScript ESLint** - Linting específico para TypeScript
- **Bun** - Runtime alternativo y manejador de paquetes (disponible como opción)
- **Lovable Tagger** - Integración con plataforma Lovable

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes base de shadcn/ui
│   ├── Navigation.tsx   # Navegación principal
│   ├── ExpenseReviewModal.tsx
│   ├── AirportAutocomplete.tsx
│   ├── CompleteMaintenanceModal.tsx
│   ├── PdfViewerModal.tsx
│   ├── UploadInvoiceModal.tsx
│   ├── AuditReportModal.tsx            # Sistema de auditoría aeronáutica
│   ├── MaintenanceFilters.tsx          # Filtros avanzados
│   ├── MaintenanceReviewModal.tsx      # Modal de revisión
│   └── ResponsiveFilterTrigger.tsx     # UI responsive
├── pages/              # Páginas principales
│   ├── Dashboard.tsx    # Dashboard principal
│   ├── Analytics.tsx    # Página de análisis
│   ├── Expenses.tsx     # Gestión de gastos
│   ├── Maintenance.tsx  # Módulo de mantenimiento
│   ├── FlightLogbook.tsx
│   ├── FlightHistory.tsx
│   ├── NewFlight.tsx
│   └── EditFlight.tsx
├── types/              # Definiciones de tipos TypeScript
│   └── maintenance.ts  # Tipos específicos de mantenimiento aeronáutico
├── utils/              # Utilidades y helpers
│   └── maintenanceUtils.ts # Utilidades para clasificación automática
└── App.tsx             # Componente raíz
```

### Estructura Supabase
```
supabase/
├── functions/          # Edge Functions (9 funciones esenciales optimizadas)
│   ├── document-orchestrator/           # Orquestador principal (v11)
│   ├── robust-pdf-processor/           # Pre-procesador inteligente (núcleo del sistema)
│   ├── extract-maintenance-ultimate/    # Procesamiento avanzado PDFs mantenimiento (v2)
│   ├── extract-expense-complete/        # Procesamiento completo gastos (v1)
│   ├── extract-expense-text/           # Extracción básica texto gastos (v2)
│   ├── extract-structure-stage1/       # Extracción de estructura (pipeline multi-stage)
│   ├── intelligent-chunker-stage2/      # Chunking inteligente (pipeline multi-stage)
│   ├── save-maintenance-record/        # Persistencia de datos (consentimiento usuario)
│   └── unified-pdf-extractor-fixed/     # Extractor PDF unificado y corregido
└── migrations/         # 8 migraciones sincronizadas
```

### Estructura de Testing y Depuración
```
_archive/              # Archivos históricos de desarrollo
├── debug-scripts/     # Scripts de testing y depuración de PDFs
├── sql-patches/       # Scripts SQL para migraciones y fixes
├── pdf-samples/       # PDFs de muestra para testing
└── orchestrator-versions/  # Versiones previas del orquestador
```

## ⚙️ Funcionalidades Principales

### 1. Dashboard
- Métricas generales del sistema
- Gráficos de rendimiento
- Resumen de vuelos, mantenimientos y gastos

### 2. Gestión de Vuelos
- Registro de vuelos con detalles completos
- Logbook de vuelos
- Historial y edición de vuelos
- Integración con base de datos de aeropuertos

### 3. Módulo de Mantenimiento (Completamente Implementado)
- CRUD completo para registros de mantenimiento
- Sistema de auditoría con 4 categorías aeronáuticas
- Clasificación automática: Scheduled Inspection, Component Failure, Corrosion, Unscheduled Discrepancy
- Breakdown financiero detallado (Labor, Parts, Services, Freight)
- Funcionalidades de búsqueda y filtrado avanzado
- Exportación a CSV y PDF
- Modal para completar mantenimientos
- Integración con procesamiento avanzado de PDFs
- Trazabilidad completa para auditorías FAA/EASA

### 4. Gestión de Gastos
- Registro de gastos operacionales
- Carga de facturas en PDF
- Procesamiento automático de facturas con IA
- Modal de revisión de gastos

### 5. Análisis y Reportes
- Dashboards interactivos
- Gráficos con Recharts
- Métricas de rendimiento

### 6. Sistema de Orquestación de Documentos (Arquitectura Multi-Stage)

#### Arquitectura Principal: Pipeline Inteligente
- **robust-pdf-processor**: Pre-procesador inteligente que analiza PDFs y determina estrategia óptima
- **document-orchestrator**: Orquestador central para routing automático entre módulos
- **Pipeline Multi-Stage**: `extract-structure-stage1` → `intelligent-chunker-stage2` → Procesamiento OpenAI
- **extract-maintenance-ultimate**: Procesamiento especializado para facturas de mantenimiento
- **unified-pdf-extractor-fixed**: Extractor PDF unificado con manejo de contenido comprimido

#### Características Avanzadas
- **Ruteo Inteligente**: Selección automática de estrategia basada en complejidad del PDF
- **Deduplicación Cross-Table**: Validación de hashes para evitar duplicados
- **Caché Inteligente**: Evita reprocesamiento de documentos
- **Validación Pre-Persistencia**: Verificación de datos antes de guardar
- **Clasificación Automática**: 4 categorías aeronáuticas (FAA/EASA compliant)
- **Manejo de PDFs Comprimidos**: Extracción robusta de contenido codificado

#### Workflow Anti-Pattern
- **Extract and Review**: `extract-maintenance-data` solo extrae datos sin guardar
- **User Consent**: `save-maintenance-record` requiere confirmación explícita
- **No Automatic Persistence**: Los datos nunca se guardan sin consentimiento del usuario

## 📝 Convenciones de Desarrollo

### Naming Conventions
- **Componentes**: PascalCase (ej: `MaintenanceModal.tsx`)
- **Páginas**: PascalCase (ej: `Dashboard.tsx`)
- **Tipos**: PascalCase con interfaces (ej: `interface User {}`)
- **Variables/funciones**: camelCase
- **Archivos**: kebab-case para utilidades, PascalCase para componentes

### Estructura de Componentes
- Usar React functional components con hooks
- TypeScript con tipado estricto
- Props interface definida para cada componente
- Uso de Zod para validación de formularios
- shadcn/ui para componentes base

### Estado y Data Fetching
- TanStack Query para data fetching y cache
- React Hook Form para formularios
- Supabase client para operaciones de base de datos

### Estilos
- Tailwind CSS para estilos
- Componentes shadcn/ui como base
- Design system consistente
- Responsive design mobile-first

## 🚀 Comandos Útiles

```bash
# Desarrollo (npm/npx)
npm run dev          # Iniciar servidor de desarrollo
npm run build        # Build para producción  
npm run build:dev    # Build para desarrollo
npm run lint         # Ejecutar linting
npm run preview      # Preview del build

# Desarrollo (bun - alternativa)
bun run dev          # Iniciar servidor de desarrollo
bun run build        # Build para producción
bun run lint         # Ejecutar linting
bun run preview      # Preview del build

# Base de datos (Supabase)
npx supabase start   # Iniciar Supabase localmente
npx supabase db reset # Reset base de datos local
npx supabase functions list # Listar Edge Functions remotas
npx supabase migration list # Ver estado de migraciones
npx supabase db diff --linked # Verificar diferencias con remoto

# Depuración y Testing
node _archive/debug-scripts/debug-complete-pipeline.js  # Debug pipeline completo
node _archive/debug-scripts/test-real-extractor.cjs     # Test extractor PDF

# Limpieza de Funciones (depuración)
npx supabase functions delete <function-name>  # Eliminar funciones obsoletas
rm -rf supabase/functions/<function-name>       # Eliminar directorios locales
```

## 📋 Notas Importantes

1. **Integración con Lovable**: El proyecto está integrado con la plataforma Lovable para desarrollo colaborativo
2. **Supabase Configuration**: Asegúrate de que las variables de entorno de Supabase estén configuradas
3. **Edge Functions**: Las funciones de procesamiento de PDFs requieren configuración específica en Supabase
4. **Responsive Design**: Todos los componentes deben ser responsive y seguir mobile-first approach
5. **Accesibilidad**: Usar componentes de Radix UI que incluyen accesibilidad por defecto
6. **Archivo de Desarrollo**: Los archivos históricos se mantienen en `_archive/` para depuración y referencia
7. **Gestión de Archivos**: Evitar dejar archivos temporales en la raíz - usar `_archive/` para desarrollo
8. **Limpieza de Functions**: Mantener solo funciones esenciales. Eliminar versiones obsoletas para evitar deuda técnica
9. **PDF Processing**: Los PDFs grandes con contenido comprimido requieren manejo especial (caracteres garabateados → contenido legible)
10. **Anti-Pattern Workflow**: Nunca guardar datos automáticamente sin consentimiento explícito del usuario

## 🎯 Estado Actual del Proyecto

- ✅ Módulo de Mantenimiento completamente implementado con auditoría avanzada
- ✅ Sistema de gestión de gastos funcional
- ✅ Módulo de Vuelos completamente implementado
  - ✅ EditFlight.tsx - Edición de vuelos
  - ✅ FlightHistory.tsx - Historial completo
  - ✅ FlightLogbook.tsx - Logbook digital
  - ✅ NewFlight.tsx - Registro de nuevos vuelos
- ✅ Dashboard con métricas avanzadas
- ✅ Analytics funcional con reportes
- ✅ Navegación y routing implementado
- ✅ Sistema de orquestación de documentos optimizado (9 funciones esenciales)
- 🔄 **Problema Crítico Actual**: PDFs grandes (54+ páginas) con contenido comprimido que aparece como caracteres garabateados (þ¨Áló¦¹wÿäçMÒ8...)
- 🔄 **Solución en Desarrollo**: Implementación de PDF-to-text converter robusto para manejar contenido comprimido/encodificado

## 🔮 Contexto de la Industria Aeronáutica

### Normativas y Estándares
- **FAA (Federal Aviation Administration)**: Regulaciones estadounidenses
- **EASA (European Union Aviation Safety Agency)**: Regulaciones europeas
- **Trazabilidad**: Historial inmutable de mantenimientos requerido por ley
- **Certificaciones**: Documentación rigurosa de todos los procedimientos

### Consideraciones Técnicas Específicas
- **Componentes con Vida Útil**: Tracking por horas de vuelo, ciclos y tiempo calendario
- **Mantenimiento Predictivo**: Anticipar necesidades basadas en uso real
- **Documentación Legal**: Cada acción debe ser auditable y trazable
- **Disponibilidad Offline**: Técnicos trabajando en hangares sin conectividad constante
- **Precisión Crítica**: Los errores pueden tener consecuencias de seguridad graves

## 🎯 Casos de Uso Recomendados para Consulta

Cuando Claude Code te consulte, estos son escenarios típicos donde puedes aportar máximo valor:

### Para Módulo de Mantenimiento
- Normativas de mantenimiento aeronáutico (FAA/EASA)
- Mejores prácticas de trazabilidad
- Gestión de ciclo de vida de componentes

### Para Optimización de Componentes React
- Patrones de optimización para formularios complejos
- Rendimiento con grandes volúmenes de datos
- Convenciones shadcn/ui

### Para Arquitectura de Supabase
- Mejores prácticas Edge Functions
- Optimización de consultas PostgreSQL
- Estrategias de caching

### Para Validaciones con Zod
- Esquemas para datos aeronáuticos
- Validaciones cruzadas complejas
- Patrones React Hook Form avanzados

### Para Análisis de Performance
- Optimización TanStack Query
- Estrategias de lazy loading
- Code splitting para aplicaciones grandes