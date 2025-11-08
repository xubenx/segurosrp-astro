#!/bin/bash

echo "🔥 Probando Rate Limiting - Enviando múltiples requests..."
echo "Configuración: Máximo 3 requests por minuto por IP"
echo ""

API_URL="http://localhost:4321/api/sendToSheet"
STATS_URL="http://localhost:4321/api/rate-limit-stats?secret=debug-rate-limit-2024"

# Datos de prueba
DATA='{"name":"Prueba Rate Limit","email":"test@example.com","phone":"1234567890"}'

# Función para hacer request y mostrar resultado
make_request() {
    local i=$1
    echo "📤 Request #$i..."
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$API_URL" \
        -H "Content-Type: application/json" \
        -d "$DATA")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [ "$http_code" = "429" ]; then
        echo "🚫 BLOQUEADO (HTTP $http_code): $body"
    elif [ "$http_code" = "200" ]; then
        echo "✅ PERMITIDO (HTTP $http_code): $body"
    else
        echo "❓ OTRO (HTTP $http_code): $body"
    fi
    echo ""
}

# Enviar 5 requests rápidamente para probar el límite
for i in {1..6}; do
    make_request $i
    sleep 0.5
done

echo "📊 Obteniendo estadísticas del rate limiter..."
curl -s "$STATS_URL" | jq '.' || curl -s "$STATS_URL"
echo ""

echo "⏳ Esperando 65 segundos para que se resetee el límite..."
echo "Puedes cancelar con Ctrl+C si no quieres esperar"

# Cuenta regresiva opcional
for i in {65..1}; do
    printf "\r⏳ Esperando %02d segundos..." $i
    sleep 1
done
echo ""

echo "🔄 Probando después del reset..."
make_request "RESET-1"
make_request "RESET-2"

echo "📊 Estadísticas finales:"
curl -s "$STATS_URL" | jq '.' || curl -s "$STATS_URL"