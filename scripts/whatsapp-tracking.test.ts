import assert from 'node:assert/strict';
import test from 'node:test';
import {
  bindWhatsAppClickTracking,
  isWhatsAppUrl,
  normalizePath,
  resolveWhatsAppClick,
  whatsappClickEventForPath,
  type WhatsAppAnchor,
} from '../src/lib/whatsapp-tracking.ts';

function anchor(partial: Partial<WhatsAppAnchor> & { href?: string; onclick?: string | null; selfTracked?: boolean; trackOff?: boolean; inDiagnostic?: boolean }): WhatsAppAnchor {
  const href = partial.href ?? 'https://wa.me/524461354113';
  return {
    getAttribute(name: string) {
      if (name === 'href') return href;
      if (name === 'onclick') return partial.onclick ?? null;
      if (name === 'data-wa-track') return partial.trackOff ? 'off' : null;
      return null;
    },
    hasAttribute(name: string) {
      return name === 'data-wa-self-tracked' && Boolean(partial.selfTracked);
    },
    closest(selector: string) {
      if (selector === '[data-dx]' && partial.inDiagnostic) return { diagnostic: true };
      if (selector === '[data-wa-track="off"]' && partial.trackOff) return { off: true };
      return null;
    },
  };
}

test('normalizes trailing slashes and case', () => {
  assert.equal(normalizePath('/Asesores-Seguros-Monterrey-NYL/'), '/asesores-seguros-monterrey-nyl');
  assert.equal(normalizePath('/segubecalanding/Segubeca'), '/segubecalanding/segubeca');
  assert.equal(normalizePath('/'), '/');
});

test('maps campaign paths and ignores the rest of the site', () => {
  assert.equal(whatsappClickEventForPath('/asesores-seguros-monterrey'), 'asesores_whatsapp');
  assert.equal(whatsappClickEventForPath('/asesores-seguros-monterrey-nyl/'), 'asesores_whatsapp');
  assert.equal(whatsappClickEventForPath('/seguros-vida/segubeca'), 'segubeca_whatsapp');
  assert.equal(whatsappClickEventForPath('/segubecalanding'), 'segubeca_whatsapp');
  assert.equal(whatsappClickEventForPath('/segubecalanding/Segubeca'), 'segubeca_whatsapp');
  assert.equal(whatsappClickEventForPath('/seguros-vida/vida-mujer'), 'vidamujer_whatsapp');
  assert.equal(whatsappClickEventForPath('/vidamujerlanding'), 'vidamujer_whatsapp');
  assert.equal(whatsappClickEventForPath('/seguro-de-vida-mujer'), null);
  assert.equal(whatsappClickEventForPath('/'), null);
  assert.equal(whatsappClickEventForPath('/contacto'), null);
  assert.equal(whatsappClickEventForPath('/seguros-vida/star-dotal'), null);
  assert.equal(whatsappClickEventForPath('/diagnostico'), null);
});

test('recognizes WhatsApp hosts only', () => {
  assert.equal(isWhatsAppUrl('https://wa.me/524461354113?text=Hola'), true);
  assert.equal(isWhatsAppUrl('https://api.whatsapp.com/send/?phone=524461354113'), true);
  assert.equal(isWhatsAppUrl('https://web.whatsapp.com/send?phone=524461354113'), true);
  assert.equal(isWhatsAppUrl('tel:+524461354113'), false);
  assert.equal(isWhatsAppUrl('#contacto'), false);
  assert.equal(isWhatsAppUrl('/contacto'), false);
});

test('asesores floating and inline links push asesores_whatsapp once per resolution', () => {
  const hit = resolveWhatsAppClick('/asesores-seguros-monterrey-nyl/', anchor({}));
  assert.deepEqual(hit, {
    event: 'asesores_whatsapp',
    event_category: 'conversion',
    event_label: 'Asesores Monterrey WhatsApp Contact',
    value: 1,
    currency: 'MXN',
  });
  assert.equal(
    resolveWhatsAppClick('/asesores-seguros-monterrey', anchor({ href: 'https://api.whatsapp.com/send/?phone=524461354113' }))?.event,
    'asesores_whatsapp',
  );
});

test('segubeca and vida mujer pages use their own events', () => {
  assert.equal(resolveWhatsAppClick('/seguros-vida/segubeca', anchor({}))?.event, 'segubeca_whatsapp');
  assert.equal(resolveWhatsAppClick('/seguros-vida/vida-mujer', anchor({}))?.event_label, 'Vida Mujer WhatsApp CTA');
  assert.equal(resolveWhatsAppClick('/vidamujerlanding', anchor({}))?.event, 'vidamujer_whatsapp');
});

test('other pages and non-WhatsApp links push nothing', () => {
  assert.equal(resolveWhatsAppClick('/', anchor({ href: 'https://api.whatsapp.com/send/?phone=524461354113' })), null);
  assert.equal(resolveWhatsAppClick('/contacto', anchor({})), null);
  assert.equal(resolveWhatsAppClick('/asesores-seguros-monterrey-nyl', anchor({ href: 'tel:+524461354113' })), null);
  assert.equal(resolveWhatsAppClick('/asesores-seguros-monterrey-nyl', anchor({ href: '#contacto' })), null);
});

test('diagnostic result links and self-tracked buttons are not counted again', () => {
  assert.equal(resolveWhatsAppClick('/asesores-seguros-monterrey-nyl', anchor({ inDiagnostic: true })), null);
  assert.equal(resolveWhatsAppClick('/seguros-vida/segubeca', anchor({ trackOff: true })), null);
  assert.equal(resolveWhatsAppClick('/vidamujerlanding', anchor({ selfTracked: true })), null);
  assert.equal(
    resolveWhatsAppClick(
      '/vidamujerlanding',
      anchor({ onclick: "dataLayer.push({ event: 'vidamujer_whatsapp' }); return true;" }),
    ),
    null,
  );
  assert.equal(
    resolveWhatsAppClick(
      '/segubecalanding',
      anchor({ onclick: "dataLayer.push({ event: 'segubeca_whatsapp' });" }),
    ),
    null,
  );
});

test('bind pushes once per primary click and does not cancel navigation', () => {
  const calls: Array<(event: { button?: number; target: { closest: (sel: string) => unknown }; preventDefault?: () => void }) => void> = [];
  const win: { dataLayer?: unknown[]; __rpWaClickBound?: boolean } = {};
  const link = anchor({});
  bindWhatsAppClickTracking({
    document: {
      addEventListener(_type, listener) {
        calls.push(listener as typeof calls[number]);
      },
    },
    window: win,
    location: {
      pathname: '/asesores-seguros-monterrey-nyl',
      href: 'https://segurosrp.com/asesores-seguros-monterrey-nyl',
    },
  });
  bindWhatsAppClickTracking({
    document: {
      addEventListener() {
        throw new Error('listener bound twice');
      },
    },
    window: win,
    location: { pathname: '/asesores-seguros-monterrey-nyl', href: 'https://segurosrp.com/asesores-seguros-monterrey-nyl' },
  });

  let prevented = false;
  calls[0]({
    button: 0,
    target: { closest: (sel) => (sel === 'a' ? link : null) },
    preventDefault() {
      prevented = true;
    },
  });
  calls[0]({
    button: 1,
    target: { closest: () => link },
  });
  calls[0]({
    button: 0,
    target: { closest: () => anchor({ inDiagnostic: true }) },
  });

  assert.equal(prevented, false);
  assert.equal(win.dataLayer?.length, 1);
  assert.equal((win.dataLayer?.[0] as { event: string }).event, 'asesores_whatsapp');
});
