/**
 * Options of "¿Cuándo te gustaría empezar?", in the order they appear
 * in diagnostico.ts (answer index = position).
 */
export const CUANDO_OPTIONS = ['Este mes', 'En 1 a 3 meses', 'Solo estoy explorando'] as const;

export type Urgencia = 'caliente' | 'tibio' | 'frio' | 'sin_dato';

export const URGENCIA_TELEGRAM: Record<Urgencia, string> = {
  caliente: '🔥 CALIENTE',
  tibio: '🌤️ TIBIO',
  frio: '❄️ FRÍO',
  sin_dato: 'SIN DATO',
};

const BY_INDEX: Record<number, Urgencia> = {
  0: 'caliente',
  1: 'tibio',
  2: 'frio',
};

export function isUrgencia(value: unknown): value is Urgencia {
  return value === 'caliente' || value === 'tibio' || value === 'frio' || value === 'sin_dato';
}

/** Este mes → caliente. En 1 a 3 meses → tibio. Solo estoy explorando → frio. */
export function classifyUrgencia(cuando: unknown): Urgencia {
  if (typeof cuando === 'number' && Number.isInteger(cuando) && cuando in BY_INDEX) {
    return BY_INDEX[cuando];
  }
  return 'sin_dato';
}

/** Ads-qualified asesor lead: vida/ahorro/retiro and ready within about 3 months. */
export function isAsesoresCalificado(leadType: string, urgencia: Urgencia): boolean {
  return leadType === 'vida_ahorro_retiro' && (urgencia === 'caliente' || urgencia === 'tibio');
}
