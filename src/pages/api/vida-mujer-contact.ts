import type { APIRoute } from 'astro';
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { rateLimitMiddleware } from '../../lib/rate-limiter';

config();

export const POST: APIRoute = async ({ request }) => {
  const rateLimitResponse = rateLimitMiddleware(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

    if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
      console.error('❌ Variables de entorno de Telegram no configuradas para Vida Mujer');
      return new Response(
        JSON.stringify({ success: false, message: 'Error de configuración del servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const {
      name,
      whatsapp,
      phone,
      age,
      objetivo,
      dedicas,
      estrategia,
      source,
      campaign,
      pageUrl
    } = body;

    const contactPhone = whatsapp || phone;

    if (!name || !contactPhone || !objetivo || !dedicas || !estrategia) {
      return new Response(
        JSON.stringify({ success: false, message: 'Por favor completa todos los campos requeridos' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);

    const telegramMessage = `
👩 NUEVO LEAD - VIDA MUJER 💫

👤 Nombre: ${name}
📱 WhatsApp: ${contactPhone}
🎂 Edad: ${age || 'No especificada'}

🎯 Objetivo principal: ${objetivo}
💼 Se dedica a: ${dedicas}
📊 Estrategia de interés: ${estrategia}

📊 Tracking campaña:
- Fuente: ${source || 'Landing Vida Mujer'}
- Campaña: ${campaign || 'SEM Google Ads - Vida Mujer'}
- URL: ${pageUrl || 'No disponible'}

⏰ Fecha: ${new Date().toLocaleString('es-MX', {
  timeZone: 'America/Mexico_City',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
    `.trim();

    const cleanPhone = String(contactPhone).replace(/[^\d]/g, '');
    const whatsappMsg = `Hola ${name} 👋\n\nVi tu solicitud sobre la *${estrategia}* de Vida Mujer.\n\n¿Te parece si coordinamos un momento para platicar sobre tu propuesta personalizada?`;
    const encodedWhatsappMessage = encodeURIComponent(whatsappMsg);

    const whatsappUrl = cleanPhone && cleanPhone.length >= 10
      ? `https://wa.me/+52${cleanPhone}?text=${encodedWhatsappMessage}`
      : `https://wa.me/?text=${encodedWhatsappMessage}`;

    try {
      await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: cleanPhone && cleanPhone.length >= 10
                  ? `💬 Contactar a ${name} por WhatsApp`
                  : '💬 Contactar por WhatsApp',
                url: whatsappUrl
              }
            ]
          ]
        }
      });
    } catch (telegramError) {
      console.error('⚠️ Error enviando con botón, intentando envío simple:', telegramError);
      await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage);
    }

    console.log('✅ Lead Vida Mujer enviado exitosamente a Telegram');

    return new Response(
      JSON.stringify({ success: true, message: 'Lead Vida Mujer procesado correctamente' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error al enviar lead Vida Mujer:', error);

    return new Response(
      JSON.stringify({ success: false, message: 'Error interno del servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
