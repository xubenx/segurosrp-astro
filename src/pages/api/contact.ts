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
    const { name, email, phone, message, pageUrl, pageTitle } = body;

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

🌐 *Página de origen:*
🔗 *URL:* ${pageUrl || 'No disponible'}

⏰ *Fecha:* ${new Date().toLocaleString('es-MX', { 
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
    `.trim();

    // Crear el mensaje prediseñado para WhatsApp
    const whatsappMessage = `Hola ${name} 👋

Vi que te contactaste a través de nuestra página web.

¿En qué te puedo ayudar? �`;

    // Limpiar el número de teléfono para WhatsApp (solo números)
    const cleanPhone = phone ? phone.replace(/[^\d]/g, '') : '';
    
    // Codificar el mensaje para URL
    const encodedWhatsappMessage = encodeURIComponent(whatsappMessage);
    
    // Crear el URL de WhatsApp con el número del cliente
    let whatsappUrl;
    if (cleanPhone && cleanPhone.length >= 10) {
      // Si hay número válido, dirigir directamente a ese número
      whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedWhatsappMessage}`;
    } else {
      // Si no hay número o es inválido, usar el enlace genérico
      whatsappUrl = `https://wa.me/?text=${encodedWhatsappMessage}`;
    }

    // Enviar mensaje a Telegram con botón inline
    await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: cleanPhone && cleanPhone.length >= 10 
                ? `💬 Responder a ${name} (${phone})` 
                : `💬 Responder por WhatsApp a ${name}`,
              url: whatsappUrl
            }
          ]
        ]
      }
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
