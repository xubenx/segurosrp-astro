import { config } from 'dotenv';
import { getFirestoreDb, hasFirebaseAdmin } from './firebase-admin';
import { Timestamp, type DocumentData } from 'firebase-admin/firestore';
import {
  answersToRecord,
  emptyLead,
  isLeadStatus,
  isLeadType,
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

export { isLeadStatus, isLeadType };
