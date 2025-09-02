#!/bin/bash

BOT_TOKEN="8087584324:AAETE1vWJsowowmqSsiNnF4jbaomo5bk0DA"
CHAT_ID="-1002906742045"

echo "🤖 PROBANDO SISTEMA COMPLETO DE TELEGRAM"
echo "========================================="

echo ""
echo "1️⃣ Verificando webhook configurado..."
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['ok']:
    info = data['result']
    print(f'✅ URL: {info.get(\"url\", \"No configurado\")}')
    print(f'📊 Updates pendientes: {info.get(\"pending_update_count\", 0)}')
    if info.get('last_error_date'):
        print(f'❌ Último error: {info.get(\"last_error_message\", \"Unknown\")}')
    else:
        print('✅ Sin errores recientes')
"

echo ""
echo "2️⃣ Enviando mensaje de prueba con botones..."

# Enviar mensaje con botones interactivos
curl -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -H "Content-Type: application/json" \
  -d "{
    \"chat_id\": \"${CHAT_ID}\",
    \"text\": \"🔔 *PRUEBA DE LEAD - Seguros RP*\n\n👤 *Nombre:* Juan Pérez\n📧 *Email:* juan@example.com\n📱 *Teléfono:* +52 442 123 4567\n💬 *Mensaje:* Interesado en seguro de vida\n\n📅 *Fecha:* $(date '+%d/%m/%Y %H:%M')\n📊 *Estado:* 🟡 Pendiente\n🆔 *ID:* test-$(date +%s)\",
    \"parse_mode\": \"Markdown\",
    \"reply_markup\": {
      \"inline_keyboard\": [
        [
          {
            \"text\": \"✅ Marcar como Revisado\",
            \"callback_data\": \"review\"
          },
          {
            \"text\": \"📞 Contactado\",
            \"callback_data\": \"contacted\"
          }
        ],
        [
          {
            \"text\": \"❌ Cerrar Lead\",
            \"callback_data\": \"close\"
          }
        ]
      ]
    }
  }" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['ok']:
    print('✅ Mensaje de prueba enviado correctamente')
    print(f'📝 Message ID: {data[\"result\"][\"message_id\"]}')
else:
    print('❌ Error enviando mensaje:', data.get('description', 'Unknown'))
"

echo ""
echo "3️⃣ Verificando endpoint GET del webhook..."
curl -s "https://segurosrp.com/api/telegram-webhook-working" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    print('✅ Endpoint respondiendo:', data.get('status', 'Unknown'))
    print(f'🕐 Timestamp: {data.get(\"timestamp\", \"Unknown\")}')
except:
    print('❌ Error accediendo al endpoint')
"

echo ""
echo "✅ PRUEBA COMPLETADA"
echo "📱 Revisa tu grupo de Telegram y prueba los botones"
