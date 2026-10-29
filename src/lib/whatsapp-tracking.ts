/**
 * One dataLayer custom event per WhatsApp click CTA.
 * GTM-5C5DGHJC listens for these event names. The diagnostic result
 * link is not a click CTA: that flow already pushes the form event.
 */

export const WHATSAPP_CLICK_EVENTS = {
  asesores: 'asesores_whatsapp',
  segubeca: 'segubeca_whatsapp',
  vidamujer: 'vidamujer_whatsapp',
} as const;

export type WhatsAppClickEventName =
  (typeof WHATSAPP_CLICK_EVENTS)[keyof typeof WHATSAPP_CLICK_EVENTS];

export interface WhatsAppClickPayload {
  event: WhatsAppClickEventName;
  event_category: 'conversion';
  event_label: string;
  value: 1;
  currency: 'MXN';
}

const EVENT_LABELS: Record<WhatsAppClickEventName, string> = {
  asesores_whatsapp: 'Asesores Monterrey WhatsApp Contact',
  segubeca_whatsapp: 'Segubeca WhatsApp Contact',
  vidamujer_whatsapp: 'Vida Mujer WhatsApp CTA',
};

const PATH_EVENTS: Record<string, WhatsAppClickEventName> = {
  '/asesores-seguros-monterrey': 'asesores_whatsapp',
  '/asesores-seguros-monterrey-nyl': 'asesores_whatsapp',
  '/seguros-vida/segubeca': 'segubeca_whatsapp',
  '/segubecalanding': 'segubeca_whatsapp',
  '/segubecalanding/segubeca': 'segubeca_whatsapp',
  '/seguros-vida/vida-mujer': 'vidamujer_whatsapp',
  '/vidamujerlanding': 'vidamujer_whatsapp',
};

export interface WhatsAppAnchor {
  getAttribute(name: string): string | null;
  hasAttribute(name: string): boolean;
  closest(selector: string): unknown;
}

export interface WhatsAppClickDeps {
  document: {
    addEventListener(
      type: string,
      listener: (event: WhatsAppClickEvent) => void,
      capture?: boolean,
    ): void;
  };
  window: WhatsAppClickWindow;
  location: { pathname: string; href: string };
}

interface WhatsAppClickWindow {
  dataLayer?: unknown[];
  __rpWaClickBound?: boolean;
}

interface WhatsAppClickEvent {
  button?: number;
  defaultPrevented?: boolean;
  target: EventTarget | null;
  preventDefault?: () => void;
}

export function normalizePath(pathname: string): string {
  const withoutHash = pathname.split('#')[0] ?? '';
  const withoutQuery = withoutHash.split('?')[0] ?? '';
  let path = withoutQuery;
  try {
    path = decodeURIComponent(path);
  } catch {
    path = withoutQuery;
  }
  path = path.toLowerCase();
  if (path.length > 1 && path.endsWith('/')) path = path.slice(0, -1);
  if (!path.startsWith('/')) path = `/${path}`;
  return path;
}

export function whatsappClickEventForPath(pathname: string): WhatsAppClickEventName | null {
  return PATH_EVENTS[normalizePath(pathname)] ?? null;
}

export function isWhatsAppUrl(href: string, base = 'https://segurosrp.com/'): boolean {
  const raw = href.trim();
  if (!raw || raw.startsWith('#') || raw.toLowerCase().startsWith('javascript:')) return false;
  try {
    const url = new URL(raw, base);
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    return host === 'wa.me' || host === 'api.whatsapp.com' || host === 'whatsapp.com' || host === 'web.whatsapp.com';
  } catch {
    return false;
  }
}

function payload(event: WhatsAppClickEventName): WhatsAppClickPayload {
  return {
    event,
    event_category: 'conversion',
    event_label: EVENT_LABELS[event],
    value: 1,
    currency: 'MXN',
  };
}

/**
 * Returns the dataLayer object for this click, or null when the click
 * must not be counted (wrong page, not a WhatsApp URL, diagnostic
 * follow-up, or a button that already pushes the same event).
 */
export function resolveWhatsAppClick(
  pathname: string,
  anchor: WhatsAppAnchor,
  base?: string,
): WhatsAppClickPayload | null {
  const href = anchor.getAttribute('href') || '';
  if (!isWhatsAppUrl(href, base)) return null;
  if (anchor.getAttribute('data-wa-track') === 'off') return null;
  if (anchor.closest('[data-dx]')) return null;
  if (anchor.closest('[data-wa-track="off"]')) return null;

  const event = whatsappClickEventForPath(pathname);
  if (!event) return null;

  if (anchor.hasAttribute('data-wa-self-tracked')) return null;
  const onclick = anchor.getAttribute('onclick') || '';
  if (onclick.includes(event)) return null;

  return payload(event);
}

function anchorFromTarget(target: EventTarget | null): WhatsAppAnchor | null {
  if (!target || typeof (target as { closest?: unknown }).closest !== 'function') return null;
  const closest = (target as WhatsAppAnchor).closest('a');
  if (!closest || typeof (closest as WhatsAppAnchor).getAttribute !== 'function') return null;
  return closest as WhatsAppAnchor;
}

export function bindWhatsAppClickTracking(deps?: Partial<WhatsAppClickDeps>): void {
  const doc = deps?.document ?? (typeof document === 'undefined' ? undefined : document);
  const win = deps?.window ?? (typeof window === 'undefined' ? undefined : (window as WhatsAppClickWindow));
  const loc = deps?.location ?? (typeof location === 'undefined' ? undefined : location);
  if (!doc || !win || !loc || win.__rpWaClickBound) return;
  win.__rpWaClickBound = true;

  doc.addEventListener(
    'click',
    (event) => {
      if (typeof event.button === 'number' && event.button !== 0) return;
      const anchor = anchorFromTarget(event.target);
      if (!anchor) return;
      const hit = resolveWhatsAppClick(loc.pathname, anchor, loc.href);
      if (!hit) return;
      win.dataLayer = win.dataLayer || [];
      win.dataLayer.push(hit);
    },
    true,
  );
}
