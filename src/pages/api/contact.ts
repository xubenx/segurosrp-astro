import type { APIRoute } from 'astro';
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { persistLead } from '../../lib/leads-store';
import { rateLimitMiddleware } from '../../lib/rate-limiter';

// Cargar variables de entorno
config();

export const POST: APIRoute = async ({ request }) => {
  // Verificar rate limiting antes de procesar
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    // Obtener las variables de entorno
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    // Obtener los datos del formulario
    const body = await request.json();
    const { name, email, phone, message, monthlyAmount, age, pageUrl, pageTitle } = body;

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
    const bot = TELEGRAM_BOT_TOKEN ? new TelegramBot(TELEGRAM_BOT_TOKEN) : null;

    // Formatear el mensaje para Telegram
    const telegramMessage = `
🆕 *Nuevo mensaje de contacto*

👤 *Nombre:* ${name}
📧 *Email:* ${email}
📱 *Teléfono:* ${phone || 'No proporcionado'}
💰 *Monto mensual deseado:* ${monthlyAmount || 'No especificado'}
🎂 *Edad:* ${age || 'No especificada'}

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

    await persistLead({
      name,
      email,
      phone: phone || '',
      type: 'contacto',
      source: pageTitle || 'Formulario de contacto',
      pageUrl: pageUrl || '',
      message: message || '',
      answers: {
        ...(monthlyAmount ? { 'Monto mensual': String(monthlyAmount) } : {}),
        ...(age ? { Edad: String(age) } : {}),
      },
      raw: telegramMessage,
    });

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
      whatsappUrl = `https://wa.me/+52${cleanPhone}?text=${encodedWhatsappMessage}`;
    } else {
      // Si no hay número o es inválido, usar el enlace genérico
      whatsappUrl = `https://wa.me/?text=${encodedWhatsappMessage}`;
    }

    // Enviar mensaje a Telegram con botón inline
    if (bot && TELEGRAM_CHAT_ID) {
      try {
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
    } catch (error) {
      console.error('Telegram contacto falló, el lead ya está en el CRM:', error);
      }
    }

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
