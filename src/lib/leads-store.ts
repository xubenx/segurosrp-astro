import { config } from 'dotenv';
import { getFirestoreDb, hasFirebaseAdmin } from './firebase-admin';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import {
  answersToRecord,
  emptyLead,
  isLeadStatus,
  isLeadType,
  leadFingerprint,
  nowIso,
  type Lead,
  type LeadFollowup,
  type LeadInput,
} from './leads';

config();

const COLLECTION = 'leads';

function leadPayload(lead: Lead): Record<string, unknown> {
  return {
    id: lead.id,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt,
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    status: lead.status,
    perfil: lead.perfil,
    source: lead.source,
    campaign: lead.campaign,
    type: lead.type,
    oferta: lead.oferta,
    diagnostico: lead.diagnostico,
    puntos: lead.puntos,
    message: lead.message,
    answers: lead.answers || {},
    notes: lead.notes,
    followups: lead.followups || [],
    telegramMessageId: lead.telegramMessageId,
    pageUrl: lead.pageUrl,
    raw: lead.raw,
  };
}

function toIso(value: unknown): string {
  if (!value) return '';
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function docToLead(id: string, data: DocumentData | undefined): Lead {
  return emptyLead({
    id: String(data?.id || id),
    createdAt: toIso(data?.createdAt || data?.timestamp),
    updatedAt: toIso(data?.updatedAt),
    name: String(data?.name || ''),
    email: String(data?.email || ''),
    phone: String(data?.phone || ''),
    status: data?.status,
    perfil: data?.perfil,
    source: String(data?.source || ''),
    campaign: String(data?.campaign || ''),
    type: data?.type,
    oferta: String(data?.oferta || ''),
    diagnostico: String(data?.diagnostico || ''),
    puntos: String(data?.puntos || ''),
    message: String(data?.message || ''),
    answers: answersToRecord(data?.answers),
    notes: String(data?.notes || ''),
    followups: Array.isArray(data?.followups) ? (data.followups as LeadFollowup[]) : [],
    telegramMessageId: String(data?.telegramMessageId || ''),
    pageUrl: String(data?.pageUrl || ''),
    raw: String(data?.raw || ''),
  });
}

export function usingFirestore(): boolean {
  return hasFirebaseAdmin();
}

export async function listLeads(): Promise<Lead[]> {
  const snap = await getFirestoreDb().collection(COLLECTION).get();
  return snap.docs
    .map((item) => docToLead(item.id, item.data()))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function getLead(id: string): Promise<Lead | null> {
  const snap = await getFirestoreDb().collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return docToLead(snap.id, snap.data());
}

export async function upsertLead(input: LeadInput): Promise<Lead> {
  const lead = emptyLead({ ...input, updatedAt: nowIso() });
  if (!lead.name && !lead.email && !lead.phone) {
    throw new Error('El lead necesita al menos nombre, correo o teléfono');
  }
  await getFirestoreDb().collection(COLLECTION).doc(lead.id).set(leadPayload(lead), { merge: true });
  return lead;
}

export async function persistLead(input: LeadInput): Promise<Lead | null> {
  try {
    return await upsertLead(input);
  } catch (error) {
    console.error('No se pudo guardar el lead en Firestore:', error);
    return null;
  }
}

export async function updateLeadFields(id: string, patch: LeadInput): Promise<Lead> {
  const current = await getLead(id);
  if (!current) throw new Error('Lead no encontrado');
  return upsertLead({
    ...current,
    ...patch,
    id: current.id,
    createdAt: current.createdAt,
    answers: patch.answers ?? current.answers,
    followups: patch.followups ?? current.followups,
  });
}

export async function addLeadFollowup(id: string, text: string, author = 'equipo'): Promise<Lead> {
  const current = await getLead(id);
  if (!current) throw new Error('Lead no encontrado');
  const followup: LeadFollowup = {
    id: `f_${Date.now().toString(36)}`,
    at: nowIso(),
    text: text.trim(),
    author,
  };
  const status = current.status === 'nuevo' ? 'seguimiento' : current.status;
  return upsertLead({
    ...current,
    status,
    followups: [followup, ...current.followups],
  });
}

function existingKeys(leads: Lead[]): Set<string> {
  return new Set(leads.map(leadFingerprint));
}

export async function importLeads(inputs: LeadInput[]): Promise<{ imported: number; skipped: number }> {
  const current = await listLeads();
  const seen = existingKeys(current);
  const fresh: Lead[] = [];
  for (const input of inputs) {
    const lead = emptyLead(input);
    if (!lead.name && !lead.email && !lead.phone) continue;
    const key = leadFingerprint(lead);
    if (seen.has(key)) continue;
    seen.add(key);
    fresh.push(lead);
  }
  if (!fresh.length) return { imported: 0, skipped: inputs.length };

  const db = getFirestoreDb();
  for (let i = 0; i < fresh.length; i += 400) {
    const chunk = fresh.slice(i, i + 400);
    const batch = db.batch();
    for (const lead of chunk) {
      batch.set(db.collection(COLLECTION).doc(lead.id), leadPayload(lead), { merge: true });
    }
    await batch.commit();
  }
  return { imported: fresh.length, skipped: inputs.length - fresh.length };
}

function parseSheetDate(value: string): string {
  if (!value) return nowIso();
  const native = Date.parse(value);
  if (!Number.isNaN(native)) return new Date(native).toISOString();
  const months: Record<string, number> = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
    julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  };
  const match = value.toLowerCase().match(/(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/);
  if (!match) return nowIso();
  const month = months[match[2]];
  if (month == null) return nowIso();
  return new Date(Number(match[3]), month, Number(match[1]), Number(match[4] || 12), Number(match[5] || 0)).toISOString();
}

export async function importLegacySheetLeads(): Promise<{ imported: number; skipped: number }> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  const sheetId = process.env.GOOGLE_SHEET_ID || '1RMrJ3Tl5xj4XXvzBFWj1mS3fH9FUD9XqD0GO_eGdP-U';
  const sheetName = process.env.GOOGLE_SHEET_NAME || 'LEADS';
  if (!email || !key) {
    throw new Error('No hay credenciales de Google Sheets para importar la hoja vieja');
  }
  const { google } = await import('googleapis');
  const auth = new google.auth.JWT({
    email,
    key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:E`,
  });
  const rows = res.data.values || [];
  const inputs: LeadInput[] = [];
  for (const row of rows.slice(1)) {
    const fecha = String(row[1] || row[0] || '');
    const name = String(row[2] || '').trim();
    const phone = String(row[3] || '').trim();
    const emailValue = String(row[4] || '').trim();
    if (!name && !emailValue && !phone) continue;
    inputs.push({
      name,
      phone,
      email: emailValue,
      type: 'sheet',
      source: 'Google Sheets',
      createdAt: parseSheetDate(fecha),
      raw: [fecha, name, phone, emailValue].filter(Boolean).join(' · '),
    });
  }
  return importLeads(inputs);
}

export { isLeadStatus, isLeadType };
