import assert from 'node:assert/strict';
import test from 'node:test';
import { OBJ } from '../src/lib/diagnostico.ts';
import {
  LEAD_INTENT_EVENT,
  classifyLeadIntent,
} from '../src/lib/lead-intent.ts';

test('form objective indexes stay aligned with the classifier', () => {
  assert.equal(OBJ.RETIRO, 0);
  assert.equal(OBJ.EDU, 1);
  assert.equal(OBJ.PATRIMONIO, 2);
  assert.equal(OBJ.FAMILIA, 3);
  assert.equal(OBJ.EMPRESA, 4);
  assert.equal(OBJ.GMM, 5);
});

test('priority life, savings, retirement, education and family protection are vida', () => {
  for (const objetivo of [OBJ.RETIRO, OBJ.EDU, OBJ.PATRIMONIO, OBJ.FAMILIA]) {
    const intent = classifyLeadIntent({ objetivo, intereses: [objetivo, OBJ.GMM] });
    assert.equal(intent, 'vida_ahorro_retiro');
    assert.equal(LEAD_INTENT_EVENT[intent], 'asesores_form_vida');
  }
});

test('priority gastos médicos is gmm even if other interests were selected', () => {
  const intent = classifyLeadIntent({
    objetivo: OBJ.GMM,
    intereses: [OBJ.RETIRO, OBJ.GMM],
  });
  assert.equal(intent, 'gmm');
  assert.equal(LEAD_INTENT_EVENT[intent], 'asesores_form_gmm');
});

test('a single selected interest classifies when priority was copied from it', () => {
  assert.equal(classifyLeadIntent({ intereses: [OBJ.EDU] }), 'vida_ahorro_retiro');
  assert.equal(classifyLeadIntent({ intereses: [OBJ.GMM] }), 'gmm');
});

test('empresa-only and mixed interests without a priority are sin_definir', () => {
  assert.equal(classifyLeadIntent({ objetivo: OBJ.EMPRESA, intereses: [OBJ.EMPRESA] }), 'sin_definir');
  assert.equal(
    classifyLeadIntent({ intereses: [OBJ.RETIRO, OBJ.GMM] }),
    'sin_definir',
  );
  assert.equal(classifyLeadIntent({}), 'sin_definir');
  assert.equal(LEAD_INTENT_EVENT.sin_definir, 'asesores_form_otro');
});

test('having or not having a medical policy does not change intent', () => {
  assert.equal(
    classifyLeadIntent({ objetivo: OBJ.RETIRO, intereses: [OBJ.RETIRO] }),
    'vida_ahorro_retiro',
  );
});
