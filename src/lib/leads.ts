import { randomBytes } from 'node:crypto';

export const LEAD_STATUSES = [
  'nuevo',
  'contactado',
  'seguimiento',
  'agendado',
  'ganado',
  'perdido',
] as const;

export const LEAD_TYPES = [
  'diagnostico',
  'contacto',
  'segubeca',
  'vida-mujer',
  'cotizacion',
  'manual',
  'telegram',
  'sheet',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];
export type LeadType = (typeof LEAD_TYPES)[number];
export type LeadPerfil = '' | 'A' | 'B' | 'C';

export interface LeadFollowup {
  id: string;
  at: string;
  text: string;
  author: string;
}

export interface Lead {
  id: string;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  perfil: LeadPerfil;
  source: string;
  campaign: string;
  type: LeadType;
  oferta: string;
  diagnostico: string;
  puntos: string;
  message: string;
  answers: Record<string, string>;
  notes: string;
  followups: LeadFollowup[];
  telegramMessageId: string;
  pageUrl: string;
  raw: string;
}

export type LeadInput = Partial<Lead> & { name?: string };

export const STATUS_LABEL: Record<LeadStatus, string> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  seguimiento: 'Seguimiento',
  agendado: 'Agendado',
  ganado: 'Ganado',
  perdido: 'Perdido',
};

export const TYPE_LABEL: Record<LeadType, string> = {
  diagnostico: 'Diagnóstico',
  contacto: 'Contacto',
  segubeca: 'SeguBeca',
  'vida-mujer': 'Vida Mujer',
  cotizacion: 'Cotización',
  manual: 'Manual',
  telegram: 'Telegram',
  sheet: 'Google Sheets',
};

export function newLeadId(): string {
  return `l_${Date.now().toString(36)}_${randomBytes(4).toString('hex')}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === 'string' && (LEAD_STATUSES as readonly string[]).includes(value);
}

export function isLeadType(value: unknown): value is LeadType {
  return typeof value === 'string' && (LEAD_TYPES as readonly string[]).includes(value);
}

export function normalizePhone(value: string | undefined | null): string {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('52')) return digits.slice(2);
  if (digits.length === 13 && digits.startsWith('521')) return digits.slice(3);
  if (digits.length > 10) return digits.slice(-10);
  return digits;
}

export function normalizeEmail(value: string | undefined | null): string {
  return String(value || '').trim().toLowerCase();
}

export function whatsappHref(phone: string, name = ''): string {
  const local = normalizePhone(phone);
  const full = local.length === 10 ? `52${local}` : local;
  const text = name ? `Hola ${name} 👋` : 'Hola 👋';
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

export function formatLeadDate(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('es-MX', {
    timeZone: 'America/Mexico_City',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function emptyLead(partial: LeadInput = {}): Lead {
  const createdAt = partial.createdAt || nowIso();
  return {
    id: partial.id || newLeadId(),
    createdAt,
    updatedAt: partial.updatedAt || createdAt,
    name: String(partial.name || '').trim(),
    email: normalizeEmail(partial.email),
    phone: normalizePhone(partial.phone),
    status: isLeadStatus(partial.status) ? partial.status : 'nuevo',
    perfil: partial.perfil === 'A' || partial.perfil === 'B' || partial.perfil === 'C' ? partial.perfil : '',
    source: String(partial.source || '').trim(),
    campaign: String(partial.campaign || '').trim(),
    type: isLeadType(partial.type) ? partial.type : 'contacto',
    oferta: String(partial.oferta || '').trim(),
    diagnostico: String(partial.diagnostico || '').trim(),
    puntos: String(partial.puntos ?? '').trim(),
    message: String(partial.message || '').trim(),
    answers: partial.answers && typeof partial.answers === 'object' ? { ...partial.answers } : {},
    notes: String(partial.notes || '').trim(),
    followups: Array.isArray(partial.followups) ? partial.followups : [],
    telegramMessageId: String(partial.telegramMessageId || '').trim(),
    pageUrl: String(partial.pageUrl || '').trim(),
    raw: String(partial.raw || '').trim(),
  };
}

export function leadFingerprint(lead: Pick<Lead, 'email' | 'phone' | 'telegramMessageId' | 'type' | 'createdAt'>): string {
  if (lead.telegramMessageId) return `tg:${lead.telegramMessageId}`;
  const day = (lead.createdAt || '').slice(0, 10);
  return `${lead.type}|${lead.email}|${lead.phone}|${day}`;
}

export function answersToRecord(value: unknown): Record<string, string> {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return answersToRecord(parsed);
    } catch {
      return value.trim() ? { detalle: value } : {};
    }
  }
  if (Array.isArray(value)) {
    return Object.fromEntries(value.map((item, i) => [`item_${i + 1}`, String(item)]));
  }
  if (typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? v.join(', ') : String(v ?? '')]),
    );
  }
  return {};
}

export interface LeadStats {
  total: number;
  nuevos: number;
  seguimiento: number;
  perfilA: number;
  semana: number;
}

export function computeLeadStats(leads: Lead[]): LeadStats {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return {
    total: leads.length,
    nuevos: leads.filter((l) => l.status === 'nuevo').length,
    seguimiento: leads.filter((l) => l.status === 'seguimiento' || l.status === 'contactado').length,
    perfilA: leads.filter((l) => l.perfil === 'A').length,
    semana: leads.filter((l) => new Date(l.createdAt).getTime() >= weekAgo).length,
  };
}

export function filterLeads(
  leads: Lead[],
  query: { q?: string; status?: string; perfil?: string; type?: string },
): Lead[] {
  const q = (query.q || '').trim().toLowerCase();
  return leads.filter((lead) => {
    if (query.status && query.status !== 'todos' && lead.status !== query.status) return false;
    if (query.perfil && query.perfil !== 'todos' && lead.perfil !== query.perfil) return false;
    if (query.type && query.type !== 'todos' && lead.type !== query.type) return false;
    if (!q) return true;
    const hay = [lead.name, lead.email, lead.phone, lead.source, lead.campaign, lead.oferta, lead.message, lead.diagnostico]
      .join(' ')
      .toLowerCase();
    return hay.includes(q);
  });
}
