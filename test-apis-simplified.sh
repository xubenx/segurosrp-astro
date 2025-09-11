#!/bin/bash

echo "🧪 Iniciando tests de APIs con datos simplificados..."

# Función para mostrar el resultado de cada test
check_api() {
    local api_name="$1"
    local url="$2"
    local data="$3"
    
    echo ""
    echo "🔍 Testing: $api_name"
    echo "📤 URL: $url"
    echo "📋 Data: $data"
    echo "---"
    
    response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "$url")
    
    echo "📥 Response: $response"
    
    # Verificar si la respuesta contiene success: true
    if echo "$response" | grep -q '"success":true'; then
        echo "✅ $api_name: SUCCESS"
    else
        echo "❌ $api_name: FAILED"
    fi
    echo "========================="
}

# Test 1: API Contact con datos mínimos
contact_data='{
    "name": "Test Contact",
    "email": "test@example.com",
    "phone": "1234567890",
    "message": "Test message"
}'

check_api "Contact API" "http://localhost:4322/api/contact" "$contact_data"

# Test 2: API SeguBeca con datos mínimos  
segubeca_data='{
    "name": "Test Student",
    "email": "student@example.com",
    "phone": "0987654321",
    "university": "Test University",
    "career": "Test Career",
    "semester": "1"
}'

check_api "SeguBeca API" "http://localhost:4322/api/segubeca-contact" "$segubeca_data"

# Test 3: API Lead con datos mínimos
lead_data='{
    "name": "Test Lead",
    "email": "lead@example.com",
    "phone": "5555555555"
}'

check_api "Lead API" "http://localhost:4322/api/lead" "$lead_data"

echo ""
echo "🏁 Tests completados. Revisa los logs del servidor para detalles de Firebase."
