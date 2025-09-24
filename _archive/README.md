# 📁 Archivo de Desarrollo - ORION OCG

Este directorio contiene archivos de desarrollo, debug y testing que fueron movidos desde el directorio raíz para mantener la organización del proyecto.

## 📋 Estructura de Archivado

### `/debug-scripts`
Scripts de testing y debugging utilizados durante el desarrollo del sistema de procesamiento de PDFs y extracción de datos de mantenimiento.

### `/sql-patches`
Scripts SQL utilizados para migraciones, fixes y testing de la base de datos durante el desarrollo.

### `/pdf-samples`
Archivos PDF de muestra utilizados para testing del sistema de extracción de datos.

### `/orchestrator-versions`
Versiones previas y iteraciones del document-orchestrator durante su desarrollo.

## 🗂️ Propósito

Estos archivos se mantienen por:
- **Valor histórico**: Documentan el proceso de desarrollo y debugging
- **Referencia futura**: Pueden ser útiles para troubleshooting similar
- **Auditabilidad**: Preservan el contexto de decisiones técnicas tomadas

## ⚠️ Nota Importante

Estos archivos NO son parte del código en producción. La implementación final se encuentra en las ubicaciones correctas del proyecto:
- Edge Functions: `supabase/functions/`
- Componentes: `src/components/`
- Páginas: `src/pages/`

---
*Archivado por: claude-code | Fecha: 2025-01-09*