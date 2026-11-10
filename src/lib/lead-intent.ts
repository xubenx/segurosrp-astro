/**
 * Indexes match OBJ in diagnostico.ts:
 * retiro 0, universidad 1, patrimonio 2, familia 3, empresa 4, gmm 5.
 */
const RETIRO = 0;
const EDU = 1;
const PATRIMONIO = 2;
const FAMILIA = 3;
const EMPRESA = 4;
const GMM = 5;

/** Intent for the advisors diagnostic. Priority wins over secondary interests. */
export type LeadIntent = 'vida_ahorro_retiro' | 'gmm' | 'sin_definir';

export const LEAD_INTENT_EVENT: Record<LeadIntent, string> = {
  vida_ahorro_retiro: 'asesores_form_vida',
  gmm: 'asesores_form_gmm',
  sin_definir: 'asesores_form_otro',
};

export const LEAD_INTENT_TELEGRAM: Record<LeadIntent, string> = {
  vida_ahorro_retiro: '🟢 VIDA/AHORRO/RETIRO',
  gmm: 'GMM',
  sin_definir: 'SIN DEFINIR',
};

const VIDA = new Set<number>([RETIRO, EDU, PATRIMONIO, FAMILIA, EMPRESA]);

export function isLeadIntent(value: unknown): value is LeadIntent {
  return value === 'vida_ahorro_retiro' || value === 'gmm' || value === 'sin_definir';
}

/**
 * vida/ahorro/retiro/educación/familia/empresa → vida_ahorro_retiro.
 * Prioridad "gastos médicos" → gmm.
 * No single priority → sin_definir (asesores_form_otro).
 * "¿Tienes seguro de gastos médicos mayores?" is current coverage, not intent.
 */
export function classifyLeadIntent(ans: {
  objetivo?: number;
  intereses?: number[];
}): LeadIntent {
  const from = (value: number | undefined): LeadIntent | null => {
    if (value === GMM) return 'gmm';
    if (typeof value === 'number' && VIDA.has(value)) return 'vida_ahorro_retiro';
    return null;
  };

  const priority = from(ans.objetivo);
  if (priority) return priority;

  const intereses = Array.isArray(ans.intereses) ? ans.intereses : [];
  if (intereses.length === 1) {
    const only = from(intereses[0]);
    if (only) return only;
  }

  return 'sin_definir';
}
