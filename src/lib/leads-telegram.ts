import { answersToRecord, emptyLead, type Lead, type LeadInput, type LeadPerfil, type LeadType } from './leads';

function stripMd(value: string): string {
  return value.replace(/\*/g, '').replace(/^[•\-\s]+/, '').trim();
}

function labeled(text: string, labels: string[]): string {
  const lines = text.split('\n').map((line) =>
    line.replace(/^[^\wÁÉÍÓÚÜáéíóúüñÑ]+/, '').replace(/\*/g, '').trim(),
  );
  for (const label of labels) {
    const found = lines.find((line) => line.toLowerCase().startsWith(`${label.toLowerCase()}:`));
    if (found) return found.slice(found.indexOf(':') + 1).trim();
  }
  return '';
}

function sectionAfter(text: string, titles: string[]): string {
  for (const title of titles) {
    const re = new RegExp(`${title}:?\\s*\\n([\\s\\S]+?)(?:\\n\\n|\\n(?:🌐|📣|🔗|⏰|📊 \\*Información)|$)`, 'i');
    const match = text.match(re);
    if (match?.[1]) return match[1].trim();
  }
  return '';
}

function inferType(text: string): LeadType {
  const t = text.toLowerCase();
  if (t.includes('segubeca') || t.includes('seguros educativos')) return 'segubeca';
  if (t.includes('vida mujer')) return 'vida-mujer';
  if (t.includes('cotización') || t.includes('cotizacion') || t.includes('asesores seguros monterrey')) return 'cotizacion';
  if (t.includes('diagnóstico') || t.includes('diagnostico') || t.includes('perfil a') || t.includes('perfil b') || t.includes('perfil c')) {
    return 'diagnostico';
  }
  if (t.includes('nuevo mensaje de contacto')) return 'contacto';
  return 'telegram';
}

function inferPerfil(text: string): LeadPerfil {
  const match = text.match(/PERFIL\s*([ABC])/i) || text.match(/perfil\s*([ABC])/i);
  return match ? (match[1].toUpperCase() as LeadPerfil) : '';
}

function parseAnswersBlock(text: string): Record<string, string> {
  const block = sectionAfter(text, ['Respuestas', '🧾 Respuestas', 'Información de Cotización', 'Información Familiar', 'Perfil de Cliente']);
  const source = block || text;
  const answers: Record<string, string> = {};
  for (const line of source.split('\n')) {
    const cleaned = stripMd(line);
    const pair = cleaned.match(/^([^:]{2,60}):\s*(.+)$/);
    if (pair) answers[pair[1].replace(/^[•\-\s]+/, '').trim()] = pair[2].trim();
  }
  return answers;
}

export function flattenTelegramText(text: unknown): string {
  if (!text) return '';
  if (typeof text === 'string') return text;
  if (Array.isArray(text)) {
    return text
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object' && 'text' in part) return String((part as { text?: string }).text || '');
        return '';
      })
      .join('');
  }
  return String(text);
}

export function parseTelegramMessage(text: string, extra: LeadInput = {}): Lead {
  const raw = text.replace(/\r/g, '').trim();
  const answers = { ...parseAnswersBlock(raw), ...answersToRecord(extra.answers) };
  const name =
    extra.name ||
    labeled(raw, ['Nombre', 'Cliente', 'Padre/Madre', 'Padre', 'Madre']) ||
    answers['Padre/Madre'] ||
    answers.Cliente ||
    '';
  const email = extra.email || labeled(raw, ['Email', 'Correo', 'Correo Electrónico']);
  const phone = extra.phone || labeled(raw, ['WhatsApp', 'Teléfono', 'Telefono', 'Celular']);
  const message =
    extra.message ||
    sectionAfter(raw, ['Mensaje', 'Mensaje adicional', 'Qué quiere proteger']) ||
    labeled(raw, ['Mensaje']);

  return emptyLead({
    ...extra,
    name,
    email,
    phone,
    type: extra.type || inferType(raw),
    perfil: extra.perfil || inferPerfil(raw),
    puntos: extra.puntos || labeled(raw, ['Puntos']),
    oferta: extra.oferta || labeled(raw, ['Oferta']),
    diagnostico: extra.diagnostico || labeled(raw, ['Diagnóstico', 'Diagnostico']),
    source: labeled(raw, ['Fuente', 'Source']) || extra.source || '',
    campaign: extra.campaign || labeled(raw, ['Campaña', 'Campana', 'Campaign']),
    pageUrl: extra.pageUrl || labeled(raw, ['URL']),
    message,
    answers,
    raw: extra.raw || raw,
  });
}

