#!/bin/bash

# Script para probar el bot de Telegram
BOT_TOKEN="8087584324:AAETE1vWJsowowmqSsiNnF4jbaomo5bk0DA"

echo "🤖 PROBANDO BOT DE TELEGRAM"
echo "================================="

# Obtener información del bot
echo "📋 Información del bot:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getMe" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['ok']:
    bot = data['result']
    print(f\"✅ Bot: {bot['first_name']} (@{bot['username']})\")
    print(f\"🆔 Bot ID: {bot['id']}\")
else:
    print('❌ Error obteniendo info del bot')
"

echo ""
echo "📬 Obteniendo updates recientes:"
curl -s "https://api.telegram.org/bot${BOT_TOKEN}/getUpdates" | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['ok'] and data['result']:
    for update in data['result']:
        if 'message' in update:
            msg = update['message']
            chat = msg['chat']
            print(f\"💬 Mensaje de: {chat.get('title', chat.get('first_name', 'Unknown'))}\")
            print(f\"🆔 Chat ID: {chat['id']}\")
            print(f\"📝 Tipo: {chat['type']}\")
            print(f\"📄 Texto: {msg.get('text', 'No text')}\")
            print(\"-\" * 40)
else:
    print('📭 No hay mensajes aún. Agrega el bot a un grupo y envía un mensaje.')
"
