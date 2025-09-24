#!/bin/sh

# Iniciar servidor MCP de Supabase
echo "Iniciando servidor MCP de Supabase..."

# Configurar variables de entorno
export SUPABASE_ACCESS_TOKEN=sbp_d6630f75fb819930dbfc6ee2fb13677f8ca1192a
export SUPABASE_PROJECT_REF=mdwzohybippygoaqjtrq

# Esperar a que npm instale el paquete
echo "Esperando a que se complete la instalación de npm..."
sleep 5

# Verificar si el paquete está instalado
if [ ! -d "node_modules/@supabase" ]; then
    echo "Instalando @supabase/mcp-server-supabase..."
    npm install -y @supabase/mcp-server-supabase@latest
fi

# Mostrar ayuda del servidor
echo "=== Información del servidor MCP Supabase ==="
echo "Project Ref: $SUPABASE_PROJECT_REF"
echo "Token: ${SUPABASE_ACCESS_TOKEN:0:10}..."
echo

# Iniciar servidor MCP en modo interactivo
echo "Iniciando servidor MCP interactivo..."
echo "Presione Ctrl+C para detener"
echo

# Iniciar servidor directamente
exec npx -y @supabase/mcp-server-supabase@latest --project-ref=$SUPABASE_PROJECT_REF