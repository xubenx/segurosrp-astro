export const DX_CONFIG = {
  whatsapp: '524461354113',
  calendly: 'https://calendly.com/laungeuno/asesoria-gratuita-para-planear-tu-retiro',
  avisoPrivacidad: 'https://segurosrp.com',
  tasaReal: 0.04,
  inflacionEducativa: 0.06,
  edadRetiro: 65,
  aniosRetiro: 20,
  montoPlan: 4200,
  montoInicial: 2500,
};

export const UNIS: [string, number][] = [
  ['Tec de Monterrey', 1710000],
  ['ITAM', 1575000],
  ['Anáhuac', 1460000],
  ['Ibero', 1350000],
  ['Panamericana', 1240000],
];

export const OBJ = {
  RETIRO: 0,
  EDU: 1,
  PATRIMONIO: 2,
  FAMILIA: 3,
  EMPRESA: 4,
  GMM: 5,
} as const;

export type ObjetivoKey = 'retiro' | 'universidad' | 'patrimonio' | 'familia' | 'empresa' | 'gmm';

export const OBJS: {
  key: ObjetivoKey;
  label: string;
  oferta: string;
  h1: string;
  gancho: string;
}[] = [
  {
    key: 'retiro',
    label: 'Mi retiro',
    oferta: 'Mi Retiro en Números',
    h1: '¿Cuánto necesitas ahorrar al mes para retirarte tranquilo?',
    gancho: 'Te muestro cuánto necesitas ahorrar al mes para retirarte con el nivel de vida que quieres.',
  },
  {
    key: 'universidad',
    label: 'La universidad de mis hijos',
    oferta: 'Plan Universidad Segura',
    h1: '¿Cuánto costará la universidad de tu hijo cuando le toque entrar?',
    gancho: 'Calculamos cuánto costará la carrera de tus hijos y cómo asegurarla aunque tú faltes.',
  },
  {
    key: 'patrimonio',
    label: 'Ahorrar y hacer crecer mi patrimonio',
    oferta: 'Mapa de Patrimonio',
    h1: '¿Cuánto podrías tener en 20 años si empiezas hoy?',
    gancho: 'Vemos cuánto puedes construir con un ahorro disciplinado y en qué plazo.',
  },
  {
    key: 'familia',
    label: 'Proteger a mi familia si me pasa algo',
    oferta: 'Escudo Familiar',
    h1: 'Si mañana faltas, ¿cuánto tiempo podría tu familia mantener su nivel de vida?',
    gancho: 'Calculamos la suma que mantendría a tu familia si tú no estás.',
  },
  {
    key: 'empresa',
    label: 'Proteger mi empresa y pagar menos impuestos',
    oferta: 'Diagnóstico de Protección y Eficiencia Fiscal',
    h1: '¿Cuánto de lo que gana tu empresa se queda en impuestos antes de llegar a tu bolsillo?',
    gancho: 'Revisamos cuánto pagas al sacar utilidades y cómo convertir parte de ese impuesto en protección.',
  },
  {
    key: 'gmm',
    label: 'Protegerme ante gastos médicos',
    oferta: 'Chequeo de Gastos Médicos',
    h1: '¿Qué pasaría con tus ahorros si mañana tienes una hospitalización?',
    gancho: 'Revisamos tu protección: un siniestro promedio en México ya cuesta $132,175 (AMIS).',
  },
];

export type DxAnswers = Record<string, any>;

export type DxOption = [string, number];

export type DxQuestion = {
  id: string;
  t: string | ((a: DxAnswers) => string);
  h?: string | ((a: DxAnswers) => string);
  o: DxOption[];
  multi?: boolean;
  exclusive?: number;
  kill?: number;
  show?: (a: DxAnswers, preset: number) => boolean;
  only?: (a: DxAnswers) => number[];
};

const EMP = (a: DxAnswers) => a.objetivo === OBJ.EMPRESA;

export function presetIndex(preset?: string | null): number {
  if (!preset) return -1;
  return OBJS.findIndex((o) => o.key === preset);
}