export interface TelegramExportMessage {
  id?: number | string;
  type?: string;
  date?: string;
  date_unixtime?: number | string;
  from?: string;
  text?: unknown;
  text_entities?: { type?: string; text?: string }[];
}

export function extractMessagesFromTelegramExport(payload: unknown): { id: string; date: string; text: string }[] {
  const root = payload as { messages?: TelegramExportMessage[] } | TelegramExportMessage[];
  const messages = Array.isArray(root) ? root : Array.isArray(root?.messages) ? root.messages : [];
  return messages
    .map((msg) => {
      const text = flattenTelegramText(msg.text_entities?.length ? msg.text_entities : msg.text);
      if (!text.trim()) return null;
      const date = msg.date
        ? new Date(msg.date).toISOString()
        : msg.date_unixtime
          ? new Date(Number(msg.date_unixtime) * 1000).toISOString()
          : new Date().toISOString();
      return {
        id: String(msg.id ?? ''),
        date: Number.isNaN(new Date(date).getTime()) ? new Date().toISOString() : date,
        text,
      };
    })
    .filter((row): row is { id: string; date: string; text: string } => Boolean(row && looksLikeLeadMessage(row.text)));
}

function decodeHtml(value: string): string {
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&');
}

function parseHtmlExportDate(title: string): string {
  const match = title.match(/(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})(?: UTC([+-]\d{2}):?(\d{2}))?/);
  if (!match) return new Date().toISOString();
  const [, dd, mm, yyyy, hh, mi, ss, tzh = '+00', tzm = '00'] = match;
  const date = new Date(`${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}${tzh}:${tzm}`);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

/** Telegram Desktop "HTML" export (messages.html, messages2.html, ...). */
export function extractMessagesFromTelegramHtml(html: string): { id: string; date: string; text: string }[] {
  const blocks = html.split(/<div class="message default[^"]*" id="message/).slice(1);
  const rows: { id: string; date: string; text: string }[] = [];
  for (const block of blocks) {
    const id = block.match(/^(-?\d+)"/)?.[1] || '';
    const title = block.match(/class="pull_right date details" title="([^"]+)"/)?.[1] || '';
    const body = block.match(/<div class="text">([\s\S]*?)<\/div>/)?.[1] || '';
    const text = decodeHtml(body).trim();
    if (!text || !looksLikeLeadMessage(text)) continue;
    rows.push({ id, date: parseHtmlExportDate(title), text });
  }
  return rows;
}

export function looksLikeLeadMessage(text: string): boolean {
  const t = text.toLowerCase();
  if (t.length < 40) return false;
  const hasContact = /email|correo|whatsapp|tel[eé]fono|@/.test(t);
  const hasLeadMark =
    /nuevo lead|nuevo mensaje|nueva cotizaci|perfil [abc]|diagn[oó]stico|segubeca|vida mujer|nombre:|cliente:/.test(t);
  return hasContact && hasLeadMark;
}

function parseChatId(raw: string): string | number {
  const value = raw.trim();
  if (/^-?\d+$/.test(value)) return Number(value);
  return value.replace(/^@/, '');
}

