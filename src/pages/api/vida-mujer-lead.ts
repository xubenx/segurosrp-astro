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

    // Obtener los datos del formulario de Vida Mujer
    const body = await request.json();
    const { 
      name, 
      email, 
      phone, 
      city, 
      age, 
      contact, 
      notes,
      source,
      campaign 
    } = body;

    // Validar que todos los campos requeridos estén presentes
    if (!name || !email || !phone || !age) {
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

    // Formatear el mensaje para Telegram específico para Vida Mujer
    const telegramMessage = `
👩 *NUEVO LEAD - VIDA MUJER* 💫

👤 *Cliente:* ${name}
📧 *Email:* ${email}
📱 *Teléfono:* ${phone}
🏙️ *Ciudad:* ${city || 'No especificada'}

🎯 *Perfil de Cliente:*
• *Edad:* ${age}
• *Preferencia de contacto:* ${contact || 'WhatsApp (Preferido)'}

💭 *Qué quiere proteger:*
${notes || 'No especificado'}

📊 *Información de Campaign:*
• *Fuente:* ${source || 'Vida Mujer Landing'}
• *Campaña:* ${campaign || 'SEM Vida Mujer'}

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

Vi que estás interesada en el seguro Vida Mujer 💫

Como asesora especializada en protección para mujeres, me encantaría platicar contigo sobre las opciones que mejor se adapten a tus necesidades.

¿Te parece si coordinamos una llamada? 😊`;

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
    await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: cleanPhone && cleanPhone.length >= 10 
                ? `💬 Contactar a ${name} por WhatsApp` 
                : `💬 Contactar por WhatsApp`,
              url: whatsappUrl
            }
          ]
        ]
      }
    });

    console.log('✅ Lead Vida Mujer enviado exitosamente a Telegram');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead Vida Mujer procesado correctamente' 
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('❌ Error al enviar lead Vida Mujer:', error);
    
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