export function questions(): DxQuestion[] {
  return [
    {
      id: 'intereses',
      multi: true,
      t: '¿Qué te gustaría resolver?',
      h: 'Elige todas las que apliquen.',
      show: (_a, preset) => preset < 0,
      o: OBJS.map((o) => [o.label, 2]),
    },
    {
      id: 'objetivo',
      t: 'De esas, ¿cuál es tu prioridad número 1?',
      h: 'Tu diagnóstico empieza por ahí; lo demás lo vemos en tu sesión.',
      show: (a, preset) => preset < 0 && (a.intereses || []).length > 1,
      only: (a) => a.intereses,
      o: OBJS.map((o) => [o.label, 0]),
    },
    {
      id: 'ocupacion',
      t: '¿A qué te dedicas?',
      show: (a) => !EMP(a),
      o: [
        ['Tengo mi propio negocio', 3],
        ['Profesionista independiente', 3],
        ['Empleado', 2],
        ['Otro', 0],
      ],
    },
    {
      id: 'retiroDinero',
      t: '¿Cómo sacas dinero de tu empresa?',
      h: 'Esto cambia por completo la estrategia fiscal.',
      show: (a) => EMP(a) || a.ocupacion === 0,
      o: [
        ['Tengo sueldo en nómina', 2],
        ['Solo como dividendos o retiro de utilidades', 3],
        ['Una mezcla de sueldo y dividendos', 3],
        ['No lo tengo claro', 2],
      ],
    },
    {
      id: 'edad',
      t: '¿Qué edad tienes?',
      o: [
        ['25 a 34 años', 2],
        ['35 a 44 años', 3],
        ['45 a 54 años', 3],
        ['55 años o más', 1],
      ],
    },
    {
      id: 'facturacion',
      t: '¿Cuánto factura tu empresa al año, aproximadamente?',
      show: EMP,
      o: [
        ['Más de $100 millones', 5],
        ['$20 a $100 millones', 5],
        ['$5 a $20 millones', 4],
        ['$1 a $5 millones', 2],
        ['Menos de $1 millón', 0],
      ],
      kill: 4,
    },
    {
      id: 'empleados',
      t: '¿Cuántos colaboradores tiene tu empresa?',
      show: EMP,
      o: [
        ['1 a 10', 1],
        ['11 a 50', 2],
        ['51 a 200', 3],
        ['Más de 200', 4],
      ],
    },
    {
      id: 'prestaciones',
      multi: true,
      exclusive: 3,
      t: '¿Qué seguros ofrece hoy tu empresa a su equipo?',
      h: 'Elige todas las que apliquen.',
      show: EMP,
      o: [
        ['Gastos médicos colectivo', 1],
        ['Seguro de vida grupo', 1],
        ['Plan de retiro para empleados', 1],
        ['Ninguno por ahora', 2],
      ],
    },
    {
      id: 'socios',
      t: '¿Cómo está la propiedad de tu empresa?',
      show: EMP,
      o: [
        ['Soy el único dueño', 1],
        ['Tengo socios y un convenio firmado', 2],
        ['Tengo socios, pero sin convenio', 3],
        ['Es familiar y aún no hay sucesor definido', 3],
        ['Es familiar y ya hay sucesor', 2],
      ],
    },
    {
      id: 'riesgos',
      multi: true,
      exclusive: 5,
      t: '¿Cuáles de estas situaciones te aplican?',
      h: 'Elige todas las que apliquen.',
      show: EMP,
      o: [
        ['Tengo créditos o avales que dependen de mí', 2],
        ['Tengo dinero parado en cuentas o inversiones', 2],
        ['Tengo un seguro o inversión por vencer', 3],
        ['Mi retiro depende de vender la empresa o seguir en ella', 2],
        ['Si yo no pudiera trabajar unos meses, la empresa se detendría', 2],
        ['Ninguna', 0],
      ],
    },
    {
      id: 'liquidez',
      t: '¿Cuánto tienes aproximadamente en cuentas o inversiones?',
      h: 'A tu nombre o de la empresa.',
      show: (a) => EMP(a) && (a.riesgos || []).includes(1),
      o: [
        ['Menos de $1 millón', 1],
        ['$1 a $5 millones', 3],
        ['$5 a $20 millones', 4],
        ['Más de $20 millones', 5],
      ],
    },
    {
      id: 'hijos',
      t: '¿Tienes hijos o personas que dependan de ti económicamente?',
      show: (a) => a.objetivo !== OBJ.EDU && !EMP(a),
      o: [
        ['Sí, menores de 10 años', 3],
        ['Sí, de 10 a 18 años', 2],
        ['Sí, mayores de edad', 1],
        ['No', 1],
      ],
    },
    {
      id: 'hijoEdad',
      t: '¿Qué edad tiene tu hijo más pequeño?',
      show: (a) => a.objetivo === OBJ.EDU,
      o: [
        ['0 a 3 años', 3],
        ['4 a 7 años', 3],
        ['8 a 12 años', 2],
        ['13 a 17 años', 1],
      ],
    },
    {
      id: 'uni',
      t: '¿A qué universidad te gustaría que fuera?',
      h: 'Si aún no sabes, calculamos con el promedio.',
      show: (a) => a.objetivo === OBJ.EDU,
      o: [...UNIS.map((u) => [u[0], 2] as DxOption), ['Aún no lo sé', 2]],
    },
    {
      id: 'meta',
      t: '¿Con cuánto al mes te gustaría vivir cuando te retires?',
      h: 'En pesos de hoy.',
      show: (a) => a.objetivo === OBJ.RETIRO,
      o: [
        ['$20,000', 1],
        ['$40,000', 2],
        ['$60,000', 3],
        ['$100,000 o más', 4],
      ],
    },
    {
      id: 'ahorro',
      t: '¿Hoy ahorras para este objetivo?',
      show: (a) => [OBJ.RETIRO, OBJ.EDU, OBJ.PATRIMONIO].includes(a.objetivo),
      o: [
        ['Sí, con un plan formal', 2],
        ['Sí, pero por mi cuenta', 3],
        ['No, pero quiero empezar', 3],
        ['No es prioridad por ahora', 0],
      ],
    },
    {
      id: 'gmm',
      t: '¿Tienes seguro de gastos médicos mayores?',
      o: [
        ['Sí, uno personal', 1],
        ['Solo el de mi trabajo', 2],
        ['No tengo', 2],
      ],
    },
    {
      id: 'ingreso',
      t: '¿Cuál es tu ingreso mensual aproximado?',
      h: 'Solo lo usamos para proponerte un plan realista.',
      show: (a) => !EMP(a),
      o: [
        ['Más de $100,000', 5],
        ['$60,000 a $100,000', 4],
        ['$35,000 a $60,000', 2],
        ['Menos de $35,000', 0],
      ],
      kill: 3,
    },
    {
      id: 'monto',
      t: (a) =>
        EMP(a)
          ? 'Parte de esta estrategia se paga con impuestos que hoy ya pagas. ¿Podrías destinar al menos $50,000 al año entre tú y tu empresa?'
          : a.objetivo === OBJ.GMM
            ? 'Un buen seguro de gastos médicos suele costar de $1,000 a $4,000 al mes según tu edad. ¿Podrías destinar ese rango?'
            : `Un plan sólido parte de unos $${DX_CONFIG.montoPlan.toLocaleString('es-MX')} al mes. Si se ajusta a ti, ¿podrías destinar ese monto?`,
      h: (a) =>
        EMP(a)
          ? 'Muchas estrategias empresariales son mayores; la ajustamos a tu caso.'
          : a.objetivo === OBJ.GMM
            ? 'El costo exacto depende de tu edad, deducible y hospitales.'
            : 'Si prefieres, también se puede empezar con menos.',
      o: [
        ['Sí, sin problema', 5],
        ['Sí, empezando con algo menor', 2],
        ['Por ahora no me es posible', 0],
      ],
      kill: 2,
    },
    {
      id: 'decision',
      t: (a) =>
        EMP(a) || a.ocupacion === 0
          ? '¿Quién participa en esta decisión?'
          : '¿Tomarías esta decisión tú solo o con alguien más?',
      h: 'Así preparamos la sesión para todos los que deben estar.',
      o: [
        ['Yo decido', 2],
        ['Con mi pareja', 2],
        ['Con mi socio o socios', 2],
        ['Con mi contador o equipo directivo', 2],
      ],
    },
    {
      id: 'cuando',
      t: '¿Cuándo te gustaría empezar?',
      o: [
        ['Este mes', 4],
        ['En 1 a 3 meses', 2],
        ['Solo estoy explorando', 0],
      ],
    },
  ];
}