export async function fetchTelegramChatHistory(): Promise<{ id: string; date: string; text: string }[]> {
  const apiId = Number(process.env.TELEGRAM_API_ID || '');
  const apiHash = process.env.TELEGRAM_API_HASH || '';
  const session = process.env.TELEGRAM_SESSION || '';
  const chatIdRaw = process.env.TELEGRAM_CHAT_ID || '';

  if (!apiId || !apiHash) {
    throw new Error(
      'Para leer el chat directo hace falta TELEGRAM_API_ID y TELEGRAM_API_HASH (my.telegram.org). El token del bot no alcanza: Telegram no le deja ver el historial.',
    );
  }
  if (!chatIdRaw) throw new Error('Falta TELEGRAM_CHAT_ID');
  if (!session) {
    throw new Error(
      'El bot no puede leer mensajes viejos. Genera TELEGRAM_SESSION con una cuenta de Telegram (no el bot): npm run telegram:session y pégala en Vercel.',
    );
  }

  const { TelegramClient } = await import('telegram');
  const { StringSession } = await import('telegram/sessions');
  const client = new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.connect();
  if (!(await client.checkAuthorization())) {
    await client.disconnect();
    throw new Error('TELEGRAM_SESSION expiró o no es válida. Vuelve a generar la sesión con npm run telegram:session.');
  }

  try {
    const entity = await client.getEntity(parseChatId(chatIdRaw));
    const collected: { id: string; date: string; text: string }[] = [];
    let scanned = 0;
    for await (const message of client.iterMessages(entity, { limit: 1500 })) {
      scanned += 1;
      const text = String(message.message || message.text || '').trim();
      if (!text || !looksLikeLeadMessage(text)) continue;
      const when = message.date
        ? new Date(typeof message.date === 'number' ? message.date * 1000 : message.date).toISOString()
        : new Date().toISOString();
      collected.push({
        id: String(message.id),
        date: Number.isNaN(new Date(when).getTime()) ? new Date().toISOString() : when,
        text,
      });
      if (scanned >= 1500) break;
    }
    return collected;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/CHAT_ADMIN_REQUIRED|CHAT_GUEST|BOT_METHOD_INVALID|not a member/i.test(message)) {
      throw new Error('Esa cuenta no puede leer el grupo. Entra al chat de leads con la misma cuenta de TELEGRAM_SESSION.');
    }
    throw error;
  } finally {
    await client.disconnect();
  }
}

export async function fetchTelegramLeads(): Promise<{ messages: { id: string; date: string; text: string }[]; via: 'chat' }> {
  const messages = await fetchTelegramChatHistory();
  return { messages, via: 'chat' };
}

export async function fetchTelegramBotUpdates(): Promise<{ id: string; date: string; text: string }[]> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('Falta TELEGRAM_BOT_TOKEN');

  await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);

  const collected: { id: string; date: string; text: string }[] = [];
  let offset = 0;
  for (let i = 0; i < 25; i++) {
    const url = `https://api.telegram.org/bot${token}/getUpdates?limit=100&timeout=0&offset=${offset}`;
    const res = await fetch(url);
    const data = (await res.json()) as {
      ok?: boolean;
      result?: {
        update_id: number;
        message?: { message_id: number; date: number; text?: string; caption?: string };
        channel_post?: { message_id: number; date: number; text?: string; caption?: string };
        edited_message?: { message_id: number; date: number; text?: string };
      }[];
      description?: string;
    };
    if (!data.ok) throw new Error(data.description || 'No se pudieron leer actualizaciones de Telegram');
    const batch = data.result || [];
    if (!batch.length) break;
    for (const update of batch) {
      offset = update.update_id + 1;
      const msg = update.message || update.channel_post || update.edited_message;
      const text = msg?.text || msg?.caption || '';
      if (!msg || !text) continue;
      collected.push({
        id: String(msg.message_id),
        date: new Date((msg.date || 0) * 1000).toISOString(),
        text,
      });
    }
  }
  return collected.filter((row) => looksLikeLeadMessage(row.text));
}
