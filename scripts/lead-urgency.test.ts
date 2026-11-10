import assert from 'node:assert/strict';
import test from 'node:test';
import { questions } from '../src/lib/diagnostico.ts';
import { LEAD_INTENT_TELEGRAM } from '../src/lib/lead-intent.ts';
import {
  CUANDO_OPTIONS,
  URGENCIA_TELEGRAM,
  classifyUrgencia,
  isAsesoresCalificado,
} from '../src/lib/lead-urgency.ts';

test('timing options stay in the order the form shows them', () => {
  const cuando = questions().find((q) => q.id === 'cuando');
  assert.ok(cuando);
  assert.deepEqual(
    cuando.o.map(([label]) => label),
    [...CUANDO_OPTIONS],
  );
});

test('maps each timing answer to urgencia', () => {
  assert.equal(classifyUrgencia(0), 'caliente');
  assert.equal(classifyUrgencia(1), 'tibio');
  assert.equal(classifyUrgencia(2), 'frio');
  assert.equal(classifyUrgencia(undefined), 'sin_dato');
  assert.equal(classifyUrgencia(null), 'sin_dato');
  assert.equal(classifyUrgencia(9), 'sin_dato');
});

test('telegram labels are plain uppercase text', () => {
  assert.deepEqual(URGENCIA_TELEGRAM, {
    caliente: 'CALIENTE',
    tibio: 'TIBIO',
    frio: 'FRÍO',
    sin_dato: 'SIN DATO',
  });
  assert.equal(LEAD_INTENT_TELEGRAM.vida_ahorro_retiro, 'VIDA/AHORRO/RETIRO');
  assert.equal(LEAD_INTENT_TELEGRAM.gmm, 'GMM');
  assert.equal(LEAD_INTENT_TELEGRAM.sin_definir, 'SIN DEFINIR');
  const labels = [...Object.values(URGENCIA_TELEGRAM), ...Object.values(LEAD_INTENT_TELEGRAM)];
  assert.equal(labels.some((label) => /\p{Extended_Pictographic}/u.test(label)), false);
});

test('asesores_form_calificado only for vida leads that are caliente or tibio', () => {
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'caliente'), true);
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'tibio'), true);
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'frio'), false);
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'sin_dato'), false);
  assert.equal(isAsesoresCalificado('gmm', 'caliente'), false);
  assert.equal(isAsesoresCalificado('gmm', 'tibio'), false);
  assert.equal(isAsesoresCalificado('sin_definir', 'caliente'), false);
});
