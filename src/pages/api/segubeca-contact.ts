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

    // Obtener los datos del formulario de Segubeca
    const body = await request.json();
    const { 
      parentName, 
      childName, 
      parentAge, 
      childAge, 
      monthlySavings, 
      email, 
      whatsapp,
      source,
      campaign 
    } = body;

    // Validar que todos los campos requeridos estén presentes
    if (!parentName || !childName || !email || !whatsapp) {
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

    // Formatear el mensaje para Telegram específico para Segubeca
    const telegramMessage = `
🎓 *NUEVO LEAD - SEGUBECA (Seguros Educativos)*

👨‍👩‍👧‍👦 *Información Familiar:*
• *Padre/Madre:* ${parentName} (${parentAge} años)
• *Hijo/a:* ${childName} (${childAge} años)

💰 *Capacidad de Ahorro:*
• *Monto mensual deseado:* ${monthlySavings}

📧 *Contacto:*
• *Email:* ${email}
• *WhatsApp:* ${whatsapp}

🌐 *Información de Campaign:*
• *Fuente:* ${source || 'Segubeca Landing'}
• *Campaña:* ${campaign || 'Seguros Educativos'}

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
      name: parentName,
      email,
      phone: whatsapp,
      type: 'segubeca',
      source: source || 'Segubeca Landing',
      campaign: campaign || '',
      answers: {
        Hijo: `${childName} (${childAge} años)`,
        'Edad padre/madre': String(parentAge || ''),
        'Ahorro mensual': String(monthlySavings || ''),
      },
      raw: telegramMessage,
    });

    // Crear el mensaje prediseñado para WhatsApp
    const whatsappMessage = `Hola ${parentName} 👋

Vi que estás interesado/a en asegurar el futuro educativo de ${childName}.

¿Te parece si platicamos sobre las opciones de Segubeca? 🎓😊`;

    // Limpiar el número de teléfono para WhatsApp (solo números)
    const cleanPhone = whatsapp ? whatsapp.replace(/[^\d]/g, '') : '';
    
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
                ? `💬 Contactar a ${parentName} por WhatsApp` 
                : `💬 Contactar por WhatsApp`,
              url: whatsappUrl
            }
          ]
        ]
      }
    });

    console.log('✅ Lead de Segubeca enviado exitosamente a Telegram');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead de Segubeca procesado correctamente' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error al enviar lead de Segubeca:', error);
    
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
