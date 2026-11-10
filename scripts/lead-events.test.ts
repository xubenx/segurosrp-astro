import assert from 'node:assert/strict';
import test from 'node:test';
import { formDataLayerPayload, isReservedLeadEvent } from '../src/lib/lead-events.ts';

test('campaign form events keep their name and do not gain page fields', () => {
  const extra = { perfil: 'A', puntos: 12, objetivo: 'retiro' };
  for (const name of ['asesores_form', 'segubeca_form', 'vidamujer_form', 'segubeca_whatsapp']) {
    assert.equal(isReservedLeadEvent(name), true);
    assert.deepEqual(formDataLayerPayload(name, '/contacto', 'contacto', extra), {
      perfil: 'A',
      puntos: 12,
      objetivo: 'retiro',
      event: name,
    });
  }
});

test('other forms use lead_form with page and section', () => {
  assert.equal(isReservedLeadEvent('home_form'), false);
  assert.deepEqual(
    formDataLayerPayload('contacto_form', '/contacto', 'Página de Contacto', { perfil: 'B' }),
    {
      perfil: 'B',
      event: 'lead_form',
      event_category: 'conversion',
      event_label: 'contacto_form',
      page: '/contacto',
      section: 'Página de Contacto',
    },
  );
});
