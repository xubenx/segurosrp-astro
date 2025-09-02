#!/bin/bash

# Script para obtener el Chat ID de Telegram
echo "🤖 Obteniendo información del bot de Telegram..."

BOT_TOKEN="8087584324:AAETE1vWJsowowmqSsiNnF4jbaomo5bk0DA"

echo ""
echo "📋 PASOS PARA OBTENER CHAT ID:"
echo "1. Agrega tu bot @segurosrp_bot al grupo"
echo "2. Envía cualquier mensaje en el grupo (ej: 'Hola bot')"
echo "3. Ejecuta este comando para ver los updates:"

echo ""
echo "curl -s \"https://api.telegram.org/bot${BOT_TOKEN}/getUpdates\" | jq '.'"

echo ""
echo "🔍 Busca en la respuesta el 'chat' object que tenga:"
echo "   - \"type\": \"group\" o \"supergroup\""
echo "   - \"id\": -1234567890 (número negativo para grupos)"
echo ""
echo "💡 El Chat ID será ese número negativo (ej: -1234567890)"
