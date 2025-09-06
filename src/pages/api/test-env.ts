import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  const requiredEnvVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN', 
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_USER',
    'SMTP_PASS',
    'FROM_EMAIL',
    'RECIPIENT_EMAIL'
  ];

  const envStatus = requiredEnvVars.map(varName => ({
    variable: varName,
    configured: !!process.env[varName],
    value: process.env[varName] ? '✅ Configurada' : '❌ Faltante'
  }));

  return new Response(JSON.stringify({
    message: 'Estado de variables de entorno para Segubeca',
    variables: envStatus,
    allConfigured: envStatus.every(v => v.configured)
  }, null, 2), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
