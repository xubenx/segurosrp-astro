import type { APIRoute } from 'astro';
import { importLegacySheetLeads, importLeads } from '../../../../lib/leads-store';
import {
  extractMessagesFromTelegramExport,
  extractMessagesFromTelegramHtml,
  fetchTelegramLeads,
  parseTelegramMessage,
} from '../../../../lib/leads-telegram';

export const POST: APIRoute = async ({ request }) => {
  try {
    const contentType = request.headers.get('content-type') || '';
    let source = '';
    let payload: unknown = null;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      source = String(form.get('source') || 'export');
      const file = form.get('file');
      if (file && typeof file === 'object' && 'text' in file) {
        const content = await (file as File).text();
        payload = content.trimStart().startsWith('<') ? { html: content } : JSON.parse(content);
      }
    } else {
      const body = await request.json();
      source = String(body.source || '');
      payload = body.payload ?? body.messages ?? body;
    }

    if (source === 'sheets') {
      const result = await importLegacySheetLeads();
      return json({ success: true, ...result, source });
    }

    if (source === 'telegram') {
      const { messages, via } = await fetchTelegramLeads();
      const result = await importLeads(
        messages.map((msg) =>
          parseTelegramMessage(msg.text, {
            telegramMessageId: msg.id,
            createdAt: msg.date,
            source: 'Telegram',
          }),
        ),
      );
      return json({
        success: true,
        ...result,
        source,
        via,
        found: messages.length,
      });
    }

    if (source === 'export' || payload) {
      const html = (payload as { html?: unknown } | null)?.html;
      const messages =
        typeof html === 'string' ? extractMessagesFromTelegramHtml(html) : extractMessagesFromTelegramExport(payload);
      const result = await importLeads(
        messages.map((msg) =>
          parseTelegramMessage(msg.text, {
            telegramMessageId: msg.id,
            createdAt: msg.date,
            source: 'Telegram export',
          }),
        ),
      );
      return json({ success: true, ...result, source: 'export', found: messages.length });
    }

    return json({ success: false, message: 'Indica source: sheets, telegram o export' }, 400);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No se pudo importar';
    return json({ success: false, message }, 500);
  }
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
