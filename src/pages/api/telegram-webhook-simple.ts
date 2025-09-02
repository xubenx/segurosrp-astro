import type { APIRoute } from 'astro';

// Interfaces para Telegram
interface TelegramMessage {
  message_id: number;
  chat: {
    id: number;
  };
  text?: string;
}

interface TelegramCallbackQuery {
  id: string;
  data?: string;
  message?: TelegramMessage;
}

interface TelegramUpdate {
  callback_query?: TelegramCallbackQuery;
}

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Función para enviar mensaje de confirmación
async function sendConfirmationMessage(chatId: string, messageId: number, callbackData: string, newStatus: string) {
  const statusEmojis: { [key: string]: string } = {
    'revisado': '✅',
    'contactado': '📞',
    'cerrado': '❌'
  };

  const statusTexts: { [key: string]: string } = {
    'revisado': 'Revisado',
    'contactado': 'Contactado',
    'cerrado': 'Cerrado'
  };

  const updatedMessage = `🔔 *LEAD ACTUALIZADO - Seguros RP*

📊 *Estado:* ${statusEmojis[newStatus]} ${statusTexts[newStatus]}
🕐 *Actualizado:* ${new Date().toLocaleString('es-MX')}

✅ Cambio de estado procesado correctamente`;

  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/editMessageText`, {
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
    return true;
  } catch (error) {
    console.error('Error editando mensaje:', error);
    return false;
  }
}

export async function POST(request: Request) {
  try {
    console.log('🔄 Webhook recibido');
    
    // Obtener el cuerpo de la petición
    let body: TelegramUpdate;
    const text = await request.text();
    
    console.log('📝 Body raw:', text);
    
    if (!text || text.trim() === '') {
      console.log('⚠️ Body vacío, retornando OK');
      return new Response(JSON.stringify({ status: 'OK', message: 'No data' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.error('❌ Error parsing JSON:', e);
      return new Response(JSON.stringify({ status: 'error', message: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('📦 Telegram update:', body);

    // Verificar si es un callback query (botón presionado)
    if (body.callback_query) {
      const callbackQuery = body.callback_query;
      console.log('🔘 Callback query recibido:', callbackQuery.data);
      
      const statusMap: Record<string, string> = {
        'review': 'revisado',
        'contacted': 'contactado', 
        'close': 'cerrado'
      };
      
      const newStatus = statusMap[callbackQuery.data || ''];
      
      if (newStatus) {
        // Editar el mensaje para mostrar el nuevo estado
        const editUrl = `https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`;
        
        await fetch(editUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: callbackQuery.message?.chat.id,
            message_id: callbackQuery.message?.message_id,
            text: `${callbackQuery.message?.text}

✅ Estado actualizado: ${newStatus.toUpperCase()}`,
            reply_markup: {
              inline_keyboard: [[
                { text: `✅ ${newStatus.toUpperCase()}`, callback_data: 'confirmed' }
              ]]
            }
          })
        });
        
        // Responder al callback query
        const answerUrl = `https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`;
        await fetch(answerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callbackQuery.id,
            text: `Estado cambiado a: ${newStatus}`,
            show_alert: false
          })
        });
        
        console.log(`✅ Estado actualizado a: ${newStatus}`);
      }
    }

    return new Response(JSON.stringify({ status: 'OK' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('❌ Error procesando webhook de Telegram:', error);
    return new Response(JSON.stringify({ 
      status: 'error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Método GET para verificar que el endpoint está funcionando
export const GET: APIRoute = async () => {
  return new Response(JSON.stringify({
    status: 'Telegram Webhook endpoint is working',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
