import type { APIRoute } from 'astro';
import TelegramBot from 'node-telegram-bot-api';
import { config } from 'dotenv';
import { rateLimitMiddleware } from '../../lib/rate-limiter';
import { persistLead } from '../../lib/leads-store';
import { answersToRecord } from '../../lib/leads';

config();

export const POST: APIRoute = async ({ request }) => {
  const limited = rateLimitMiddleware(request);
  if (limited) return limited;

  try {
    const body = await request.json();
    const {
      nombre,
      email,
      telefono,
      perfil,
      puntos,
      oferta,
      diagnostico,
      respuestas,
      source,
      campaign,
      pageUrl,
    } = body;

    if (!nombre || !email || !telefono) {
      return json({ success: false, message: 'Completa nombre, correo y WhatsApp' }, 400);
    }

    const tier = String(perfil || 'B').toUpperCase();
    const flag = tier === 'A' ? '🔥 PERFIL A — PRIORIDAD' : tier === 'C' ? '❄️ PERFIL C — Nurturing' : '📋 PERFIL B — seguimiento';
    const answersBlock = respuestas && typeof respuestas === 'object'
      ? Object.entries(respuestas).map(([k, v]) => `• ${k}: ${v}`).join('\n')
      : 'Sin detalle';

    const telegramMessage = `
${flag}
⭐ Puntos: ${puntos ?? '—'}
📦 Oferta: ${oferta || 'Diagnóstico patrimonial'}

👤 Nombre: ${nombre}
📧 Email: ${email}
📱 WhatsApp: ${telefono}

📊 Diagnóstico: ${diagnostico || '—'}

🧾 Respuestas:
${answersBlock}

🌐 Fuente: ${source || 'web'}
📣 Campaña: ${campaign || '—'}
🔗 URL: ${pageUrl || '—'}

⏰ ${new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })}
    `.trim();

    await persistLead({
      name: nombre,
      email,
      phone: telefono,
      type: 'diagnostico',
      perfil: tier === 'A' || tier === 'B' || tier === 'C' ? tier : 'B',
      puntos: String(puntos ?? ''),
      oferta: oferta || 'Diagnóstico patrimonial',
      diagnostico: diagnostico || '',
      answers: answersToRecord(respuestas),
      source: source || 'web',
      campaign: campaign || '',
      pageUrl: pageUrl || '',
      raw: telegramMessage,
    });

    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
    if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
      try {
        const bot = new TelegramBot(TELEGRAM_BOT_TOKEN);
        const cleanPhone = String(telefono).replace(/[^\d]/g, '');
        const waText = encodeURIComponent(
          `Hola ${nombre} 👋\nVi tu diagnóstico de *${oferta || 'patrimonio'}* (perfil ${tier}).\n¿Te parece si lo revisamos juntos?`,
        );
        const whatsappUrl =
          cleanPhone.length >= 10
            ? `https://wa.me/+52${cleanPhone}?text=${waText}`
            : `https://wa.me/?text=${waText}`;

        await bot.sendMessage(TELEGRAM_CHAT_ID, telegramMessage, {
          reply_markup: {
            inline_keyboard: [[{ text: `💬 Contactar a ${nombre}`, url: whatsappUrl }]],
          },
        });
      } catch (error) {
        console.error('Telegram diagnóstico falló, el lead ya está en el CRM:', error);
      }
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error diagnóstico:', error);
    return json({ success: false, message: 'Error interno del servidor' }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
