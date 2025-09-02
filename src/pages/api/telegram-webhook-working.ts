import type { APIRoute } from 'astro';

// Función para enviar mensaje de confirmación simple
async function sendSimpleConfirmation(chatId: string, messageId: number, newStatus: string) {
  const statusEmojis: { [key: string]: string } = {
    'revisado': '✅',
    'contactado': '📞', 
    'cerrado': '❌'
  };

  const statusTexts: { [key: string]: string } = {
    'revisado': 'REVISADO',
    'contactado': 'CONTACTADO',
    'cerrado': 'CERRADO'
  };

  const updatedMessage = `🔔 *LEAD ACTUALIZADO - Seguros RP*

📊 *Estado:* ${statusEmojis[newStatus]} ${statusTexts[newStatus]}
🕐 *Actualizado:* ${new Date().toLocaleString('es-MX')}

✅ Cambio de estado procesado correctamente`;

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId,
        text: updatedMessage,
        parse_mode: 'Markdown'
      }),
    });
    
    return response.ok;
  } catch (error) {
    console.error('Error editando mensaje:', error);
    return false;
  }
}

export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    status: 'Telegram Webhook Simple endpoint is working',
    timestamp: new Date().toISOString(),
    webhook_url: 'https://segurosrp.com/api/telegram-webhook-simple'
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('🔄 Webhook Simple recibido de Telegram');
    
    const text = await request.text();
    console.log('📝 Body:', text);
    
    if (!text || text.trim() === '') {
      return new Response(JSON.stringify({ status: 'OK' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const body = JSON.parse(text);
    console.log('📦 Update:', JSON.stringify(body, null, 2));

    // Verificar si es un callback query (botón presionado)
    if (body.callback_query && body.callback_query.message) {
      const callbackQuery = body.callback_query;
      console.log('🔘 Botón presionado:', callbackQuery.data);
      
      const statusMap: Record<string, string> = {
        'review': 'revisado',
        'contacted': 'contactado', 
        'close': 'cerrado'
      };
      
      const newStatus = statusMap[callbackQuery.data || ''];
      
      if (newStatus) {
        // Editar el mensaje para mostrar el nuevo estado
        await sendSimpleConfirmation(
          callbackQuery.message.chat.id.toString(),
          callbackQuery.message.message_id,
          newStatus
        );
        
        // Responder al callback query
        try {
          await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              callback_query_id: callbackQuery.id,
              text: `✅ Estado: ${newStatus.toUpperCase()}`,
              show_alert: false
            })
          });
        } catch (error) {
          console.error('Error respondiendo callback:', error);
        }
        
        console.log(`✅ Estado cambiado a: ${newStatus}`);
      }
    }

    return new Response(JSON.stringify({ status: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error en webhook:', error);
    return new Response(JSON.stringify({ status: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
