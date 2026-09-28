import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { config } from 'dotenv';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

config();

const apiId = Number(process.env.TELEGRAM_API_ID || '');
const apiHash = process.env.TELEGRAM_API_HASH || '';

if (!apiId || !apiHash) {
  console.error('Faltan TELEGRAM_API_ID y TELEGRAM_API_HASH.');
  console.error('Entra a https://my.telegram.org → API development tools y crea una app.');
  process.exit(1);
}

const rl = createInterface({ input, output });
const client = new TelegramClient(new StringSession(''), apiId, apiHash, { connectionRetries: 5 });

await client.start({
  phoneNumber: async () => rl.question('Teléfono con código de país (ej. +524461354113): '),
  phoneCode: async () => rl.question('Código que te llegó a Telegram: '),
  password: async () => rl.question('Contraseña 2FA (si no tienes, Enter): '),
  onError: (err) => console.error(err),
});

const session = client.session.save();
console.log('\nListo. Copia esta variable en Vercel / .env:\n');
console.log(`TELEGRAM_SESSION=${session}`);
console.log('\nUsa una cuenta que ya esté dentro del chat de leads. No uses el bot.');
await client.disconnect();
await rl.close();
