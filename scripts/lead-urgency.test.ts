import assert from 'node:assert/strict';
import test from 'node:test';
import { questions } from '../src/lib/diagnostico.ts';
import {
  CUANDO_OPTIONS,
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

test('asesores_form_calificado only for vida leads that are caliente or tibio', () => {
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'caliente'), true);
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'tibio'), true);
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'frio'), false);
  assert.equal(isAsesoresCalificado('vida_ahorro_retiro', 'sin_dato'), false);
  assert.equal(isAsesoresCalificado('gmm', 'caliente'), false);
  assert.equal(isAsesoresCalificado('gmm', 'tibio'), false);
  assert.equal(isAsesoresCalificado('sin_definir', 'caliente'), false);
});
