import type { APIRoute } from 'astro';
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';

// Cargar variables de entorno
config();

export const POST: APIRoute = async ({ request }) => {
  try {
    // Obtener las variables de entorno
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Verificar que las variables de entorno estén configuradas
    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('❌ Variables de entorno de Telegram no configuradas');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Error de configuración del servidor' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Obtener los datos del formulario
    const body = await request.json();
    const { name, email, phone, message } = body;

    // Validar que todos los campos requeridos estén presentes
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Todos los campos obligatorios deben ser completados' 
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Crear instancia del bot
    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

    // Formatear el mensaje para Telegram
    const telegramMessage = `
🆕 *Nuevo mensaje de contacto*

👤 *Nombre:* ${name}
📧 *Email:* ${email}
📱 *Teléfono:* ${phone || 'No proporcionado'}

💬 *Mensaje:*
${message}

⏰ *Fecha:* ${new Date().toLocaleString('es-MX', { 
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
    `.trim();

    // Enviar mensaje a Telegram
    await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
      parse_mode: 'Markdown'
    });

    console.log('✅ Mensaje enviado exitosamente a Telegram');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Mensaje enviado correctamente' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: 'Error interno del servidor' 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