export function txt(value: string | ((a: DxAnswers) => string) | undefined, ans: DxAnswers): string {
  if (!value) return '';
  return typeof value === 'function' ? value(ans) : value;
}

export function visibleQuestions(ans: DxAnswers, preset: number): DxQuestion[] {
  return questions().filter((q) => !q.show || q.show(ans, preset));
}

export function answerLabel(q: DxQuestion, ans: DxAnswers): string {
  if (q.multi) {
    return ((ans[q.id] as number[]) || []).map((i) => q.o[i][0]).join(', ');
  }
  const i = ans[q.id];
  return typeof i === 'number' ? q.o[i][0] : '';
}

export function classify(ans: DxAnswers, preset: number): { tier: 'A' | 'B' | 'C'; score: number } {
  let score = 0;
  let killed = false;
  visibleQuestions(ans, preset).forEach((q) => {
    if (q.multi) {
      score += 2;
      return;
    }
    const i = ans[q.id];
    if (typeof i !== 'number') return;
    score += q.o[i][1];
    if (q.kill !== undefined && i === q.kill) killed = true;
  });
  if (killed || ans.cuando === 2) return { tier: 'C', score };
  const fuerte = EMP(ans) ? ans.facturacion <= 2 : ans.ingreso <= 1;
  if (fuerte && ans.monto === 0 && ans.cuando <= 1) return { tier: 'A', score };
  return { tier: 'B', score };
}

