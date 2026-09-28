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
    const { 
      nombre, 
      email, 
      telefono, 
      edad, 
      tipoSeguro, 
      rangoPresupuesto,
      message,
      source,
      campaign 
    } = body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombre || !email || !telefono || !edad || !tipoSeguro) {
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

    // Formatear el mensaje para Telegram específico para cotización de seguros
    const telegramMessage = `
🆕 *NUEVA COTIZACIÓN - ASESORES SEGUROS MONTERREY*

👤 *Cliente:* ${nombre}
📧 *Email:* ${email}
📱 *Teléfono:* ${telefono}

🎯 *Información de Cotización:*
• *Edad:* ${edad}
• *Tipo de Seguro:* ${tipoSeguro}
💰 *Rango de Presupuesto:* ${rangoPresupuesto || 'No especificado'}

💬 *Mensaje adicional:*
${message || 'Sin mensaje adicional'}

📊 *Información de Campaign:*
• *Fuente:* ${source || 'Landing Asesores Monterrey NYL'}
• *Campaña:* ${campaign || 'SEM Google Ads - Asesores Seguros Monterrey'}

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
      name: nombre,
      email,
      phone: telefono,
      type: 'cotizacion',
      source: source || 'Landing Asesores Monterrey NYL',
      campaign: campaign || '',
      message: message || '',
      answers: {
        Edad: String(edad),
        'Tipo de seguro': String(tipoSeguro),
        ...(rangoPresupuesto ? { Presupuesto: String(rangoPresupuesto) } : {}),
      },
      raw: telegramMessage,
    });

    // Crear el mensaje prediseñado para WhatsApp
    const whatsappMessage = `Hola ${nombre} 👋

Vi que solicitaste una cotización de ${tipoSeguro.toLowerCase()}.

¿Te parece si platicamos sobre tus opciones de seguros? 😊`;

    // Limpiar el número de teléfono para WhatsApp (solo números)
    const cleanPhone = telefono ? telefono.replace(/[^\d]/g, '') : '';
    
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
    await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: cleanPhone && cleanPhone.length >= 10 
                ? `💬 Contactar a ${nombre} por WhatsApp` 
                : `💬 Contactar por WhatsApp`,
              url: whatsappUrl
            }
          ]
        ]
      }
    });

    console.log('✅ Cotización de seguros enviada exitosamente a Telegram');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Cotización procesada correctamente' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error al enviar cotización:', error);
    
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
