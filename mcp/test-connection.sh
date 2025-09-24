#!/bin/bash

echo "=== Conectando al Servidor MCP Supabase ==="
echo "Project Ref: $SUPABASE_PROJECT_REF"
echo "Access Token: ${SUPABASE_ACCESS_TOKEN:0:10}..."
echo

# Configurar variables de entorno
export SUPABASE_ACCESS_TOKEN=sbp_d6630f75fb819930dbfc6ee2fb13677f8ca1192a
export SUPABASE_PROJECT_REF=mdwzohybippygoaqjtrq

echo "Intentando iniciar servidor MCP directamente..."
echo

# Intentar iniciar servidor en background
npx -y @supabase/mcp-server-supabase@latest --project-ref=$SUPABASE_PROJECT_REF &
SERVER_PID=$!

# Esperar a que se inicie
echo "Esperando 15 segundos para que el servidor inicie..."
sleep 15

echo
echo "Probando conexión..."
curl -s http://localhost:3001/health
echo

# Verificar si el servidor está corriendo
if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Servidor MCP Supabase iniciado con PID: $SERVER_PID"
    echo "🔗 Puerto: 3001"
    echo "🛑 Para detener: kill $SERVER_PID"
    
    # Mantenerlo corriendo un poco más
    echo "Manteniendo servidor activo por 30 segundos..."
    sleep 30
    
    # Detener servidor
    kill $SERVER_PID
    echo "Servidor detenido"
else
    echo "❌ El servidor no se pudo iniciar correctamente"
fi