const fmt = (n: number) => '$' + Math.round(n).toLocaleString('es-MX');
const mrate = (a: number) => Math.pow(1 + a, 1 / 12) - 1;
const pmt = (fv: number, a: number, y: number) => {
  const r = mrate(a);
  const n = y * 12;
  return (fv * r) / (Math.pow(1 + r, n) - 1);
};
const fvAhorro = (m: number, a: number, y: number) => {
  const r = mrate(a);
  const n = y * 12;
  return (m * (Math.pow(1 + r, n) - 1)) / r;
};
const up100 = (n: number) => Math.ceil(n / 100) * 100;
const pct = (x: number) => Math.max(1, Math.min(100, Math.round(x * 100)));
const INGRESO = [120000, 80000, 47500, 30000];
const EDAD = [30, 40, 50, 58];

export type DxResult = {
  pre: string;
  big: string;
  unit: string;
  post: string;
  planTitle: string;
  planBody: string;
  extraHtml: string;
  notesHtml: string[];
  fine: string;
  resumen: string;
  deduce: boolean;
};

export function diagnostico(ans: DxAnswers): DxResult {
  const o = ans.objetivo;
  const nombre = String(ans.nombre || 'Hola').split(' ')[0];
  const m = ans.monto === 0 ? DX_CONFIG.montoPlan : DX_CONFIG.montoInicial;
  const notesHtml: string[] = [];
  const otros: number[] = (ans.intereses || []).filter((i: number) => i !== ans.objetivo);

  if (otros.length) {
    notesHtml.push(
      `<div class="dx-note"><b>También lo vemos en tu sesión</b><ul class="dx-more">${otros
        .map((i) => `<li><b>${OBJS[i].oferta}:</b> ${OBJS[i].gancho}</li>`)
        .join('')}</ul></div>`,
    );
  }

  let result: DxResult;

  if (o === OBJ.EDU) {
    const faltan = [16.5, 12.5, 8, 3][ans.hijoEdad] ?? 12.5;
    const elegida = ans.uni < UNIS.length ? UNIS[ans.uni] : null;
    const hoy = elegida ? elegida[1] : UNIS.reduce((s, u) => s + u[1], 0) / UNIS.length;
    const fut = hoy * Math.pow(1 + DX_CONFIG.inflacionEducativa, faltan);
    const mensual = up100(pmt(fut, DX_CONFIG.inflacionEducativa, faltan));
    const cubre = pct(fvAhorro(m, DX_CONFIG.inflacionEducativa, faltan) / fut);
    const tabla = UNIS.map(
      ([n, c]) =>
        `<tr${elegida && elegida[0] === n ? ' class="dx-sel"' : ''}><td>${n}</td><td>${fmt(c)}</td><td><b>${fmt(c * Math.pow(1 + DX_CONFIG.inflacionEducativa, faltan))}</b></td></tr>`,
    ).join('');
    result = {
      pre: `${nombre}, cuando tu hijo entre a la universidad en unos ${Math.round(faltan)} años, su carrera en ${elegida ? elegida[0] : 'una privada top'} podría costar`,
      big: fmt(fut),
      unit: '',
      post: `Cubrirla completa equivale a unos ${fmt(mensual)} al mes desde hoy. Pero no tienes que empezar con eso.`,
      planTitle: `Con ${fmt(m)} al mes ya aseguras cerca del ${cubre}% de la carrera`,
      planBody:
        'Y con un plan educativo con seguro de vida, si tú llegas a faltar, la meta se cumple al 100% de todos modos. Cada año puedes subir tu aportación conforme crezcan tus ingresos.',
      extraHtml: `<div class="dx-note"><b>Así se ve en las 5 privadas más buscadas</b><div class="dx-tablewrap"><table><thead><tr><th>Universidad</th><th>Hoy</th><th>Cuando entre</th></tr></thead><tbody>${tabla}</tbody></table></div></div>`,
      notesHtml,
      fine: `Colegiatura estimada de licenciatura completa (~4.5 años). Proyección con inflación educativa supuesta de ${(DX_CONFIG.inflacionEducativa * 100).toFixed(0)}% anual.`,
      resumen: `Universidad: ${fmt(fut)} en ${Math.round(faltan)} años; ${fmt(m)}/mes cubre ~${cubre}%`,
      deduce: false,
    };
  } else if (o === OBJ.PATRIMONIO) {
    const [a10, a15, a20] = [10, 15, 20].map((y) => fvAhorro(m, DX_CONFIG.tasaReal, y));
    const tarde = fvAhorro(m, DX_CONFIG.tasaReal, 15);
    result = {
      pre: `${nombre}, si ahorras ${fmt(m)} al mes de forma disciplinada, en 20 años podrías tener cerca de`,
      big: fmt(a20),
      unit: '',
      post: `En pesos de hoy. A los 10 años serían unos ${fmt(a10)} y a los 15, unos ${fmt(a15)}.`,
      planTitle: `Empezar hoy vale ${fmt(a20 - tarde)} más que empezar en 5 años`,
      planBody: `El tiempo pesa más que el monto. Empieza con ${fmt(m)} y súbelo un poco cada año; en tu sesión vemos si además te conviene hacerlo deducible.`,
      extraHtml: '',
      notesHtml,
      fine: `Proyección ilustrativa con rendimiento real supuesto de ${(DX_CONFIG.tasaReal * 100).toFixed(0)}% anual.`,
      resumen: `Patrimonio: ${fmt(a20)} en 20 años con ${fmt(m)}/mes`,
      deduce: true,
    };
  } else if (o === OBJ.FAMILIA) {
    const ing = INGRESO[ans.ingreso] ?? 47500;
    const anios = [15, 10, 5, 5][ans.hijos] ?? 10;
    const suma = ing * 12 * anios;
    result = {
      pre: `${nombre}, para que tu familia mantenga su nivel de vida durante ${anios} años si tú faltas, necesitaría`,
      big: fmt(suma),
      unit: '',
      post: `Es tu ingreso de ${anios} años. Juntarlo ahorrando tomaría décadas.`,
      planTitle: 'Un seguro de vida crea esa cantidad desde el primer día',
      planBody:
        'Tu familia la recibiría completa aunque hayas pagado una sola mensualidad. En tu sesión te muestro cuánto cuesta según tu edad; suele ser una fracción pequeña de tu ingreso.',
      extraHtml: '',
      notesHtml,
      fine: 'Estimación ilustrativa basada en tu rango de ingreso; la suma asegurada ideal se define en la asesoría.',
      resumen: `Vida: suma sugerida ${fmt(suma)}`,
      deduce: false,
    };
  } else if (o === OBJ.EMPRESA) {
    const rd = ans.retiroDinero;
    const soloSueldo = rd === 0;
    const r = new Set<number>(ans.riesgos || []);
    const pres = new Set<number>(ans.prestaciones || []);
    const det: [string, string][] = [];
    if (ans.socios === 2)
      det.push([
        'Socios sin convenio',
        'Si un socio fallece, su familia hereda sus acciones. Un seguro entre socios da la liquidez para comprarles su parte a un precio acordado.',
      ]);
    if (ans.socios === 3)
      det.push([
        'Sin sucesor definido',
        'Un fallecimiento puede frenar la empresa. Un seguro de vida da liquidez inmediata a tus herederos.',
      ]);
    if (r.has(0))
      det.push([
        'Créditos que dependen de ti',
        'Si tú faltas, el banco puede exigir el pago. Un seguro con suma igual a la deuda la liquida sin tocar la operación.',
      ]);
    if (r.has(1)) {
      const mid = [500000, 3000000, 12500000, 30000000][ans.liquidez] || 3000000;
      det.push([
        'Liquidez parada',
        `Unos ${fmt(mid)} en cuentas generan una retención de ISR de cerca de ${fmt(mid * 0.009)} al año mientras la inflación reduce su valor.`,
      ]);
    }
    if (r.has(2))
      det.push(['Algo por vencer', 'Es el momento ideal para reubicar esos recursos en un plan deducible.']);
    if (r.has(3))
      det.push([
        'Tu retiro atado a la empresa',
        'Si tu retiro depende de venderla o seguir en ella, no eres libre de soltarla. Un plan de retiro a tu nombre separa tu futuro del negocio.',
      ]);
    if (r.has(4))
      det.push([
        'La empresa depende de tu día a día',
        'Una invalidez o enfermedad grave también la detiene. Hay coberturas que dan liquidez si tú no puedes operar.',
      ]);
    if (ans.empleados >= 1 && (pres.has(3) || !pres.has(0)))
      det.push([
        'Tu equipo sin gastos médicos colectivo',
        'Es una prestación deducible para la empresa y retiene talento con un peso que rinde más que un aumento de sueldo.',
      ]);
    if (ans.edad === 3)
      det.push([
        'Tu edad cuenta',
        'A partir de los 55 la suscripción médica es más estricta y las primas suben cada año.',
      ]);
    const lista = det.length
      ? `<div class="dx-note"><b>Lo que detectamos en tu empresa</b><ul class="dx-more">${det.map(([t, d]) => `<li><b>${t}:</b> ${d}</li>`).join('')}</ul></div>`
      : '';
    const aviso =
      rd === 1
        ? '<p class="dx-warn"><b>Ojo:</b> si solo recibes dividendos, el seguro de hombre clave no es deducible. La solución suele ser asignarte un sueldo razonable, algo que revisamos con tu contador.</p>'
        : '';
    result = {
      pre: soloSueldo
        ? `${nombre}, como recibes sueldo de tu empresa, con un Plan Personal de Retiro podrías recuperar hasta`
        : `${nombre}, de cada $100 de utilidad que tu empresa reparte como dividendo, a tu bolsillo llegan unos`,
      big: soloSueldo ? '$74,890' : '$58',
      unit: soloSueldo ? ' al año' : '',
      post: soloSueldo
        ? 'de ISR, aportando el tope deducible de $213,973 de 2026, con tasa marginal de 35%.'
        : 'Cerca de 42 centavos de cada peso se quedan en impuestos: ISR de la empresa, 10% adicional sobre dividendos y el ajuste en tu declaración anual.',
      planTitle: 'Tres soluciones, tres bolsillos',
      planBody: `<ul class="dx-more"><li><b>Tu empresa:</b> seguro de hombre clave con prima deducible.</li><li><b>Tú:</b> Plan Personal de Retiro deducible hasta $213,973 al año.</li><li><b>Tu salud:</b> gastos médicos mayores, también deducibles como persona física.</li></ul>${aviso}`,
      extraHtml: lista,
      notesHtml,
      fine: 'Cifras ilustrativas con base en la LISR. Dependen de tu situación fiscal real; valídalas con tu contador.',
      resumen: `Empresa: ${questions().find((q) => q.id === 'retiroDinero')?.o[rd]?.[0] || ''}; ${det.length} riesgos detectados`,
      deduce: false,
    };
  } else if (o === OBJ.GMM) {
    const status = [
      'Tu seguro personal es una gran base; revisemos que la suma asegurada y el deducible sigan al día.',
      'El seguro de tu trabajo termina el día que dejas ese empleo, y lo que te diagnostiquen antes puede quedar como preexistencia.',
      'Hoy cualquier hospitalización saldría de tu bolsillo o de tus ahorros.',
    ][ans.gmm] || '';
    result = {
      pre: `${nombre}, en México un solo siniestro de gastos médicos cuesta en promedio`,
      big: '$132,175',
      unit: '',
      post: 'Y los padecimientos graves cuestan mucho más:',
      planTitle: 'Asegúrate mientras estás sano',
      planBody:
        'Cada año que esperas, la prima sube por edad y crece el riesgo de que un padecimiento quede excluido. Ajustando deducible y hospitales, el plan se adapta a tu presupuesto.',
      extraHtml: `<div class="dx-note"><div class="dx-tablewrap"><table><tbody>
          <tr><td>Hemorragia cerebral</td><td><b>más de $425,000</b></td></tr>
          <tr><td>Complicaciones pediátricas</td><td><b>$344,000</b></td></tr>
          <tr><td>Cáncer y tumores</td><td><b>$334,000</b></td></tr>
          <tr><td>Un día de terapia intensiva</td><td><b>hasta $40,000</b></td></tr></tbody></table></div>
          <p class="dx-status"><b>Tu situación:</b> ${status}</p></div>`,
      notesHtml,
      fine: 'Costos promedio por siniestro reportados por la AMIS. El costo de terapia intensiva es una referencia de mercado.',
      resumen: `GMM: ${['tiene personal', 'solo el del trabajo', 'no tiene'][ans.gmm] || ''}`,
      deduce: false,
    };
  } else {
    const edad = EDAD[ans.edad] ?? 40;
    const meta = [20000, 40000, 60000, 100000][ans.meta] ?? 40000;
    const anios = Math.max(DX_CONFIG.edadRetiro - edad, 7);
    const fondo =
      (meta * 12 * (1 - Math.pow(1 + DX_CONFIG.tasaReal, -DX_CONFIG.aniosRetiro))) / DX_CONFIG.tasaReal;
    const mensual = up100(pmt(fondo, DX_CONFIG.tasaReal, anios));
    const cubre = pct(fvAhorro(m, DX_CONFIG.tasaReal, anios) / fondo);
    result = {
      pre: `${nombre}, para retirarte a los ${DX_CONFIG.edadRetiro} con ${fmt(meta)} al mes necesitas un fondo de unos`,
      big: fmt(fondo),
      unit: '',
      post: `en pesos de hoy. Lograrlo completo equivale a ahorrar unos ${fmt(mensual)} al mes durante ${anios} años. Pero no tienes que empezar con eso.`,
      planTitle: `Con ${fmt(m)} al mes ya construyes cerca del ${cubre}% de tu meta`,
      planBody:
        'Si subes tu aportación un poco cada año, te acercas al 100% sin sentirlo, y parte de lo que ahorras podrías recuperarlo en tu declaración anual.',
      extraHtml: '',
      notesHtml,
      fine: `Cálculo ilustrativo con un rendimiento real supuesto de ${(DX_CONFIG.tasaReal * 100).toFixed(0)}% anual y ${DX_CONFIG.aniosRetiro} años de retiro.`,
      resumen: `Retiro: fondo ${fmt(fondo)}; ${fmt(m)}/mes cubre ~${cubre}%`,
      deduce: true,
    };
  }

  if (!EMP(ans) && ans.ocupacion === 0 && [1, 2, 3].includes(ans.retiroDinero) && !otros.includes(OBJ.EMPRESA)) {
    result.notesHtml.push(
      '<div class="dx-note"><b>Como empresario, hay dinero que se te está yendo</b>De cada $100 de utilidad que sacas como dividendo, a tu bolsillo llegan unos $58. En tu sesión vemos cómo convertir parte de ese impuesto en protección y retiro.</div>',
    );
  }
  if (result.deduce && ans.ocupacion <= 2) {
    result.notesHtml.push(
      '<div class="dx-note"><b>Podrías recuperar parte de este ahorro vía SAT</b>Las aportaciones a un plan personal de retiro pueden ser deducibles, dentro de los límites de la ley.</div>',
    );
  }
  if (ans.objetivo !== OBJ.GMM && ans.gmm !== 0 && !otros.includes(OBJ.GMM)) {
    result.notesHtml.push(
      `<div class="dx-note"><b>Un punto a revisar</b>${ans.gmm === 1 ? 'El seguro de tu trabajo termina si cambias de empleo.' : 'Sin gastos médicos mayores, una sola hospitalización (en promedio $132,175 según la AMIS) puede consumir años de ahorro.'}</div>`,
    );
  }

  return result;
}

export function seedAnswers(preset: number): DxAnswers {
  const ans: DxAnswers = {};
  if (preset >= 0) {
    ans.intereses = [preset];
    ans.objetivo = preset;
  }
  return ans;
}
