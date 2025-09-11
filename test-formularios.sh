#!/bin/bash

# Script para probar todos los formularios de la aplicación

BASE_URL="http://localhost:4321"

echo "🚀 Iniciando pruebas de formularios..."
echo "=================================="

# Prueba 1: API Contact (formulario genérico)
echo "📝 Probando API Contact (formulario genérico)..."
curl -X POST "$BASE_URL/api/contact" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Usuario Genérico",
    "email": "test@example.com",
    "phone": "4425958912",
    "message": "Mensaje de prueba para formulario genérico"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Error en respuesta JSON"

echo ""
echo "=================================="

# Prueba 2: API Segubeca Contact
echo "📝 Probando API Segubeca Contact..."
curl -X POST "$BASE_URL/api/segubeca-contact" \
  -H "Content-Type: application/json" \
  -d '{
    "parentName": "María García",
    "childName": "Sofía García",
    "parentAge": "35",
    "childAge": "8",
    "monthlySavings": "$3,000 - $5,000 MXN",
    "email": "maria.garcia@example.com",
    "whatsapp": "4425958912"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Error en respuesta JSON"

echo ""
echo "=================================="

# Prueba 3: API Lead Unificada (Vida Mujer)
echo "📝 Probando API Lead (Vida Mujer)..."
curl -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ana López",
    "email": "ana.lopez@example.com",
    "phone": "4425958912",
    "city": "Querétaro",
    "age": "25–34 años",
    "contact": "WhatsApp (Preferido)",
    "notes": "Estoy interesada en proteger mi ingreso y a mi familia",
    "source": "Vida Mujer Landing Test",
    "campaign": "SEM Vida Mujer Test"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Error en respuesta JSON"

echo ""
echo "=================================="

# Prueba 4: API Lead Unificada (Asesores Monterrey)
echo "📝 Probando API Lead (Asesores Monterrey)..."
curl -X POST "$BASE_URL/api/lead" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Carlos Rodríguez",
    "email": "carlos.rodriguez@example.com",
    "telefono": "4425958912",
    "edad": "26-35",
    "tipoSeguro": "vida",
    "message": "Edad: 26-35, Tipo de seguro: vida. Necesito cotización para seguro de vida",
    "source": "Landing Asesores Monterrey NYL Test",
    "campaign": "SEM Google Ads Test"
  }' \
  -w "\nStatus: %{http_code}\n" \
  -s | jq '.' || echo "Error en respuesta JSON"

echo ""
echo "=================================="
echo "✅ Pruebas completadas!"
echo "🔍 Revisa los logs del servidor para más detalles"
